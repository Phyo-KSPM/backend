import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';

export const UsersController = {
  async profile(req: Request, res: Response): Promise<void> {
    const result = await UsersService.getProfile(req.header('authorization') || undefined);
    if (!result.ok) {
      res.status(result.status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
      return;
    }
    res.json(result.data);
  },

  async verifyDealer(req: Request, res: Response): Promise<void> {
    const result = await UsersService.verifyDealer(
      req.header('authorization') || undefined,
      req.body || {}
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
};
