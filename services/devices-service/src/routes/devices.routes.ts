import { Router } from 'express';
import { DevicesController } from '../controllers/devices.controller';

const router = Router();
router.post('/check', DevicesController.check);
router.post('/bulk-check', DevicesController.bulkCheck);
export default router;
