import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export const AuthController = {
  async login(req: Request, res: Response): Promise<void> {
    const result = await AuthService.login(req.body || {});
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.json(result.data);
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const result = await AuthService.refresh(req.body?.refreshToken);
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.json(result.data);
  },

  async getBinding(req: Request, res: Response): Promise<void> {
    const userId = AuthService.resolveUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      });
      return;
    }
    const result = await AuthService.getBinding(userId);
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.json(result.data);
  },

  async bind(req: Request, res: Response): Promise<void> {
    const userId = AuthService.resolveUserId(req.header('authorization') || undefined);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      });
      return;
    }
    const result = await AuthService.bind(userId, req.body || {});
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.status(201).json(result.data);
  },
};
