import { Router } from 'express';
import { requireAuth } from '../../../../packages/shared/src/auth/middleware';
import { PaymentsController } from '../controllers/payments.controller';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth(env.jwtSecret));
router.post('/batches', PaymentsController.createBatch);
router.post('/batches/:id/pay', PaymentsController.payBatch);
router.get('/', PaymentsController.list);
router.get('/:id', PaymentsController.getById);
export default router;
