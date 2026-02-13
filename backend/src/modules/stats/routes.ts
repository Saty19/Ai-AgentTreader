import { Router } from 'express';
import { StatsController } from './controllers/StatsController';
import { MySQLStatsRepository } from './repositories/MySQLStatsRepository';

const router = Router();
const repo = new MySQLStatsRepository();
const controller = new StatsController(repo);

router.get('/', controller.getStats);

export default router;
