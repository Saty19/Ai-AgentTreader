export interface WalletState {
  balance: number; // Quote currency (USDT/USD)
  equity: number;
  pnl: number;
  currency: 'USD' | 'INR';
}

export interface WalletTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_PROFIT' | 'TRADE_LOSS';
  amount: number;
  timestamp: number;
  description?: string;
}
