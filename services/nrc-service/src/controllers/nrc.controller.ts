import { Request, Response } from 'express';
import { resolveUserId, unauthorizedBody } from '../../../../packages/shared/src/auth/jwt';
import { NrcService } from '../services/nrc.service';
import { env } from '../config/env';

export const NrcController = {
  async getTownships(req: Request, res: Response): Promise<void> {
    const userId = resolveUserId(req.header('authorization') || undefined, env.jwtSecret);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    res.json(await NrcService.getTownships());
  },
};
