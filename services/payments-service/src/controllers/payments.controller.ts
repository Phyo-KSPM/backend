import { Request, Response } from 'express';
import { resolveUserId, unauthorizedBody } from '../../../../packages/shared/src/auth/jwt';
import { PaymentsService } from '../services/payments.service';
import { env } from '../config/env';

function requireUserId(authorization?: string): string | null {
  return resolveUserId(authorization, env.jwtSecret);
}

export const PaymentsController = {
  async createBatch(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    const result = await PaymentsService.createBatch(req.body || {}, userId);
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.status(201).json(result.data);
  },

  async payBatch(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    const result = await PaymentsService.payBatch(
      String(req.params.id),
      req.body || {},
      userId
    );
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.json(result.data);
  },

  async list(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(Number(req.query.pageSize) || 20, 100);
    res.json(await PaymentsService.list(userId, page, pageSize));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    const result = await PaymentsService.getById(String(req.params.id), userId);
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
