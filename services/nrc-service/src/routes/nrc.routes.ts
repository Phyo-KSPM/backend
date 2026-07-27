import { Router } from 'express';
import { NrcController } from '../controllers/nrc.controller';

const router = Router();
router.get('/townships', NrcController.getTownships);
export default router;
