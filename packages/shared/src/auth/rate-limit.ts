import { Request, Response } from 'express';

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

/** Client IP behind nginx (first X-Forwarded-For hop) or socket address. */
export function clientIp(req: Request): string {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) {
    return xf.split(',')[0].trim();
  }
  if (Array.isArray(xf) && xf[0]) {
    return String(xf[0]).split(',')[0].trim();
  }
  return String(req.ip || req.socket.remoteAddress || 'unknown');
}

/**
 * Simple in-memory rate limit (per-process).
 * Enough for single-instance PM2 fork. Use `name` to isolate buckets.
 */
export function rateLimit(options: {
  name?: string;
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
}) {
  const prefix = options.name || 'default';
  const keyFn = options.key || ((req: Request) => clientIp(req));

  return (req: Request, res: Response, next: () => void): void => {
    const key = `${prefix}:${keyFn(req)}`;
    const now = Date.now();
    let hit = buckets.get(key);
    if (!hit || hit.resetAt <= now) {
      hit = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, hit);
    }
    hit.count += 1;
    const remaining = Math.max(0, options.max - hit.count);
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(hit.resetAt / 1000)));
    if (hit.count > options.max) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Try again later.',
        },
      });
      return;
    }
    next();
  };
}
