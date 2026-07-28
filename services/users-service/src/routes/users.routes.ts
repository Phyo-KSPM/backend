import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { UsersController } from '../controllers/users.controller';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth(env.jwtSecret));
router.get('/profile', UsersController.profile);
export default router;
