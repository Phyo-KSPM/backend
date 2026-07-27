import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller';

const router = Router();
router.post('/batches', PaymentsController.createBatch);
router.post('/batches/:id/pay', PaymentsController.payBatch);
router.get('/', PaymentsController.list);
router.get('/:id', PaymentsController.getById);
export default router;
