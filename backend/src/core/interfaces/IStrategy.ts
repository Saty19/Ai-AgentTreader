import { Candle, Signal, Indicator } from '../../domain/entities';

export interface IStrategy {
  name: string;
  description?: string;
  
  /**
   * Defines the indicators used by this strategy for UI/Configuration
   */
  getIndicators(): Indicator[];

  /**
   * Process a new candle and potentially return a signal
   */
  onCandle(candle: Candle): Promise<Signal | null>;

  /**
   * Optional: Reset internal state
   */
  reset?(): void;
}
