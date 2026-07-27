import { Request, Response } from 'express';
import { resolveUserId, unauthorizedBody } from '../../../../packages/shared/src/auth/jwt';
import { ActivitiesService } from '../services/activities.service';
import { env } from '../config/env';

const MAX_LIMIT = 50;

export const ActivitiesController = {
  async list(req: Request, res: Response): Promise<void> {
    const userId = resolveUserId(req.header('authorization') || undefined, env.jwtSecret);
    if (!userId) {
      res.status(401).json(unauthorizedBody);
      return;
    }
    const raw = Number(req.query.limit) || 10;
    const limit = Math.min(Math.max(raw, 1), MAX_LIMIT);
    res.json(await ActivitiesService.list(userId, limit));
  },
};
