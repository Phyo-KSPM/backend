import { Request, Response } from 'express';
import { NrcService } from '../services/nrc.service';

export const NrcController = {
  async getTownships(_req: Request, res: Response): Promise<void> {
    res.json(await NrcService.getTownships());
  },
};
