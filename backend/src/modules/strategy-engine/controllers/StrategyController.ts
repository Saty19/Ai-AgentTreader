import { Request, Response } from 'express';
import { TradingOrchestrator } from '../../../core/TradingOrchestrator'; // Ensure correct path

export class StrategyController {
  
  // GET /api/strategies
  async getAll(req: Request, res: Response) {
    try {
        const orchestrator = TradingOrchestrator.getInstance();
        const registry = orchestrator.getRegistry();
        const strategies = registry.getAllStrategies();
        
        // Map to DTO
        const response = strategies.map(s => ({
            name: s.name,
            description: s.description,
            indicators: s.getIndicators()
        }));
        
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
  }

  // POST /api/strategies/:name/toggle (Placeholder for now)
  async toggle(req: Request, res: Response) {
      // Not implemented in Registry yet
      res.json({ message: 'Toggled' });
  }
}
