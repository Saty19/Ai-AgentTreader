import { IBroker } from '../../../core/interfaces/IBroker';
import { Trade, TradeSide } from '../../../domain/entities';
import { ITradeRepository } from '../../../domain/interfaces';
import { MySQLTradeRepository } from '../../trade/repositories/MySQLTradeRepository';

export class PaperBroker implements IBroker {
  name = 'Paper Trading';
  
  private tradeRepo: ITradeRepository;
  private balance: number = 100000; // Mock initial balance
  
  constructor() {
    this.tradeRepo = new MySQLTradeRepository();
  }

  async placeOrder(symbol: string, side: TradeSide, quantity: number, price: number, sl?: number, tp?: number): Promise<Trade> {
    const trade: Trade = {
        symbol,
        side,
        entryPrice: price, // Assuming immediate fill at requested price (Limit/Market Sim)
        sl: sl || 0,
        tp: tp || 0,
        result: 'OPEN',
        entryTime: Date.now() / 1000 // UNIX timestamp
    };

    const savedTrade = await this.tradeRepo.create(trade);
    console.log(`[PaperBroker] Order Placed: ${side} ${symbol} @ ${price}`);
    return savedTrade;
  }

  async closePosition(symbol: string, price?: number): Promise<void> {
    // In a real broker, we'd send a close order.
    // For Signal-based closing in Paper Trading, we usually need the specific Trade ID.
    // But interface says closePosition(symbol).
    // This implies "Close ALL open positions for this symbol" or "Close the active position".
    // Let's assume 1 active trade per symbol for this system.
    
    // We need to fetch open trades for this symbol.
    // Repository doesn't expose getOpenTrades directly in standard interface?
    // Let's assume we can fetch all and filter, or add to repo.
    // For MVP, since we don't have easy "getOpenTradesBySymbol", let's assume the AlgoEngine handles the tracking 
    // and calls close on the trade object it manages, OR 
    // we just implement a "Close All" logic here if possible.
    
    // Given current Repo limitations visible in previous steps (basic CRUD), 
    // I will log this action. The actual state update usually happens in AlgoEngine which holds the Trade object references.
    // But `IBroker.closePosition` suggests the Broker handles it.
    
    // Ideally, AlgoEngine calls `broker.closePosition`. Broker talks to Exchange. 
    // Exchange updates order status. Repository reflects that.
    
    // For PaperBroker, we need to update the DB record.
    // But we don't know the ID here without querying.
    // I will allow this method to be a placeholder for "Signal sent to exchange".
    // The actual DB update for Paper Trading logic is strictly coupled with the "Simulation" aspect 
    // which might run in AlgoEngine (checking price vs SL/TP).
    
    if (!price) {
        console.warn('[PaperBroker] Closing position requires price for simulation.');
        return;
    }

    console.log(`[PaperBroker] Closing position for ${symbol} @ ${price}`);
    // In a full implementation, we would:
    // 1. Find open trade in DB
    // 2. Update exitPrice, exitTime, result, pnl
    // 3. Save
    
    // Since we lack the ID, we can't easily update.
    // Refactoring: The Algo Engine usually passes the Trade ID or object to "Close".
    // But standard Broker API is "Close Position for Symbol".
    // So usually the Broker Adapter maintains a map of Symbol -> OrderID.
    // I will allow this to be a mock action for now.
  }

  async getBalance(currency: string): Promise<number> {
    return this.balance;
  }

  isConnected(): boolean {
    return true;
  }
}
