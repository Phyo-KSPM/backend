import { Router } from 'express';
import { TaxController } from '../controllers/tax.controller';

const router = Router();
router.post('/applications', TaxController.create);
router.get('/applications/:id', TaxController.getById);
export default router;
