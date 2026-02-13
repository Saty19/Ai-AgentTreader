import { Router } from 'express';
import { TradeController } from './controllers/TradeController';
import { MySQLTradeRepository } from './repositories/MySQLTradeRepository';
import { MySQLStatsRepository } from '../stats/repositories/MySQLStatsRepository';

const router = Router();
const tradeRepo = new MySQLTradeRepository();
const statsRepo = new MySQLStatsRepository();
const controller = new TradeController(tradeRepo, statsRepo);

router.get('/', controller.getAllTrades);
router.get('/stats', controller.getStats); // Actually this might belong to stats module?
// User request: "Feature/Module-based structure". 
// Trade controller had 'getAllTrades' and 'getStats'. 
// Ideally 'getStats' should be in Stats module.
// I will keep it here for now to match strict refactor, but might move it if strictly separating.

export default router;
