import { Router } from 'express';
import { SignalController } from './controllers/SignalController';
import { MySQLSignalRepository } from './repositories/MySQLSignalRepository';

const router = Router();
const repo = new MySQLSignalRepository();
const controller = new SignalController(repo);

router.get('/', controller.getLatestSignals);

export default router;
