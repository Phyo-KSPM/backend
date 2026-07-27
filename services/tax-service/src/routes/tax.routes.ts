import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { TaxController } from '../controllers/tax.controller';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth(env.jwtSecret));
router.post('/applications', TaxController.create);
router.get('/applications/:id', TaxController.getById);
export default router;
