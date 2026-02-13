import { Router } from 'express';
import { AlgoController } from './controllers/AlgoController';

const router = Router();
const controller = new AlgoController();

router.post('/start', controller.start);
router.post('/stop', controller.stop);
router.post('/strategy/toggle', controller.toggleStrategy);
router.get('/status', controller.getStatus);

export default router;
