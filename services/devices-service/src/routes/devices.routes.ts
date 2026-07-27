import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { DevicesController } from '../controllers/devices.controller';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth(env.jwtSecret));
router.post('/check', DevicesController.check);
router.post('/bulk-check', DevicesController.bulkCheck);
export default router;
