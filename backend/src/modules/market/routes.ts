import { Router } from 'express';
import { MarketController } from './controllers/MarketController';

const router = Router();
const controller = new MarketController();

router.get('/candles', controller.getCandles);

export default router;
