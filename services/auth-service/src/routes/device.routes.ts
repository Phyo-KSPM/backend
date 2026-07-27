import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { AuthController } from '../controllers/auth.controller';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth(env.jwtSecret));
router.get('/binding', AuthController.getBinding);
router.post('/bind', AuthController.bind);
export default router;
