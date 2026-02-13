import { IStrategy } from '../../../core/interfaces/IStrategy';
import { Candle, Signal, Indicator } from '../../../domain/entities';
import { IndicatorService } from '../services/IndicatorService';

export class EMAStrategy implements IStrategy {
  name = 'EMA Trend Follower';
  description = 'Original strategy using EMA 5/26/150 alignment and angle.';
  
  private indicatorService: IndicatorService;
  private candles: Candle[] = [];

  constructor() {
    this.indicatorService = new IndicatorService(); 
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

    const closes = this.candles.map(c => c.close);
    const indicators = this.indicatorService.getIndicators(closes);
    
    // Check if enough data
    if (!indicators.ema150 || !indicators.angle) return null;

    const { ema5, ema26, ema150, angle } = indicators;
    
    // Type guards
    if (ema5 === null || ema26 === null || ema150 === null || angle === null) return null;

    const isBullishAlignment = ema5 > ema26 && ema26 > ema150;
    const isBearishAlignment = ema5 < ema26 && ema26 < ema150;
    
    const isBullishAngle = angle > 40;
    const isBearishAngle = angle < -40;

    let side: 'BUY' | 'SELL' | null = null;
    let reason = '';

    if (isBullishAlignment && isBullishAngle) {
        side = 'BUY';
        reason = `Bullish Alignment 5>26>150, Angle ${angle.toFixed(1)}`;
    } else if (isBearishAlignment && isBearishAngle) {
        side = 'SELL';
        reason = `Bearish Alignment 5<26<150, Angle ${angle.toFixed(1)}`;
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
            angle
        };
    }

    return null;
  }
}
