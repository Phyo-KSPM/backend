import { Router } from 'express';
import { ActivitiesController } from '../controllers/activities.controller';

const router = Router();
router.get('/', ActivitiesController.list);
export default router;
