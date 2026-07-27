import { Request, Response } from 'express';
import { resolveUserId, unauthorizedBody } from '../../../../packages/shared/src/auth/jwt';
import { ClaimsService } from '../services/claims.service';
import { env } from '../config/env';

function requireUserId(authorization?: string): string | null {
  return resolveUserId(authorization, env.jwtSecret);
}

export const ClaimsController = {
  async create(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    const result = await ClaimsService.create(req.body || {}, userId);
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.status(201).json(result.data);
  },

  async list(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    res.json(await ClaimsService.list(userId));
  },
};
