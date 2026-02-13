import { Request, Response } from 'express';
import { TradingOrchestrator } from '../../../core/TradingOrchestrator';

export class AlgoController {
    
    // POST /api/algo/start
    async start(req: Request, res: Response) {
        try {
            TradingOrchestrator.getInstance().start();
            res.json({ status: 'running', message: 'Algo execution started' });
        } catch (error) {
            console.error('Failed to start algo:', error);
            res.status(500).json({ error: 'Failed to start algo' });
        }
    }

    // POST /api/algo/stop
    async stop(req: Request, res: Response) {
        try {
            TradingOrchestrator.getInstance().stop();
            res.json({ status: 'stopped', message: 'Algo execution stopped' });
        } catch (error) {
            console.error('Failed to stop algo:', error);
            res.status(500).json({ error: 'Failed to stop algo' });
        }
    }

    // POST /api/algo/strategy/toggle
    async toggleStrategy(req: Request, res: Response) {
        const { name, active } = req.body;
        if (!name || typeof active !== 'boolean') {
            res.status(400).json({ error: 'Missing name or active status' });
            return;
        }

        try {
            TradingOrchestrator.getInstance().toggleStrategy(name, active);
            res.json({ status: 'ok', name, active });
        } catch (error) {
            console.error('Failed to toggle strategy:', error);
            res.status(500).json({ error: 'Failed to toggle strategy' });
        }
    }

    // GET /api/algo/status
    async getStatus(req: Request, res: Response) {
        try {
            const orchestrator = TradingOrchestrator.getInstance();
            const strategies = orchestrator.getStrategyStatus();
            res.json({ 
                status: orchestrator.isOrchestratorRunning() ? 'running' : 'stopped', 
                strategies 
            });
        } catch (error) {
             console.error('Failed to get status:', error);
             res.status(500).json({ error: 'Failed to get status' });
        }
    }
}
