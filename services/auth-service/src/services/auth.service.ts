import { createHash, randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import {
  resolveUserId,
  signAccessToken,
  verifyAccessToken,
} from '../../../../packages/shared/src/auth/jwt';
import { AuthRepository } from '../repositories/auth.repository';
import {
  AuthLoginDto,
  BindDeviceDto,
  BindingRow,
  DevicePlatform,
  PublicUser,
} from '../types/auth.types';
import { env } from '../config/env';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function resolveDeviceId(dto: { deviceId?: string; deviceFingerprint?: string }): string | undefined {
  const id = dto.deviceId?.trim() || dto.deviceFingerprint?.trim();
  return id || undefined;
}

function bindingResponse(b: BindingRow) {
  return {
    deviceId: b.device_fingerprint,
    boundAt: new Date(b.bound_at).toISOString(),
  };
}

function bindingDetailResponse(b: BindingRow) {
  return {
    bound: true,
    deviceId: b.device_fingerprint,
    deviceName: b.device_name,
    platform: b.platform,
    appVersion: b.app_version,
    boundAt: new Date(b.bound_at).toISOString(),
    lastSeenAt: new Date(b.last_seen_at).toISOString(),
  };
}

function isWebLogin(platform?: string): boolean {
  return (platform || '').toLowerCase() === 'web';
}

function mobilePlatform(platform?: string): DevicePlatform {
  return platform === 'ios' ? 'ios' : 'android';
}

/**
 * Access-token session auth (no refresh endpoint):
 * - Access: HS256 JWT (jti = session id)
 * - Session row stored for logout revoke only
 * - Mobile (android/ios): one-device bind via deviceId
 * - Web admin: no device bind
 */
async function issueAccessSession(user: PublicUser, deviceFingerprint: string) {
  const sessionToken = `st_${randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + env.accessTokenTtlSec * 1000);
  const session = await AuthRepository.createSession({
    userId: user.id,
    sessionTokenHash: hashToken(sessionToken),
    deviceFingerprint,
    expiresAt,
  });

  const accessToken = signAccessToken(
    { sub: user.id, email: user.email, jti: session.id },
    env.jwtSecret,
    env.accessTokenTtlSec
  );

  return {
    accessToken,
    tokenType: 'Bearer' as const,
    expiresIn: env.accessTokenTtlSec,
  };
}

export const AuthService = {
  async login(dto: AuthLoginDto) {
    const email = dto.email?.trim();
    const agentId = dto.agentId?.trim();
    const password = dto.password;
    const web = isWebLogin(dto.platform);
    const deviceId = resolveDeviceId(dto);

    if ((!email && !agentId) || !password) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'password and either email or agentId are required',
      };
    }

    if (!web && !deviceId) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'deviceId is required for mobile login',
      };
    }

    const user = email
      ? await AuthRepository.findUserByEmail(email)
      : await AuthRepository.findUserByAgentId(agentId!);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return {
        ok: false as const,
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: email
          ? 'Email or password is incorrect.'
          : 'Agent Account ID or password is incorrect.',
      };
    }

    const sessionFingerprint = deviceId || `web-admin:${user.id}`;

    let deviceBinding: ReturnType<typeof bindingResponse> | null = null;

    if (!web) {
      const existing = await AuthRepository.getBinding(user.id);
      let binding: BindingRow;
      if (!existing) {
        binding = await AuthRepository.createBinding({
          userId: user.id,
          deviceFingerprint: sessionFingerprint,
          deviceName: dto.deviceName || 'Unknown device',
          platform: mobilePlatform(dto.platform),
          appVersion: dto.appVersion || '1.0.0',
        });
      } else if (existing.device_fingerprint !== sessionFingerprint) {
        return {
          ok: false as const,
          status: 403,
          code: 'ACCOUNT_BOUND_TO_OTHER_DEVICE',
          message: 'This account is already bound to another device.',
        };
      } else {
        binding = await AuthRepository.touchBinding(user.id, {
          deviceName: dto.deviceName,
          appVersion: dto.appVersion,
        });
      }
      deviceBinding = bindingResponse(binding);
    } else {
      const existing = await AuthRepository.getBinding(user.id);
      deviceBinding = existing ? bindingResponse(existing) : null;
    }

    await AuthRepository.revokeAllSessionsForUser(user.id);
    const tokens = await issueAccessSession(user.public, sessionFingerprint);

    return {
      ok: true as const,
      data: {
        ...tokens,
        deviceBinding,
        user: user.public,
      },
    };
  },

  async logout(authorization?: string) {
    const userId = resolveUserId(authorization, env.jwtSecret);
    if (!userId) {
      return {
        ok: false as const,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      };
    }

    const raw = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    const claims = raw ? verifyAccessToken(raw, env.jwtSecret) : null;
    if (claims?.jti) {
      await AuthRepository.revokeSession(claims.jti);
    } else {
      await AuthRepository.revokeAllSessionsForUser(userId);
    }

    return { ok: true as const, data: { success: true } };
  },

  async getBinding(userId: string) {
    const binding = await AuthRepository.getBinding(userId);
    if (!binding) {
      return {
        ok: false as const,
        status: 404,
        code: 'NOT_FOUND',
        message: 'No device binding for this account.',
      };
    }
    return { ok: true as const, data: bindingDetailResponse(binding) };
  },

  async bind(userId: string, dto: BindDeviceDto) {
    const deviceId = resolveDeviceId(dto);
    if (!deviceId) {
      return {
        ok: false as const,
        status: 400,
        code: 'DEVICE_ID_REQUIRED',
        message: 'deviceId is required',
      };
    }
    const existing = await AuthRepository.getBinding(userId);
    if (existing && existing.device_fingerprint !== deviceId) {
      return {
        ok: false as const,
        status: 409,
        code: 'DEVICE_ALREADY_BOUND',
        message: 'This account is already bound to another device.',
      };
    }
    const binding = existing
      ? await AuthRepository.touchBinding(userId, {
          deviceName: dto.deviceName,
          appVersion: dto.appVersion,
        })
      : await AuthRepository.createBinding({
          userId,
          deviceFingerprint: deviceId,
          deviceName: dto.deviceName || 'Unknown device',
          platform: dto.platform === 'ios' ? 'ios' : 'android',
          appVersion: dto.appVersion || '1.0.0',
        });
    return { ok: true as const, data: bindingResponse(binding) };
  },

  resolveUserId(authorization?: string): string | null {
    return resolveUserId(authorization, env.jwtSecret);
  },
};
