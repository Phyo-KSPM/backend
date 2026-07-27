import { Request, Response, NextFunction, RequestHandler } from 'express';

function isLoopback(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('127.')
  );
}

/**
 * Allow /health only from direct local access (SSH → localhost).
 * Requests via nginx/public proxy (X-Forwarded-For / X-Real-IP) get 404.
 */
export function localOnlyHealth(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    if (forwarded) {
      res.status(404).json({ message: `Route ${req.originalUrl} not found` });
      return;
    }
    const ip = req.socket.remoteAddress || '';
    if (!isLoopback(ip)) {
      res.status(404).json({ message: `Route ${req.originalUrl} not found` });
      return;
    }
    handler(req, res, next);
  };
}
