// Core block types and interfaces for Strategy Builder

export interface BlockPosition {
  x: number;
  y: number;
}

export interface BlockSize {
  width: number;
  height: number;
}

export interface BlockConnection {
  id: string;
  sourceBlockId: string;
  sourceOutput: string;
  targetBlockId: string;
  targetInput: string;
  dataType: DataType;
}

export interface BlockInput {
  id: string;
  name: string;
  dataType: DataType;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface BlockOutput {
  id: string;
  name: string;
  dataType: DataType;
  description?: string;
}

export interface BlockProperty {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  value: any;
  options?: { label: string; value: any }[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface StrategyBlock {
  id: string;
  type: BlockType;
  category: BlockCategory;
  name: string;
  description: string;
  position: BlockPosition;
  size: BlockSize;
  inputs: BlockInput[];
  outputs: BlockOutput[];
  properties: BlockProperty[];
  isCustom: boolean;
  implementation?: string;
}

export interface StrategyDefinition {
  id?: string;
  name?: string;
  description?: string;
  version?: number;
  blocks: SimpleBlock[];
  connections: SimpleConnection[];
  metadata?: {
    createdAt?: number;
    updatedAt?: number;
    createdBy?: string;
    tags?: string[];
  };
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isPublic?: boolean;
  userId?: string;
  strategyDefinition?: {
    blocks: SimpleBlock[];
    connections: SimpleConnection[];
    version?: number;
    metadata?: any;
  };
}

// Simplified backward compatibility types
export interface SimpleBlock {
  id: string;
  type: string;
  position: BlockPosition;
  properties?: Record<string, any>;
  name?: string;
}

export interface SimpleConnection {
  id?: string;
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
  sourceBlockId?: string;
  targetBlockId?: string;
  sourceOutput?: string;
  targetInput?: string;
  dataType?: DataType;
}

// Type aliases for compatibility
export type Block = SimpleBlock;
export type Connection = SimpleConnection;

export interface CompiledStrategy {
  id: string;
  name: string;
  description: string;
  code: string;
  sourceMap: SourceMap;
  dependencies: string[];
  optimizationLevel: number;
  compiledAt: number;
}

export interface ValidationError {
  blockId?: string;
  connectionId?: string;
  type: 'error' | 'warning';
  code: string;
  message: string;
  suggestion?: string;
}

export interface SourceMap {
  blocks: { [blockId: string]: { line: number; column: number } };
  connections: { [connectionId: string]: { line: number; column: number } };
}

export const DataType = {
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  STRING: 'string',
  ARRAY: 'array',
  CANDLE: 'candle',
  INDICATOR: 'indicator',
  SIGNAL: 'signal',
  ORDER: 'order',
  ANY: 'any'
} as const;

export type DataType = typeof DataType[keyof typeof DataType];

export const BlockType = {
  // Input blocks
  MARKET_DATA: 'market_data',
  PARAMETER: 'parameter',
  TIME_CONDITION: 'time_condition',
  
  // Indicator blocks
  EMA: 'ema',
  SMA: 'sma',
  MACD: 'macd',
  RSI: 'rsi',
  BOLLINGER_BANDS: 'bollinger_bands',
  STOCHASTIC: 'stochastic',
  
  // Logic blocks
  COMPARISON: 'comparison',
  LOGICAL_AND: 'logical_and',
  LOGICAL_OR: 'logical_or',
  LOGICAL_NOT: 'logical_not',
  CONDITIONAL: 'conditional',
  
  // Math blocks
  ARITHMETIC: 'arithmetic',
  MATH_FUNCTION: 'math_function',
  
  // Action blocks
  BUY_ORDER: 'buy_order',
  SELL_ORDER: 'sell_order',
  CLOSE_POSITION: 'close_position',
  STOP_LOSS: 'stop_loss',
  TAKE_PROFIT: 'take_profit',
  NOTIFICATION: 'notification',
  
  // Output blocks
  SIGNAL_OUTPUT: 'signal_output',
  LOG_OUTPUT: 'log_output',
  
  // Custom blocks
  CUSTOM: 'custom'
} as const;

export type BlockType = typeof BlockType[keyof typeof BlockType];

export const BlockCategory = {
  INPUT: 'input',
  INDICATORS: 'indicators',
  LOGIC: 'logic',
  MATH: 'math',
  ACTIONS: 'actions',
  OUTPUTS: 'outputs',
  CUSTOM: 'custom'
} as const;

export type BlockCategory = typeof BlockCategory[keyof typeof BlockCategory];

export interface BlockTemplate {
  type: BlockType;
  category: BlockCategory;
  name: string;
  description: string;
  icon: string;
  inputs: Omit<BlockInput, 'id'>[];
  outputs: Omit<BlockOutput, 'id'>[];
  properties: Omit<BlockProperty, 'id' | 'value'>[];
  defaultSize: BlockSize;
  implementation: string;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags: string[];
  previewImage: string;
  strategyDefinition: StrategyDefinition;
  downloadCount: number;
  rating: number;
  createdBy: string;
  createdAt: number;
}