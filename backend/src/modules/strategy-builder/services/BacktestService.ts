import { BacktestRepository } from '../repositories/BacktestRepository';
import { StrategyValidationService } from './StrategyValidationService';
import { StrategyCompilationService } from './StrategyCompilationService';
import { v4 as uuidv4 } from 'uuid';

export class BacktestService {
  private static repository = new BacktestRepository();

  static async runBacktest(params: {
    strategyDefinition: any;
    symbol: string;
    timeframe: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    commission: number;
    userId: string;
  }): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    const backtestId = uuidv4();

    try {
      // Validate strategy
      const validation = await StrategyValidationService.validateStrategy(params.strategyDefinition);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Strategy validation failed: ' + validation.errors.map(e => e.message).join(', ')
        };
      }

      // Create backtest record
      const backtest = {
        id: backtestId,
        strategyId: null, // Can be null for ad-hoc backtests
        userId: params.userId,
        name: null,
        symbol: params.symbol,
        timeframe: params.timeframe,
        startDate: params.startDate,
        endDate: params.endDate,
        initialCapital: params.initialCapital,
        commission: params.commission,
        status: 'RUNNING' as const,
        progress: 0,
        results: null,
        errorMessage: null,
        executionTime: null,
        createdAt: new Date(),
        completedAt: null
      };

      await this.repository.createBacktest(backtest);

      // Run backtest asynchronously
      this.executeBacktest(backtestId, params).catch(error => {
        console.error('Backtest execution error:', error);
      });

      return {
        success: true,
        results: {
          backtestId,
          status: 'RUNNING'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async executeBacktest(backtestId: string, params: any): Promise<void> {
    const startTime = Date.now();

    try {
      // Compile strategy
      const compiledStrategy = await StrategyCompilationService.compileStrategy(params.strategyDefinition);

      // Fetch historical market data
      const marketData = await this.fetchMarketData(
        params.symbol,
        params.timeframe,
        params.startDate,
        params.endDate
      );

      if (marketData.length === 0) {
        await this.repository.updateBacktest(backtestId, {
          status: 'FAILED',
          errorMessage: 'No market data available for the specified period',
          completedAt: new Date()
        });
        return;
      }

      // Initialize backtest state
      const state = {
        cash: params.initialCapital,
        equity: params.initialCapital,
        positions: new Map<string, any>(),
        trades: [] as any[],
        equityCurve: [] as any[]
      };

      // Execute strategy on each candle
      for (let i = 0; i < marketData.length; i++) {
        const candle = marketData[i];
        const progress = ((i + 1) / marketData.length) * 100;

        // Update progress every 10%
        if (i % Math.floor(marketData.length / 10) === 0) {
          await this.repository.updateBacktest(backtestId, { progress });
        }

        // Execute strategy logic
        const signals = await this.executeStrategyOnCandle(
          compiledStrategy,
          candle,
          marketData.slice(0, i + 1),
          state
        );

        // Process trading signals
        for (const signal of signals) {
          await this.processSignal(signal, candle, state, params.commission);
        }

        // Record equity
        const currentEquity = this.calculateEquity(state, candle.close);
        state.equityCurve.push({
          timestamp: candle.timestamp,
          value: currentEquity
        });
      }

      // Calculate final metrics
      const executionTime = Date.now() - startTime;
      const results = this.calculateMetrics(state, params.initialCapital);

      // Save results
      await this.repository.updateBacktest(backtestId, {
        status: 'COMPLETED',
        progress: 100,
        results: JSON.stringify(results),
        executionTime,
        completedAt: new Date()
      });

    } catch (error) {
      console.error('Backtest execution error:', error);
      await this.repository.updateBacktest(backtestId, {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      });
    }
  }

  private static async fetchMarketData(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // In a real implementation, fetch from market data service/database
    // For now, return mock data
    return [];
  }

  private static async executeStrategyOnCandle(
    compiledStrategy: any,
    candle: any,
    historicalData: any[],
    state: any
  ): Promise<any[]> {
    // Execute compiled strategy code and extract signals
    // This is a simplified version - real implementation would use vm2 or worker threads
    try {
      const context = {
        marketData: candle,
        historicalData,
        portfolio: {
          balance: state.cash,
          equity: state.equity,
          positions: Array.from(state.positions.values())
        },
        indicators: this.createIndicatorHelpers(historicalData)
      };

      // In production, execute the compiled strategy code safely
      // For now, return empty signals
      return [];

    } catch (error) {
      console.error('Strategy execution error:', error);
      return [];
    }
  }

  private static createIndicatorHelpers(historicalData: any[]): any {
    return {
      sma: (period: number) => this.calculateSMA(historicalData, period),
      ema: (period: number) => this.calculateEMA(historicalData, period),
      rsi: (period: number) => this.calculateRSI(historicalData, period),
      // Add more indicators as needed
    };
  }

  private static calculateSMA(data: any[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    const sum = slice.reduce((acc, candle) => acc + candle.close, 0);
    return sum / period;
  }

  private static calculateEMA(data: any[], period: number): number {
    if (data.length < period) return 0;
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(data.slice(0, period), period);
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i].close - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private static calculateRSI(data: any[], period: number): number {
    if (data.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = data.length - period; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private static async processSignal(
    signal: any,
    candle: any,
    state: any,
    commission: number
  ): Promise<void> {
    if (signal.type === 'BUY') {
      const quantity = signal.quantity || Math.floor(state.cash / candle.close);
      const cost = quantity * candle.close;
      const commissionCost = cost * commission;
      
      if (state.cash >= cost + commissionCost) {
        state.cash -= (cost + commissionCost);
        state.positions.set(signal.symbol, {
          symbol: signal.symbol,
          quantity,
          entryPrice: candle.close,
          entryTime: candle.timestamp
        });
        
        state.trades.push({
          type: 'BUY',
          price: candle.close,
          quantity,
          timestamp: candle.timestamp,
          commission: commissionCost
        });
      }
    } else if (signal.type === 'SELL') {
      const position = state.positions.get(signal.symbol);
      if (position) {
        const proceeds = position.quantity * candle.close;
        const commissionCost = proceeds * commission;
        const profit = proceeds - (position.quantity * position.entryPrice) - commissionCost;
        
        state.cash += (proceeds - commissionCost);
        state.positions.delete(signal.symbol);
        
        state.trades.push({
          type: 'SELL',
          price: candle.close,
          quantity: position.quantity,
          timestamp: candle.timestamp,
          commission: commissionCost,
          profit
        });
      }
    }
  }

  private static calculateEquity(state: any, currentPrice: number): number {
    let equity = state.cash;
    
    for (const position of state.positions.values()) {
      equity += position.quantity * currentPrice;
    }
    
    return equity;
  }

  private static calculateMetrics(state: any, initialCapital: number): any {
    const finalEquity = state.equity;
    const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
    
    const winningTrades = state.trades.filter((t: any) => t.profit && t.profit > 0);
    const losingTrades = state.trades.filter((t: any) => t.profit && t.profit < 0);
    
    const totalTrades = state.trades.filter((t: any) => t.type === 'SELL').length;
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    const totalProfit = winningTrades.reduce((sum: number, t: any) => sum + (t.profit || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum: number, t: any) => sum + (t.profit || 0), 0));
    
    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = initialCapital;
    
    for (const point of state.equityCurve) {
      if (point.value > peak) peak = point.value;
      const drawdown = ((peak - point.value) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    // Calculate Sharpe ratio (simplified)
    const returns = state.equityCurve.map((point: any, i: number, arr: any[]) => {
      if (i === 0) return 0;
      return (point.value - arr[i - 1].value) / arr[i - 1].value;
    });
    
    const avgReturn = returns.reduce((sum: number, r: number) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum: number, r: number) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
    
    return {
      totalReturn,
      totalTrades,
      winRate,
      maxDrawdown,
      sharpeRatio,
      profit: totalProfit,
      loss: totalLoss,
      averageWin,
      averageLoss,
      trades: state.trades,
      equity: state.equityCurve
    };
  }

  static async getBacktestHistory(
    strategyId: string,
    userId: string,
    options: { page: number; limit: number }
  ): Promise<any | null> {
    const { tests, total } = await this.repository.findBacktestsByStrategy(strategyId, options);
    
    if (tests.length > 0 && tests[0].userId !== userId) {
      return null;
    }
    
    const totalPages = Math.ceil(total / options.limit);
    
    return {
      tests: tests.map(t => ({
        ...t,
        results: t.results ? JSON.parse(t.results) : null
      })),
      total,
      page: options.page,
      totalPages
    };
  }

  static async getBacktestResult(backtestId: string, userId: string): Promise<any | null> {
    const backtest = await this.repository.findBacktestById(backtestId);
    
    if (!backtest || backtest.userId !== userId) {
      return null;
    }
    
    return {
      ...backtest,
      results: backtest.results ? JSON.parse(backtest.results) : null
    };
  }

  static async deleteBacktestResult(backtestId: string, userId: string): Promise<boolean> {
    const backtest = await this.repository.findBacktestById(backtestId);
    
    if (!backtest || backtest.userId !== userId) {
      return false;
    }
    
    return await this.repository.deleteBacktest(backtestId);
  }

  static async compareBacktests(backtestIds: string[], userId: string): Promise<any | null> {
    const backtests = await Promise.all(
      backtestIds.map(id => this.repository.findBacktestById(id))
    );
    
    // Check access
    if (backtests.some(b => !b || b.userId !== userId)) {
      return null;
    }
    
    const comparison = backtests.map(b => ({
      id: b!.id,
      symbol: b!.symbol,
      timeframe: b!.timeframe,
      results: b!.results ? JSON.parse(b!.results) : null
    }));
    
    return { backtests: comparison };
  }

  static async getBacktestProgress(backtestId: string, userId: string): Promise<any | null> {
    const backtest = await this.repository.findBacktestById(backtestId);
    
    if (!backtest || backtest.userId !== userId) {
      return null;
    }
    
    return {
      status: backtest.status,
      progress: backtest.progress,
      errorMessage: backtest.errorMessage
    };
  }

  static async cancelBacktest(backtestId: string, userId: string): Promise<boolean> {
    const backtest = await this.repository.findBacktestById(backtestId);
    
    if (!backtest || backtest.userId !== userId) {
      return false;
    }
    
    if (backtest.status !== 'RUNNING') {
      return false;
    }
    
    return await this.repository.updateBacktest(backtestId, {
      status: 'CANCELLED',
      completedAt: new Date()
    });
  }

  static async getDetailedMetrics(backtestId: string, userId: string): Promise<any | null> {
    const backtest = await this.repository.findBacktestById(backtestId);
    
    if (!backtest || backtest.userId !== userId || !backtest.results) {
      return null;
    }
    
    const results = JSON.parse(backtest.results);
    
    // Calculate additional metrics
    return {
      ...results,
      profitFactor: results.loss > 0 ? results.profit / results.loss : 0,
      expectancy: results.totalTrades > 0 ? 
        (results.profit - results.loss) / results.totalTrades : 0
    };
  }

  static async exportResults(
    backtestId: string,
    userId: string,
    format: 'csv' | 'excel' | 'json'
  ): Promise<any | null> {
    const backtest = await this.repository.findBacktestById(backtestId);
    
    if (!backtest || backtest.userId !== userId || !backtest.results) {
      return null;
    }
    
    const results = JSON.parse(backtest.results);
    
    // Generate export data based on format
    const filename = `backtest_${backtestId}_${Date.now()}.${format}`;
    let data: string;
    let mimeType: string;
    
    if (format === 'json') {
      data = JSON.stringify(results, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      data = this.convertToCSV(results);
      mimeType = 'text/csv';
    } else {
      // Excel format would require a library like exceljs
      data = this.convertToCSV(results);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    
    return { data, filename, mimeType };
  }

  private static convertToCSV(results: any): string {
    if (!results.trades || results.trades.length === 0) {
      return 'No trades to export';
    }
    
    const headers = ['Timestamp', 'Type', 'Price', 'Quantity', 'Commission', 'Profit'];
    const rows = results.trades.map((trade: any) => [
      trade.timestamp,
      trade.type,
      trade.price,
      trade.quantity,
      trade.commission || 0,
      trade.profit || 0
    ]);
    
    return [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n');
  }
}