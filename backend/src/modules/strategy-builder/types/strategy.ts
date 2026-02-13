// Core Strategy Builder Types

export interface StrategyDefinition {
  blocks: Block[];
  connections: Connection[];
  metadata?: StrategyMetadata;
  version?: number;
}

export interface Block {
  id: string;
  type: string;
  position: Position;
  properties?: Record<string, any>;
  name?: string;
}

export interface Connection {
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface StrategyMetadata {
  name?: string;
  description?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  [key: string]: any;
}

export interface ValidationError {
  type: string;
  message: string;
  severity: 'error' | 'warning';
  blockId: string | undefined;
}

export interface CompiledStrategy {
  id: string;
  version: number;
  executionOrder: string[];
  code: string;
  metadata: any;
}

export interface BacktestParams {
  strategyDefinition: StrategyDefinition;
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  commission: number;
  userId: string;
}

export interface BacktestResults {
  totalReturn: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profit: number;
  loss: number;
  averageWin: number;
  averageLoss: number;
  trades: Trade[];
  equity: EquityPoint[];
}

export interface Trade {
  type: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  quantity: number;
  timestamp: string;
  commission?: number;
  profit?: number;
}

export interface EquityPoint {
  timestamp: string;
  value: number;
}

export interface BlockTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  properties?: PropertyDefinition[];
  icon?: string;
  color?: string;
}

export interface PortDefinition {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

export interface PropertyDefinition {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  label: string;
  default?: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  required?: boolean;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  strategyDefinition: StrategyDefinition;
  previewImage?: string;
  documentation?: string;
  tags: string[];
  isFeatured: boolean;
  usageCount: number;
  ratingAverage: number;
  ratingCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomBlock {
  id: string;
  userId: string;
  blockType: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  implementationCode: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeploymentConfig {
  enablePaperTrading?: boolean;
  maxPositionSize?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
}

export interface StrategyDeployment {
  id: string;
  strategyId: string;
  userId: string;
  deploymentName: string;
  status: 'RUNNING' | 'STOPPED' | 'PAUSED' | 'ERROR';
  config: string;
  paperTrading: boolean;
  maxPositionSize?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  lastSignalAt?: Date;
  deployedAt: Date;
  stoppedAt?: Date;
}

export interface StrategyBacktest {
  id: string;
  strategyId: string | null;
  userId: string;
  name: string | null;
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  commission: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  results: string | null;
  errorMessage: string | null;
  executionTime: number | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface MarketDataCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategyExecutionContext {
  marketData: MarketDataCandle;
  historicalData: MarketDataCandle[];
  portfolio: {
    balance: number;
    equity: number;
    positions: Position[];
  };
  broker: {
    buy: (params: OrderParams) => Promise<void>;
    sell: (params: OrderParams) => Promise<void>;
  };
  indicators: {
    sma: (period: number) => number;
    ema: (period: number) => number;
    rsi: (period: number) => number;
    [key: string]: any;
  };
  emitSignal: (signal: any) => Promise<void>;
}

export interface OrderParams {
  symbol: string;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  price?: number;
}

export interface Signal {
  type: 'BUY' | 'SELL' | 'CUSTOM';
  symbol: string;
  quantity?: number;
  price?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}