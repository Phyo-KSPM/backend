import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { NrcController } from '../controllers/nrc.controller';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth(env.jwtSecret));
router.get('/townships', NrcController.getTownships);
export default router;
