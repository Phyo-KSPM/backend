import { Request, Response } from 'express';
import { BffService } from '../services/bff.service';

export const BffController = {
  async dashboard(req: Request, res: Response): Promise<void> {
    try {
      const authorization = req.header('authorization') || undefined;
      if (!authorization?.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
      }
      const data = await BffService.getDashboard(authorization);
      res.json(data);
    } catch (err: any) {
      const status = err.response?.status || 502;
      res.status(status).json(
        err.response?.data || { message: 'Upstream service error', detail: err.message }
      );
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        agentId,
        password,
        deviceId,
        deviceFingerprint,
        deviceName,
        platform,
        appVersion,
      } = req.body || {};

      const resolvedDeviceId = deviceId || deviceFingerprint;
      if ((!email && !agentId) || !password || !resolvedDeviceId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'password, deviceId, and either email or agentId are required',
          },
        });
        return;
      }

      const data = await BffService.login({
        email,
        agentId,
        password,
        deviceId: resolvedDeviceId,
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
