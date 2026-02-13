import type { BlockTemplate } from '../../types/blocks';
import { BlockType, BlockCategory, DataType } from '../../types/blocks';

export const EMABlockTemplate: BlockTemplate = {
  type: BlockType.EMA,
  category: BlockCategory.INDICATORS,
  name: 'Exponential Moving Average',
  description: 'Calculates the Exponential Moving Average for smoother trend following',
  icon: '📈',
  inputs: [
    {
      name: 'Price',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Price values to calculate EMA'
    }
  ],
  outputs: [
    {
      name: 'EMA Value',
      dataType: DataType.NUMBER,
      description: 'Calculated EMA value'
    }
  ],
  properties: [
    {
      name: 'period',
      type: 'number',
      required: true,
      min: 1,
      max: 200,
      step: 1,
      description: 'Period for EMA calculation'
    }
  ],
  defaultSize: { width: 180, height: 120 },
  implementation: `
    class EMACalculator {
      private period: number;
      private multiplier: number;
      private ema: number | null = null;
      
      constructor(period: number) {
        this.period = period;
        this.multiplier = 2 / (period + 1);
      }
      
      update(price: number): number {
        if (this.ema === null) {
          this.ema = price;
        } else {
          this.ema = (price * this.multiplier) + (this.ema * (1 - this.multiplier));
        }
        return this.ema;
      }
      
      reset(): void {
        this.ema = null;
      }
    }
  `
};

export const SMABlockTemplate: BlockTemplate = {
  type: BlockType.SMA,
  category: BlockCategory.INDICATORS,
  name: 'Simple Moving Average',
  description: 'Calculates the Simple Moving Average over a specified period',
  icon: '📊',
  inputs: [
    {
      name: 'Price',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Price values to calculate SMA'
    }
  ],
  outputs: [
    {
      name: 'SMA Value',
      dataType: DataType.NUMBER,
      description: 'Calculated SMA value'
    }
  ],
  properties: [
    {
      name: 'period',
      type: 'number',
      required: true,
      min: 1,
      max: 200,
      step: 1,
      description: 'Period for SMA calculation'
    }
  ],
  defaultSize: { width: 180, height: 120 },
  implementation: `
    class SMACalculator {
      private period: number;
      private prices: number[] = [];
      
      constructor(period: number) {
        this.period = period;
      }
      
      update(price: number): number {
        this.prices.push(price);
        if (this.prices.length > this.period) {
          this.prices.shift();
        }
        
        const sum = this.prices.reduce((acc, p) => acc + p, 0);
        return sum / this.prices.length;
      }
      
      reset(): void {
        this.prices = [];
      }
    }
  `
};

export const RSIBlockTemplate: BlockTemplate = {
  type: BlockType.RSI,
  category: BlockCategory.INDICATORS,
  name: 'Relative Strength Index',
  description: 'Measures the speed and magnitude of price changes (0-100)',
  icon: '📉',
  inputs: [
    {
      name: 'Price',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Price values to calculate RSI'
    }
  ],
  outputs: [
    {
      name: 'RSI Value',
      dataType: DataType.NUMBER,
      description: 'RSI value between 0 and 100'
    }
  ],
  properties: [
    {
      name: 'period',
      type: 'number',
      required: true,
      min: 2,
      max: 50,
      step: 1,
      description: 'Period for RSI calculation'
    }
  ],
  defaultSize: { width: 180, height: 120 },
  implementation: `
    class RSICalculator {
      private period: number;
      private prices: number[] = [];
      private gains: number[] = [];
      private losses: number[] = [];
      
      constructor(period: number) {
        this.period = period;
      }
      
      update(price: number): number {
        if (this.prices.length > 0) {
          const change = price - this.prices[this.prices.length - 1];
          const gain = change > 0 ? change : 0;
          const loss = change < 0 ? -change : 0;
          
          this.gains.push(gain);
          this.losses.push(loss);
          
          if (this.gains.length > this.period) {
            this.gains.shift();
            this.losses.shift();
          }
        }
        
        this.prices.push(price);
        if (this.prices.length > this.period + 1) {
          this.prices.shift();
        }
        
        if (this.gains.length >= this.period) {
          const avgGain = this.gains.reduce((a, b) => a + b, 0) / this.period;
          const avgLoss = this.losses.reduce((a, b) => a + b, 0) / this.period;
          
          if (avgLoss === 0) return 100;
          const rs = avgGain / avgLoss;
          return 100 - (100 / (1 + rs));
        }
        
        return 50; // Default RSI when not enough data
      }
      
      reset(): void {
        this.prices = [];
        this.gains = [];
        this.losses = [];
      }
    }
  `
};

export const MACDBlockTemplate: BlockTemplate = {
  type: BlockType.MACD,
  category: BlockCategory.INDICATORS,
  name: 'MACD',
  description: 'Moving Average Convergence Divergence indicator',
  icon: '〰️',
  inputs: [
    {
      name: 'Price',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Price values to calculate MACD'
    }
  ],
  outputs: [
    {
      name: 'MACD Line',
      dataType: DataType.NUMBER,
      description: 'MACD line value'
    },
    {
      name: 'Signal Line',
      dataType: DataType.NUMBER,
      description: 'Signal line value'
    },
    {
      name: 'Histogram',
      dataType: DataType.NUMBER,
      description: 'MACD histogram value'
    }
  ],
  properties: [
    {
      name: 'fastPeriod',
      type: 'number',
      required: true,
      min: 1,
      max: 50,
      step: 1,
      description: 'Fast EMA period'
    },
    {
      name: 'slowPeriod',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
      step: 1,
      description: 'Slow EMA period'
    },
    {
      name: 'signalPeriod',
      type: 'number',
      required: true,
      min: 1,
      max: 50,
      step: 1,
      description: 'Signal line EMA period'
    }
  ],
  defaultSize: { width: 200, height: 150 },
  implementation: `
    class MACDCalculator {
      private fastEMA: EMACalculator;
      private slowEMA: EMACalculator;
      private signalEMA: EMACalculator;
      
      constructor(fastPeriod: number, slowPeriod: number, signalPeriod: number) {
        this.fastEMA = new EMACalculator(fastPeriod);
        this.slowEMA = new EMACalculator(slowPeriod);
        this.signalEMA = new EMACalculator(signalPeriod);
      }
      
      update(price: number): { macd: number, signal: number, histogram: number } {
        const fastValue = this.fastEMA.update(price);
        const slowValue = this.slowEMA.update(price);
        const macdLine = fastValue - slowValue;
        const signalLine = this.signalEMA.update(macdLine);
        const histogram = macdLine - signalLine;
        
        return {
          macd: macdLine,
          signal: signalLine,
          histogram: histogram
        };
      }
      
      reset(): void {
        this.fastEMA.reset();
        this.slowEMA.reset();
        this.signalEMA.reset();
      }
    }
  `
};

// Export all indicator block templates
export const IndicatorBlocks: BlockTemplate[] = [
  EMABlockTemplate,
  SMABlockTemplate,
  RSIBlockTemplate,
  MACDBlockTemplate
];