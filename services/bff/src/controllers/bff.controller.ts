import { Request, Response } from 'express';
import { BffService } from '../services/bff.service';

export const BffController = {
  async dashboard(_req: Request, res: Response): Promise<void> {
    try {
      const data = await BffService.getDashboard();
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ message: 'Upstream service error', detail: err.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, deviceFingerprint, deviceName, platform, appVersion } = req.body || {};
      if (!email || !password || !deviceFingerprint) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'email, password and deviceFingerprint are required',
          },
        });
        return;
      }
      const data = await BffService.login({
        email,
        password,
        deviceFingerprint,
        deviceName,
        platform,
        appVersion,
      });
      res.json(data);
    } catch (err: any) {
      const status = err.response?.status || 502;
      res.status(status).json(err.response?.data || { message: err.message });
    }
  },
};
