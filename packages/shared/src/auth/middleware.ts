import { Request, Response, NextFunction } from 'express';
import { resolveUserId, unauthorizedBody } from './jwt';

export type AuthedRequest = Request & { userId?: string };

/** Require valid Bearer JWT. Sets `req.userId`. */
export function requireAuth(jwtSecret: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const userId = resolveUserId(req.header('authorization') || undefined, jwtSecret);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    req.userId = userId;
    next();
  };
}

/** Skip auth when `isPublic` returns true (login / nrc reference only). */
export function requireAuthUnless(
  jwtSecret: string,
  isPublic: (req: Request) => boolean
) {
  const auth = requireAuth(jwtSecret);
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (isPublic(req)) {
      next();
      return;
    }
    auth(req, res, next);
  };
}

/** Gateway public routes — everything else needs a mobile access token. */
export function isGatewayPublicRoute(req: Request): boolean {
  // CORS preflight must pass without Authorization
  if (req.method === 'OPTIONS') return true;
  const path = req.path.replace(/\/+$/, '') || '/';

  if (req.method === 'GET' && path === '/nrc/townships') return true;

  if (req.method !== 'POST') return false;
  return path === '/login' || path === '/auth/login' || path === '/bff/login';
}
