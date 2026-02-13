import { Trade, TradeSide } from '../../domain/entities';

export interface IBroker {
  name: string;

  /**
   * Place an order.
   * For Paper Trading, 'price' is the execution price.
   * For Real Brokers, 'price' might be Limit price (optional for Market orders).
   */
  placeOrder(symbol: string, side: TradeSide, quantity: number, price: number, sl?: number, tp?: number): Promise<Trade>;

  /**
   * Close an existing trade/position.
   * Requires current price for PnL calculation in Paper mode.
   */
  closePosition(symbol: string, price?: number): Promise<void>;

  /**
   * Get current balance
   */
  getBalance(currency: string): Promise<number>;
  
  /**
   * Get current connection status
   */
  isConnected(): boolean;
}
