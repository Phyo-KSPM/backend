import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { BffController } from '../controllers/bff.controller';
import { env } from '../config/env';

const router = Router();
router.post('/login', BffController.login);
router.get('/dashboard', requireAuth(env.jwtSecret), BffController.dashboard);
export default router;
