export interface Candle {
  symbol: string;
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed?: boolean;
}

export interface Indicator {
  name: string;
  value: number;
  time: number;
}

export interface Indicators {
  ema5: number | null;
  ema26: number | null;
  ema150: number | null;
  angle: number | null;
}

export type TradeSide = 'BUY' | 'SELL';
export type TradeResult = 'WIN' | 'LOSS' | 'OPEN';

export interface Trade {
  id?: number;
  symbol: string;
  side: TradeSide;
  entryPrice: number;
  exitPrice?: number;
  sl: number;
  tp: number;
  pnl?: number;
  result: TradeResult;
  entryTime: number;
  exitTime?: number;
}

export interface Signal {
  symbol: string;
  side: TradeSide;
  price: number;
  time: number;
  reason: string;
  ema5: number;
  ema26: number;
  ema150: number;
  angle: number;
}

export interface Stats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  drawdown: number;
  netPnl: number;
}
