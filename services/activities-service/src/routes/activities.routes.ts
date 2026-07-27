import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { ActivitiesController } from '../controllers/activities.controller';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth(env.jwtSecret));
router.get('/', ActivitiesController.list);
export default router;
