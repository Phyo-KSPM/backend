import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { ClaimsController } from '../controllers/claims.controller';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth(env.jwtSecret));
router.post('/', ClaimsController.create);
router.get('/', ClaimsController.list);
export default router;
