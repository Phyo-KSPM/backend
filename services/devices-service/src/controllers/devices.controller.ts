import { Request, Response } from 'express';
import { resolveUserId } from '../../../../packages/shared/src/auth/jwt';
import { DevicesService } from '../services/devices.service';
import { env } from '../config/env';

const MAX_BULK = 20;

function optionalUserId(authorization?: string): string {
  return resolveUserId(authorization, env.jwtSecret) || 'anonymous';
}

export const DevicesController = {
  async check(req: Request, res: Response): Promise<void> {
    const { imei1, imei2 } = req.body || {};
    if (!imei1) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'imei1 is required' },
      });
      return;
    }
    const result = await DevicesService.check(
      { imei1, imei2 },
      optionalUserId(req.header('authorization') || undefined)
    );
    if (!result) {
      res.status(404).json({
        success: false,
        error: { code: 'IMEI_NOT_FOUND', message: 'IMEI not found' },
      });
      return;
    }
    res.json(result);
  },

  async bulkCheck(req: Request, res: Response): Promise<void> {
    const { imeis } = req.body || {};
    if (!Array.isArray(imeis) || imeis.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'imeis array is required' },
      });
      return;
    }
    if (imeis.length > MAX_BULK) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `imeis must contain at most ${MAX_BULK} items`,
        },
      });
      return;
    }
    res.json(
      await DevicesService.bulkCheck(
        { imeis },
        optionalUserId(req.header('authorization') || undefined)
      )
    );
  },
};
