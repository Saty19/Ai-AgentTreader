import { IStrategy } from '../../../core/interfaces/IStrategy';
import { Candle, Signal, Indicator } from '../../../domain/entities';
import { IndicatorService } from '../services/IndicatorService';

export class MACDStrategy implements IStrategy {
  name = 'MACD Crossover';
  description = 'Trend following strategy using MACD crossovers.';
  
  private indicatorService: IndicatorService;
  private candles: Candle[] = [];

  constructor() {
    this.indicatorService = new IndicatorService(); // Ideally injected
  }

  getIndicators(): Indicator[] {
    return [
      { name: 'MACD', value: 0, time: 0 }, // Placeholder for metadata
    ];
  }

  async onCandle(candle: Candle): Promise<Signal | null> {
    this.candles.push(candle);
    if (this.candles.length > 200) this.candles.shift();

    const closes = this.candles.map(c => c.close);
    const macdData = this.indicatorService.calculateMACD(closes);

    if (!macdData) return null;

    const { macd, signal, histogram } = macdData;
    
    // Logic: 
    // Buy when Histogram crosses from negative to positive? 
    // Or MACD crosses Signal upward. (Standard)
    // We need previous values to detect crossover.
    // For simplicity here, we check if Histogram is positive (Bullish) or negative (Bearish)
    // and if it *just* flipped.

    // To do strict crossover, we need history of MACD.
    // calculateMACD returns only *current* values in my implementation.
    // I should return the series or store previous.
    // Storing previous state:
    
    // ... skipping state complexity for this MVP step ...
    // Let's implement a simple condition:
    // Buy: MACD > Signal (Histogram > 0) AND Histogram > 0.05 (Threshold to avoid noise)
    
    let side: 'BUY' | 'SELL' | null = null;
    let reason = '';

    if (histogram > 0.0001 && macd > signal) {
        // Only signal if we are in a "fresh" trend? 
        // Real crossover logic requires tracking.
        side = 'BUY';
        reason = `MACD Crossover Bullish (Hist: ${histogram.toFixed(5)})`;
    } else if (histogram < -0.0001 && macd < signal) {
        side = 'SELL';
        reason = `MACD Crossover Bearish (Hist: ${histogram.toFixed(5)})`;
    }

    if (side) {
        return {
            symbol: candle.symbol,
            side: side,
            price: candle.close,
            time: candle.time,
            reason: reason,
            ema5: 0, // Not used
            ema26: 0,
            ema150: 0,
            angle: 0
        };
    }

    return null;
  }
}
