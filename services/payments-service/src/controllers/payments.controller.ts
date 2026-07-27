import { Request, Response } from 'express';
import { PaymentsService } from '../services/payments.service';

function resolveUserId(authorization?: string): string {
  if (!authorization?.startsWith('Bearer ')) return 'b1f2a3c4-d5e6-7890-abcd-ef1234567890';
  const token = authorization.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'demo') return 'b1f2a3c4-d5e6-7890-abcd-ef1234567890';
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.sub || 'b1f2a3c4-d5e6-7890-abcd-ef1234567890';
  } catch {
    return 'b1f2a3c4-d5e6-7890-abcd-ef1234567890';
  }
}

export const PaymentsController = {
  async createBatch(req: Request, res: Response): Promise<void> {
    const result = await PaymentsService.createBatch(
      req.body || {},
      resolveUserId(req.header('authorization') || undefined)
    );
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
    const result = await PaymentsService.payBatch(String(req.params.id), req.body || {});
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
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    res.json(
      await PaymentsService.list(
        resolveUserId(req.header('authorization') || undefined),
        page,
        pageSize
      )
    );
  },

  async getById(req: Request, res: Response): Promise<void> {
    const result = await PaymentsService.getById(String(req.params.id));
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
