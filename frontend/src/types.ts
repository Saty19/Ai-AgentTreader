export interface Candle {
  symbol: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TradeSide = 'BUY' | 'SELL';
export type TradeResult = 'WIN' | 'LOSS' | 'OPEN';

export interface Trade {
  id: number;
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

export interface Stats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  drawdown: number;
  netPnl: number;
}
