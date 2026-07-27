import { Request, Response, NextFunction } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = req.header('x-request-id') || `gw-${Date.now()}`;
  res.setHeader('x-request-id', id);
  (req as any).requestId = id;
  next();
}
