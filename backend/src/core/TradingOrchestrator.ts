import { BinanceService } from '../modules/market/services/BinanceService';
import { StrategyRegistry } from '../modules/strategy-engine/services/StrategyRegistry';
import { StrategyRunner } from '../modules/strategy-engine/services/StrategyRunner';
import { ExecutionService } from '../modules/algo-engine/services/ExecutionService';
import { BrokerManager } from '../modules/broker-engine/services/BrokerManager';
import { SocketBroadcastService } from './socket/SocketBroadcastService';
import { Candle } from '../domain/entities';

// Default Implementations
import { PaperBroker } from '../modules/broker-engine/brokers/PaperBroker';
import { EMAStrategy } from '../modules/strategy-engine/strategies/EMAStrategy';
import { MACDStrategy } from '../modules/strategy-engine/strategies/MACDStrategy';

export class TradingOrchestrator {
  private binanceService: BinanceService;
  private strategyRegistry: StrategyRegistry;
  private strategyRunner: StrategyRunner;
  private brokerManager: BrokerManager;
  private executionService: ExecutionService;
  
  private static instance: TradingOrchestrator;

  private constructor(private socketService: SocketBroadcastService) {
    // 1. Setup Broker Engine
    this.brokerManager = new BrokerManager();
    // (PaperBroker is default in Manager)
    
    // 2. Setup Algo Engine
    this.executionService = new ExecutionService(this.brokerManager, socketService);
    
    // 3. Setup Strategy Engine
    this.strategyRegistry = new StrategyRegistry();
    this.strategyRunner = new StrategyRunner(this.strategyRegistry);
    
    // Register Default Strategies
    this.strategyRegistry.register(new EMAStrategy());
    this.strategyRegistry.register(new MACDStrategy());
    
    // 4. Setup Market Data
    this.binanceService = new BinanceService('btcusdt', '1m');
  }

  public static initialize(socketService: SocketBroadcastService): TradingOrchestrator {
      if (!TradingOrchestrator.instance) {
          TradingOrchestrator.instance = new TradingOrchestrator(socketService);
      }
      return TradingOrchestrator.instance;
  }

  public static getInstance(): TradingOrchestrator {
      if (!TradingOrchestrator.instance) {
          throw new Error("TradingOrchestrator not initialized!");
      }
      return TradingOrchestrator.instance;
  }

  start() {
    console.log('Starting Trading Orchestrator...');
    
    this.binanceService.setDataCallback(async (candle: Candle) => {
        // 1. Broadcast Price
        this.socketService.emitPriceUpdate(candle);
        
        // 2. Run Execution Engine Updates (SL/TP Check)
        await this.executionService.onPriceUpdate(candle.symbol, candle.close, candle.time);
        
        // 3. Run Strategies
        // Optimization: Only run on candle close? 
        // Or every tick? Strategies usually wait for close.
        // But for realtime feel, we can run on tick if strategy handles it.
        // Assuming Strategies handle "isClosed" check internally if they strictly need closed candles.
        // MACD/EMA usually want closed or current live value.
        // Let's pass it.
        
        const signals = await this.strategyRunner.onCandle(candle);
        
        // 4. Execute Signals
        for (const signal of signals) {
            console.log(`Signal Generated: ${signal.side} ${signal.symbol} via ${signal.reason}`);
            this.socketService.emitSignal(signal);
            await this.executionService.executeSignal(signal);
        }
    });

    this.binanceService.start();
  }

  stop() {
    this.binanceService.stop();
  }
  
  getRegistry() {
      return this.strategyRegistry;
  }
}
