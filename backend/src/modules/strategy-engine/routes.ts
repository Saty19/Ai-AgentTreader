import { Router } from 'express';
import { StrategyController } from './controllers/StrategyController';

const router = Router();
const controller = new StrategyController();

router.get('/', (req, res) => controller.getAll(req, res));
router.post('/:name/toggle', (req, res) => controller.toggle(req, res));

export default router;
