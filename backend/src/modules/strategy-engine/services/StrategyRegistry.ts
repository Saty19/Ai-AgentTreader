import { IStrategy } from '../../../core/interfaces/IStrategy';

export class StrategyRegistry {
  private strategies: Map<string, IStrategy> = new Map();

  register(strategy: IStrategy) {
    if (this.strategies.has(strategy.name)) {
      console.warn(`Strategy ${strategy.name} already registered. Overwriting.`);
    }
    this.strategies.set(strategy.name, strategy);
    console.log(`Registered Strategy: ${strategy.name}`);
  }

  getStrategy(name: string): IStrategy | undefined {
    return this.strategies.get(name);
  }

  getAllStrategies(): IStrategy[] {
    return Array.from(this.strategies.values());
  }
}
