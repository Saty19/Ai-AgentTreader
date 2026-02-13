import { IStrategy } from '../../../core/interfaces/IStrategy';
import { Candle, Signal, Indicator } from '../../../domain/entities';
import { IndicatorService } from '../services/IndicatorService';

export interface EMAStrategySettings {
  emaPeriods: { fast: number; medium: number; slow: number };
  angleThreshold: number;
  retestThresholdPercent: number;
  minCandleBodyPercent: number;
  riskRewardRatio: number;
  stopLossPercent: number;
}

export class EMAStrategy implements IStrategy {
  name = 'EMA Trend Follower';
  description = 'EMA strategy with proper angle calculation, retest confirmation, and dynamic settings.';
  
  private indicatorService: IndicatorService;
  private candles: Candle[] = [];
  private settings: EMAStrategySettings;

  constructor(settings?: Partial<EMAStrategySettings>) {
    this.indicatorService = new IndicatorService();
    
    // Default settings
    this.settings = {
      emaPeriods: { fast: 5, medium: 26, slow: 150 },
      angleThreshold: 40,
      retestThresholdPercent: 0.5,
      minCandleBodyPercent: 0.3,
      riskRewardRatio: 2,
      stopLossPercent: 1.5,
      ...settings
    };
  }
  
  // Allow updating settings dynamically
  updateSettings(newSettings: Partial<EMAStrategySettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }
  
  getSettings(): EMAStrategySettings {
    return this.settings;
  }

  getIndicators(): Indicator[] {
    return [
      { name: 'EMA 5', value: 0, time: 0 },
      { name: 'EMA 26', value: 0, time: 0 },
      { name: 'EMA 150', value: 0, time: 0 },
      { name: 'Angle', value: 0, time: 0 },
    ];
  }

  async onCandle(candle: Candle): Promise<Signal | null> {
    this.candles.push(candle);
    if (this.candles.length > 200) this.candles.shift();

    // Need enough candles for EMA 150
    if (this.candles.length < this.settings.emaPeriods.slow) return null;

    const closes = this.candles.map(c => c.close);
    const indicators = this.indicatorService.getIndicators(closes, this.candles);
    
    const { ema5, ema26, ema150, angle, trend, volume } = indicators;
    
    // Type guards
    if (ema5 === null || ema26 === null || ema150 === null || angle === null) return null;

    // Get current and previous candle
    const currentCandle = candle;
    const previousCandle = this.candles[this.candles.length - 2];
    if (!previousCandle) return null;

    // EMA Alignment checks
    const isBullishAlignment = ema5 > ema26 && ema26 > ema150;
    const isBearishAlignment = ema5 < ema26 && ema26 < ema150;
    
    // Angle checks (using dynamic threshold)
    const isBullishAngle = angle > this.settings.angleThreshold;
    const isBearishAngle = angle < -this.settings.angleThreshold;
    
    // Price retest checks
    const isPriceRetestingEMA26 = this.indicatorService.isPriceNearEMA(
      currentCandle.close, 
      ema26, 
      this.settings.retestThresholdPercent
    );
    
    // Candle confirmation
    const isBullishCandleConfirmation = this.indicatorService.isBullishCandle(
      currentCandle.open,
      currentCandle.close,
      this.settings.minCandleBodyPercent
    );
    
    const isBearishCandleConfirmation = this.indicatorService.isBearishCandle(
      currentCandle.open,
      currentCandle.close,
      this.settings.minCandleBodyPercent
    );

    let side: 'BUY' | 'SELL' | null = null;
    let reason = '';
    let stopLoss = 0;
    let takeProfit = 0;

    // BUY CONDITIONS:
    // 1. EMA 5 > EMA 26 > EMA 150 (bullish alignment)
    // 2. Angle > threshold degrees
    // 3. Price retest near EMA 26
    // 4. Bullish candle confirmation
    if (isBullishAlignment && isBullishAngle && isPriceRetestingEMA26 && isBullishCandleConfirmation) {
        side = 'BUY';
        reason = `BUY: Alignment(${ema5.toFixed(2)}>${ema26.toFixed(2)}>${ema150.toFixed(2)}), Angle(${angle.toFixed(1)}°), Retest EMA26, Bullish Candle`;
        
        // Calculate stop loss (previous swing low or percentage-based)
        const recentLows = this.candles.slice(-20).map(c => c.low);
        const swingLow = Math.min(...recentLows);
        stopLoss = Math.min(swingLow, currentCandle.close * (1 - this.settings.stopLossPercent / 100));
        
        // Calculate take profit (Risk-Reward ratio)
        const risk = currentCandle.close - stopLoss;
        takeProfit = currentCandle.close + (risk * this.settings.riskRewardRatio);
    }
    // SELL CONDITIONS:
    // 1. EMA 5 < EMA 26 < EMA 150 (bearish alignment)
    // 2. Angle < -threshold degrees
    // 3. Price retest near EMA 26
    // 4. Bearish candle confirmation
    else if (isBearishAlignment && isBearishAngle && isPriceRetestingEMA26 && isBearishCandleConfirmation) {
        side = 'SELL';
        reason = `SELL: Alignment(${ema5.toFixed(2)}<${ema26.toFixed(2)}<${ema150.toFixed(2)}), Angle(${angle.toFixed(1)}°), Retest EMA26, Bearish Candle`;
        
        // Calculate stop loss (previous swing high or percentage-based)
        const recentHighs = this.candles.slice(-20).map(c => c.high);
        const swingHigh = Math.max(...recentHighs);
        stopLoss = Math.max(swingHigh, currentCandle.close * (1 + this.settings.stopLossPercent / 100));
        
        // Calculate take profit
        const risk = stopLoss - currentCandle.close;
        takeProfit = currentCandle.close - (risk * this.settings.riskRewardRatio);
    }

    if (side) {
        return {
            symbol: candle.symbol,
            side: side,
            price: candle.close,
            time: candle.time,
            reason: reason,
            ema5,
            ema26,
            ema150,
            angle,
            stopLoss,
            takeProfit,
            trend,
            volume
        };
    }

    return null;
  }
}
