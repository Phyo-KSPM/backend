import { Request, Response } from 'express';
import { DevicesService } from '../services/devices.service';

function resolveUserId(authorization?: string): string {
  if (!authorization?.startsWith('Bearer ')) return 'anonymous';
  const token = authorization.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'demo') return 'anonymous';
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.sub || 'anonymous';
  } catch {
    return 'anonymous';
  }
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
      resolveUserId(req.header('authorization') || undefined)
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
    res.json(
      await DevicesService.bulkCheck(
        { imeis },
        resolveUserId(req.header('authorization') || undefined)
      )
    );
  },
};
