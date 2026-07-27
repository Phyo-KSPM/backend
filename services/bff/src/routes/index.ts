import { Router } from 'express';
import { BffController } from '../controllers/bff.controller';

const router = Router();
router.get('/dashboard', BffController.dashboard);
router.post('/login', BffController.login);
export default router;
