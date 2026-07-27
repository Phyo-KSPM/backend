import { Request, Response } from 'express';
import { resolveUserId, unauthorizedBody } from '../../../../packages/shared/src/auth/jwt';
import { TaxService } from '../services/tax.service';
import { env } from '../config/env';

function requireUserId(authorization?: string): string | null {
  return resolveUserId(authorization, env.jwtSecret);
}

export const TaxController = {
  async create(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    const result = await TaxService.create(req.body || {}, userId);
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.status(201).json(result.data);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    const result = await TaxService.getById(String(req.params.id), userId);
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.json(result.data);
  },
};
