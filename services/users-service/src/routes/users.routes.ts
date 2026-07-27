import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';

const router = Router();
router.get('/profile', UsersController.profile);
router.post('/dealer/verify', UsersController.verifyDealer);
export default router;
