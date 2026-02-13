import { IStrategy } from '../../../core/interfaces/IStrategy';

export class StrategyRegistry {
  private strategies: Map<string, IStrategy> = new Map();
  private activeStrategies: Set<string> = new Set();

  register(strategy: IStrategy) {
    if (this.strategies.has(strategy.name)) {
      console.warn(`Strategy ${strategy.name} already registered. Overwriting.`);
    }
    this.strategies.set(strategy.name, strategy);
    // Auto-enable for now, or default to disabled?
    // Let's default to disabled unless explicitly enabled, but for MVP consistency let's enable.
    this.activeStrategies.add(strategy.name); 
    console.log(`Registered Strategy: ${strategy.name}`);
  }

  getStrategy(name: string): IStrategy | undefined {
    return this.strategies.get(name);
  }

  getAllStrategies(): IStrategy[] {
    return Array.from(this.strategies.values());
  }

  enable(name: string) {
      if (this.strategies.has(name)) {
          this.activeStrategies.add(name);
          console.log(`Enabled strategy: ${name}`);
      }
  }

  disable(name: string) {
      this.activeStrategies.delete(name);
      console.log(`Disabled strategy: ${name}`);
  }

  isEnabled(name: string): boolean {
      return this.activeStrategies.has(name);
  }
  
  getStatus(): Record<string, 'Running' | 'Paused' > {
      const status: Record<string, 'Running' | 'Paused'> = {};
      this.strategies.forEach((_, name) => {
          status[name] = this.activeStrategies.has(name) ? 'Running' : 'Paused';
      });
      return status;
  }
}
