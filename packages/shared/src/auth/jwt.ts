import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

const WEAK_SECRETS = new Set([
  '',
  'change-me-in-production',
  'secret',
  'jwt-secret',
  'password',
]);

export type AccessTokenClaims = {
  sub: string;
  email?: string;
  /** Auth session id — ties JWT to a DB session row */
  jti?: string;
  iat: number;
  exp: number;
};

function b64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function hmacSign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Reject empty / documented defaults / short secrets (production must fail boot). */
export function assertJwtSecret(secret: string | undefined): string {
  const value = (secret || '').trim();
  const isProd = process.env.NODE_ENV === 'production';
  const allowWeak = process.env.ALLOW_WEAK_JWT === 'true';
  const weak =
    value.length < 32 || WEAK_SECRETS.has(value) || value === 'change-me-in-production';

  if (weak) {
    if (isProd || !allowWeak) {
      throw new Error(
        [
          'JWT_SECRET is missing or too weak (min 32 chars; do not use change-me-in-production).',
          'Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
          'Local-only escape hatch: ALLOW_WEAK_JWT=true (never on production).',
        ].join(' ')
      );
    }
    console.warn(
      '[security] Weak JWT_SECRET allowed via ALLOW_WEAK_JWT — do not use in production'
    );
  }
  return value;
}

export function generateJwtSecret(): string {
  return randomBytes(48).toString('base64url');
}

export function signAccessToken(
  claims: { sub: string; email?: string; jti: string },
  secret: string,
  expiresInSec = 3600
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = b64urlJson({
    sub: claims.sub,
    jti: claims.jti,
    ...(claims.email ? { email: claims.email } : {}),
    iat: now,
    exp: now + expiresInSec,
  });
  const data = `${header}.${payload}`;
  // Standard JWT: header.payload.signature (never "demo.*" prefixes)
  return `${data}.${hmacSign(data, secret)}`;
}

export function verifyAccessToken(
  token: string,
  secret: string
): AccessTokenClaims | null {
  if (!token || token.startsWith('demo.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = hmacSign(data, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AccessTokenClaims;
    if (!parsed?.sub || typeof parsed.sub !== 'string') return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp !== 'number' || parsed.exp < now) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Returns user id from Bearer token, or null if missing/invalid/expired. */
export function resolveUserId(
  authorization: string | undefined,
  secret: string
): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;
  return verifyAccessToken(token, secret)?.sub ?? null;
}

export const unauthorizedBody = {
  success: false as const,
  error: { code: 'UNAUTHORIZED' as const, message: 'Unauthorized' },
};
