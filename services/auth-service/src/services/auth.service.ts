import { createHash, randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import {
  resolveUserId,
  signAccessToken,
} from '../../../../packages/shared/src/auth/jwt';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthLoginDto, BindDeviceDto, BindingRow, PublicUser } from '../types/auth.types';
import { env } from '../config/env';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function bindingResponse(b: BindingRow, includeExtras = false) {
  return {
    bound: true,
    deviceFingerprint: b.device_fingerprint,
    deviceName: b.device_name,
    platform: b.platform,
    boundAt: new Date(b.bound_at).toISOString(),
    ...(includeExtras
      ? {
          appVersion: b.app_version,
          lastSeenAt: new Date(b.last_seen_at).toISOString(),
        }
      : {}),
  };
}

async function issueTokens(user: PublicUser) {
  const accessToken = signAccessToken(
    { sub: user.id, email: user.email },
    env.jwtSecret,
    env.accessTokenTtlSec
  );
  const refreshToken = `rt_${randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await AuthRepository.saveRefreshToken(user.id, hashToken(refreshToken), expiresAt);
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer' as const,
    expiresIn: env.accessTokenTtlSec,
  };
}

export const AuthService = {
  async login(dto: AuthLoginDto) {
    if (!dto.email || !dto.password || !dto.deviceFingerprint) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'email, password and deviceFingerprint are required',
      };
    }

    const user = await AuthRepository.findUserByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      return {
        ok: false as const,
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect.',
      };
    }

    const existing = await AuthRepository.getBinding(user.id);
    let binding: BindingRow;
    if (!existing) {
      binding = await AuthRepository.createBinding({
        userId: user.id,
        deviceFingerprint: dto.deviceFingerprint,
        deviceName: dto.deviceName || 'Unknown device',
        platform: dto.platform || 'android',
        appVersion: dto.appVersion || '1.0.0',
      });
    } else if (existing.device_fingerprint !== dto.deviceFingerprint) {
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

    const tokens = await issueTokens(user.public);
    return {
      ok: true as const,
      data: {
        ...tokens,
        user: user.public,
        deviceBinding: bindingResponse(binding),
      },
    };
  },

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'refreshToken is required',
      };
    }
    const record = await AuthRepository.findRefreshToken(hashToken(refreshToken));
    if (!record || new Date(record.expires_at) < new Date()) {
      return {
        ok: false as const,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      };
    }
    const user = await AuthRepository.findUserById(record.user_id);
    if (!user) {
      return {
        ok: false as const,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'User not found',
      };
    }
    await AuthRepository.deleteRefreshToken(hashToken(refreshToken));
    return { ok: true as const, data: await issueTokens(user) };
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
    return { ok: true as const, data: bindingResponse(binding, true) };
  },

  async bind(userId: string, dto: BindDeviceDto) {
    if (!dto.deviceFingerprint) {
      return {
        ok: false as const,
        status: 400,
        code: 'DEVICE_FINGERPRINT_REQUIRED',
        message: 'deviceFingerprint is required',
      };
    }
    const existing = await AuthRepository.getBinding(userId);
    if (existing && existing.device_fingerprint !== dto.deviceFingerprint) {
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
          deviceFingerprint: dto.deviceFingerprint,
          deviceName: dto.deviceName || 'Unknown device',
          platform: dto.platform || 'android',
          appVersion: dto.appVersion || '1.0.0',
        });
    return { ok: true as const, data: bindingResponse(binding) };
  },

  resolveUserId(authorization?: string): string | null {
    return resolveUserId(authorization, env.jwtSecret);
  },
};
