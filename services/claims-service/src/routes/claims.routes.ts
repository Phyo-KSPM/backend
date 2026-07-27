import { Router } from 'express';
import { ClaimsController } from '../controllers/claims.controller';

const router = Router();
router.post('/', ClaimsController.create);
router.get('/', ClaimsController.list);
export default router;
