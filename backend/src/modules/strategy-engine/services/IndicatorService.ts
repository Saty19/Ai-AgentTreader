import { Indicator } from '../../../domain/entities';

export class IndicatorService {
  
  // Calculate Exponential Moving Average
  calculateEMA(period: number, prices: number[]): number | null {
    if (prices.length < period) return null;
    
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
    }
    
    return ema;
  }

  // Calculate MACD
  calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod) return null;

    const fastEMA = this.calculateEMA(fastPeriod, prices);
    const slowEMA = this.calculateEMA(slowPeriod, prices);

    if (fastEMA === null || slowEMA === null) return null;

    // Note: True MACD needs a series of EMAs to calculate the Signal Line (EMA of MACD)
    // For simplicity in this iteration, we might need a full series calculation.
    // Let's implement a series generator.
    
    return {
        macd: fastEMA - slowEMA,
        signal: 0, // Placeholder if we don't have series
        histogram: 0
    };
  }
  
  // Helper to get series of EMAs
  getEMASeries(period: number, prices: number[]): number[] {
      const emas: number[] = [];
      const k = 2 / (period + 1);
      
      if (prices.length < period) return [];
      
      // Simple loop for now, optimizing for latest
      // To do it right, we need to start from the beginning.
      let ema = prices[0];
      emas.push(ema);
      
      for (let i = 1; i < prices.length; i++) {
          ema = (prices[i] * k) + (ema * (1 - k));
          emas.push(ema);
      }
      return emas;
  }

  // Full MACD with Signal Line
  getMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
      const fastEMAs = this.getEMASeries(fastPeriod, prices);
      const slowEMAs = this.getEMASeries(slowPeriod, prices);
      
      if (fastEMAs.length === 0 || slowEMAs.length === 0) return null;
      
      // MACD Line = Fast - Slow
      const macdLine: number[] = [];
      for(let i=0; i<prices.length; i++) {
          macdLine.push(fastEMAs[i] - slowEMAs[i]);
      }
      
      // Signal Line = EMA of MACD Line
      const signalLine = this.calculateEMA(signalPeriod, macdLine.slice(-signalPeriod * 2)); // improved slice?
      // Actually, let's just use the last values for the strategy check
      
      const currentMACD = macdLine[macdLine.length - 1];
      const prevMACD = macdLine[macdLine.length - 2];
      
      // We need a signal line series to get the current signal value properly
      const signalSeries = this.getEMASeries(signalPeriod, macdLine);
      const currentSignal = signalSeries[signalSeries.length - 1];
      
      return {
          macd: currentMACD,
          signal: currentSignal,
          histogram: currentMACD - currentSignal
      };
  }

  // Calculate EMA slope angle in degrees
  calculateEMAAngle(emaValues: number[], timeIntervalMinutes: number = 1): number {
    if (emaValues.length < 2) return 0;
    
    const currentEMA = emaValues[emaValues.length - 1];
    const previousEMA = emaValues[emaValues.length - 2];
    
    // Calculate angle using arctangent
    // angle = atan((EMA_now - EMA_prev) / time) * (180 / PI)
    const priceDiff = currentEMA - previousEMA;
    const timeDiff = timeIntervalMinutes; // time in minutes between candles
    
    const angleRadians = Math.atan(priceDiff / timeDiff);
    const angleDegrees = angleRadians * (180 / Math.PI);
    
    return angleDegrees;
  }

  // Get trend direction based on EMA alignment
  getTrendDirection(ema5: number, ema26: number, ema150: number): 'bullish' | 'bearish' | 'neutral' {
    if (ema5 > ema26 && ema26 > ema150) return 'bullish';
    if (ema5 < ema26 && ema26 < ema150) return 'bearish';
    return 'neutral';
  }

  // Check if price is retesting EMA
  isPriceNearEMA(currentPrice: number, ema: number, thresholdPercent: number = 0.5): boolean {
    const diff = Math.abs(currentPrice - ema);
    const threshold = ema * (thresholdPercent / 100);
    return diff <= threshold;
  }

  // Check if candle is bullish
  isBullishCandle(open: number, close: number, minBodyPercent: number = 0.3): boolean {
    const bodySize = close - open;
    if (bodySize <= 0) return false;
    
    // Body should be at least minBodyPercent of the price
    const bodyPercent = (bodySize / open) * 100;
    return bodyPercent >= minBodyPercent;
  }

  // Check if candle is bearish
  isBearishCandle(open: number, close: number, minBodyPercent: number = 0.3): boolean {
    const bodySize = open - close;
    if (bodySize <= 0) return false;
    
    const bodyPercent = (bodySize / open) * 100;
    return bodyPercent >= minBodyPercent;
  }

  getIndicators(prices: number[], candles?: any[]) {
      const ema5 = this.calculateEMA(5, prices);
      const ema26 = this.calculateEMA(26, prices);
      const ema150 = this.calculateEMA(150, prices);
      
      // Get EMA series for angle calculation
      const ema26Series = this.getEMASeries(26, prices);
      const angle = this.calculateEMAAngle(ema26Series, 1);
      
      // Determine trend
      const trend = ema5 && ema26 && ema150 
        ? this.getTrendDirection(ema5, ema26, ema150)
        : 'neutral';
      
      // Volume (if candles provided)
      let volume = 0;
      if (candles && candles.length > 0) {
        volume = candles[candles.length - 1].volume || 0;
      }

      return {
          ema5,
          ema26,
          ema150,
          angle,
          trend,
          volume
      };
  }
}
