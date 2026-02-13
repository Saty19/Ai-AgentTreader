

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IIndicator {
  id: string;
  name: string;
  type: 'overlay' | 'oscillator';
  calculate: (data: ChartData[]) => any[];
  draw: (chart: any, series: any, data: any[]) => void; // Using any for LW chart instance for now to avoid strict typing issues initially
  options?: any;
}

export interface IStrategyPlugin {
  id: string;
  name: string;
  generateSignal: (data: ChartData[]) => { time: number; type: 'buy' | 'sell'; price: number; label?: string }[];
}

export interface ChartState {
  symbol: string;
  timeframe: Timeframe;
  market: 'crypto' | 'india';
  indicators: IIndicator[];
  activeStrategy: IStrategyPlugin | null;
  drawings: any[]; // Placeholder for drawings
  activeTrades?: any[];
  activeTool: 'cursor' | 'trendline' | 'horizontal' | 'brush' | 'eraser';
}
