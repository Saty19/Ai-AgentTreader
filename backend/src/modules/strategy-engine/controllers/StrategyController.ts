import { Request, Response } from 'express';
import { TradingOrchestrator } from '../../../core/TradingOrchestrator';
import { EMAStrategy } from '../strategies/EMAStrategy';

export class StrategyController {
  
  // GET /api/strategies
  async getAll(req: Request, res: Response) {
    try {
        const orchestrator = TradingOrchestrator.getInstance();
        const registry = orchestrator.getRegistry();
        const strategies = registry.getAllStrategies();
        
        // Map to DTO with settings if available
        const response = strategies.map(s => {
          const base = {
            name: s.name,
            description: s.description,
            indicators: s.getIndicators()
          };
          
          // Add settings if strategy supports it
          if (s instanceof EMAStrategy) {
            return {
              ...base,
              type: 'EMA',
              settings: s.getSettings()
            };
          }
          
          return base;
        });
        
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
  }

  // PUT /api/strategies/ema/settings
  async updateEMASettings(req: Request, res: Response) {
    try {
        const settings = req.body;
        const orchestrator = TradingOrchestrator.getInstance();
        const registry = orchestrator.getRegistry();
        
        // Find EMA strategy
        const strategies = registry.getAllStrategies();
        const emaStrategy = strategies.find(s => s instanceof EMAStrategy) as EMAStrategy;
        
        if (!emaStrategy) {
          return res.status(404).json({ error: 'EMA Strategy not found' });
        }
        
        // Update settings
        emaStrategy.updateSettings(settings);
        
        res.json({ 
          success: true, 
          settings: emaStrategy.getSettings() 
        });
    } catch (error) {
        console.error('Error updating EMA settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  // GET /api/strategies/ema/settings
  async getEMASettings(req: Request, res: Response) {
    try {
        const orchestrator = TradingOrchestrator.getInstance();
        const registry = orchestrator.getRegistry();
        
        const strategies = registry.getAllStrategies();
        const emaStrategy = strategies.find(s => s instanceof EMAStrategy) as EMAStrategy;
        
        if (!emaStrategy) {
          return res.status(404).json({ error: 'EMA Strategy not found' });
        }
        
        res.json(emaStrategy.getSettings());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  // POST /api/strategies/:name/toggle
  async toggle(req: Request, res: Response) {
      // TODO: Implement enable/disable strategy
      res.json({ message: 'Toggle not yet implemented' });
  }
}
