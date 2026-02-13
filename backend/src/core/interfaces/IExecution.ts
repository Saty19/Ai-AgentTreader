import { Signal, Trade } from '../../domain/entities';

export interface IExecutionEngine {
  /**
   * Execute a strategy signal
   */
  executeSignal(signal: Signal): Promise<Trade | null>;

  /**
   * Manage open positions (SL/TP checks)
   * Should be called on every price update
   */
  onPriceUpdate(symbol: string, price: number, time: number): Promise<void>;
}
