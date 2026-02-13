import { Router } from 'express';
import { StrategyController } from './controllers/StrategyController';

const router = Router();
const controller = new StrategyController();

// Get all strategies with their settings
router.get('/', (req, res) => controller.getAll(req, res));

// EMA Strategy settings endpoints
router.get('/ema/settings', (req, res) => controller.getEMASettings(req, res));
router.put('/ema/settings', (req, res) => controller.updateEMASettings(req, res));

// Toggle strategy on/off
router.post('/:name/toggle', (req, res) => controller.toggle(req, res));

export default router;
