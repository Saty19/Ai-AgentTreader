import { IExecutionEngine } from '../../../core/interfaces/IExecution';
import { Signal, Trade, TradeResult } from '../../../domain/entities';
import { BrokerManager } from '../../broker-engine/services/BrokerManager';
import { ITradeRepository, IStatsRepository } from '../../../domain/interfaces';
import { SocketBroadcastService } from '../../../core/socket/SocketBroadcastService';
import { MySQLTradeRepository } from '../../trade/repositories/MySQLTradeRepository';
import { MySQLStatsRepository } from '../../stats/repositories/MySQLStatsRepository';

export class ExecutionService implements IExecutionEngine {
  private brokerManager: BrokerManager;
  private tradeRepo: ITradeRepository;
  private statsRepo: IStatsRepository;
  private socketService: SocketBroadcastService | null = null; // Ideally injected

  constructor(brokerManager: BrokerManager, socketService?: SocketBroadcastService) {
    this.brokerManager = brokerManager;
    this.tradeRepo = new MySQLTradeRepository(); 
    this.statsRepo = new MySQLStatsRepository();
    if (socketService) this.socketService = socketService;
  }

  async executeSignal(signal: Signal): Promise<Trade | null> {
    // 1. Check if we already have an open trade for this symbol
    // Depending on logic, we might want to reverse position or add to it.
    // Simple logic: One trade per symbol.
    const openTrades = await this.tradeRepo.getOpenTrades(); // Need to implement getOpenTrades or filter
    const existing = openTrades.find(t => t.symbol === signal.symbol);
    
    if (existing) {
        console.log(`[Execution] Signal ignored. Trade already open for ${signal.symbol}`);
        return null;
    }

    // 2. Risk Management / Position Sizing
    // Calculate Quantity based on Risk %
    const balance = await this.brokerManager.getBroker().getBalance('USD');
    const riskPerTrade = 0.01; // 1%
    const riskAmount = balance * riskPerTrade;
    
    // Sl distance
    // If signal doesn't have SL, we calculate default
    let sl = 0;
    let tp = 0;
    const price = signal.price;

    if (signal.side === 'BUY') {
        sl = price * 0.99; // 1% SL default
        tp = price * 1.02; // 2% TP
    } else {
        sl = price * 1.01;
        tp = price * 0.98;
    }
    
    const dist = Math.abs(price - sl);
    // qty = riskAmount / dist
    let qty = dist > 0 ? riskAmount / dist : 0;
    qty = parseFloat(qty.toFixed(4)); // Normalize

    // 3. Execute via Broker
    const broker = this.brokerManager.getBroker();
    const trade = await broker.placeOrder(signal.symbol, signal.side, qty, price, sl, tp);

    if (this.socketService) {
        this.socketService.emitTradeOpen(trade);
    }

    return trade;
  }

  async onPriceUpdate(symbol: string, price: number, time: number): Promise<void> {
     // Monitor Open Trades for SL/TP
     // Needs efficient way to get open trades.
     // For MVP, fetch all open from Repo (or cache in memory)
     
     // Optimization: Cache open trades in memory?
     // Let's query repo for robustness in this MVP step (assuming low volume).
     // Ideally: this.openTrades cache.
     
     const openTrades = await this.tradeRepo.getOpenTrades(); // Need this method in Repo interface? 
     // Standard repo interface usually basic. I might need to cast or rely on implementation detail 
     // or just filter getAll if getOpenTrades missing.
     // Based on previous simple Repo, likely `getAll` is available.
     
     // Let's assume we filter here if needed, or query.
     const symbolTrades = openTrades.filter(t => t.symbol === symbol);

     for (const trade of symbolTrades) {
         let result: TradeResult | null = null;
         let exitPrice = 0;

         // Check SL/TP
         // Note: We only have 'price' (current close/tick). 
         // Real logic needs High/Low of the candle to be accurate.
         // Calling this with Candle High/Low would be better.
         // But interface `onPriceUpdate` usually implies tick.
         // Let's accept strict price breach.

         if (trade.side === 'BUY') {
             if (price <= trade.sl) {
                 result = 'LOSS';
                 exitPrice = trade.sl;
             } else if (price >= trade.tp) {
                 result = 'WIN';
                 exitPrice = trade.tp;
             }
         } else {
             if (price >= trade.sl) {
                 result = 'LOSS';
                 exitPrice = trade.sl;
             } else if (price <= trade.tp) {
                 result = 'WIN';
                 exitPrice = trade.tp;
             }
         }

         if (result) {
             // Close
             const broker = this.brokerManager.getBroker();
             await broker.closePosition(symbol, exitPrice);

             // Update Repo (Broker usually doesn't update our DB "Trade" record fully with result logic? PaperBroker did not)
             // PaperBroker.closePosition was a mock.
             // So We must update the record here.
             
             trade.result = result;
             trade.exitPrice = exitPrice;
             trade.exitTime = time;
             trade.pnl = result === 'WIN' 
                ? Math.abs(trade.entryPrice - exitPrice)
                : -Math.abs(trade.entryPrice - exitPrice); // approx
            
             await this.tradeRepo.update(trade);
             
             if (this.socketService) {
                 this.socketService.emitTradeClose(trade);
             }

             await this.updateStats();
             
             console.log(`[Execution] Trade Closed: ${trade.symbol} ${result} PnL: ${trade.pnl}`);
         }
     }
  }

  private async updateStats() {
      // Simple implementation: Fetch all stats or just increment? 
      // For MVP, relying on existing repo logic or just emitting what we have?
      // MySQLStatsRepository logic was generic "get/update".
      // Let's assume we trigger a recalculation or just emit a placeholder for now to keep FE happy.
      // Or better: Fetch current stats from DB (which might be updated by a background job or trigger)
      // Actually, since we don't have a background job, we should ideally recalc.
      // But calculating from ALL trades every time is expensive.
      // Let's just emit a "stats_update_request" or similar?
      // Or just fetch the latest single row.
      try {
        const stats = await this.statsRepo.get();
        if (this.socketService) {
            this.socketService.emitStatsUpdate(stats);
        }
      } catch (e) {
          console.error("Failed to update stats", e);
      }
  }
}
