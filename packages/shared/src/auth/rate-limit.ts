import { Request, Response } from 'express';

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

/** Simple in-memory rate limit (per-process). Enough for single-instance PM2 fork. */
export function rateLimit(options: {
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
}) {
  const keyFn =
    options.key ||
    ((req: Request) =>
      String(req.ip || req.socket.remoteAddress || 'unknown'));

  return (req: Request, res: Response, next: () => void): void => {
    const key = keyFn(req);
    const now = Date.now();
    let hit = buckets.get(key);
    if (!hit || hit.resetAt <= now) {
      hit = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, hit);
    }
    hit.count += 1;
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.max - hit.count)));
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
