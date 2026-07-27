import { Request, Response } from 'express';
import { ActivitiesService } from '../services/activities.service';

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

export const ActivitiesController = {
  async list(req: Request, res: Response): Promise<void> {
    const limit = Number(req.query.limit) || 10;
    res.json(
      await ActivitiesService.list(
        resolveUserId(req.header('authorization') || undefined),
        limit
      )
    );
  },
};
