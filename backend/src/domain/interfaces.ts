import { Trade, Signal, Stats, Candle } from './entities';

export interface ITradeRepository {
  create(trade: Trade): Promise<Trade>;
  update(trade: Trade): Promise<void>;
  getAll(): Promise<Trade[]>;
  getOpenTrades(): Promise<Trade[]>;
}

export interface ISignalRepository {
  create(signal: Signal): Promise<void>;
  getLatest(limit: number): Promise<Signal[]>;
}

export interface IStatsRepository {
  get(): Promise<Stats>;
  update(stats: Stats): Promise<void>;
}

export interface IMarketDataProvider {
  subscribe(symbol: string, callback: (candle: Candle) => void): void;
}
