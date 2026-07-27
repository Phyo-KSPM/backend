import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
router.get('/binding', AuthController.getBinding);
router.post('/bind', AuthController.bind);
export default router;
