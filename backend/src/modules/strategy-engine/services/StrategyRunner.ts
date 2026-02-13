import { IStrategy } from '../../../core/interfaces/IStrategy';
import { StrategyRegistry } from './StrategyRegistry';
import { Candle, Signal } from '../../../domain/entities';

export class StrategyRunner {
  constructor(private registry: StrategyRegistry) {}

  async onCandle(candle: Candle): Promise<Signal[]> {
    const strategies = this.registry.getAllStrategies();
    const signals: Signal[] = [];

    for (const strategy of strategies) {
      try {
        const signal = await strategy.onCandle(candle);
        if (signal) {
            // Enrich signal with strategy name if needed?
            // signal.strategyName = strategy.name; // Signal entity needs update if we want this
            signals.push(signal);
        }
      } catch (error) {
        console.error(`Error executing strategy ${strategy.name}:`, error);
      }
    }
    return signals;
  }
}
