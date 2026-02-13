// Strategy Builder service interfaces

import type { StrategyBlock, StrategyDefinition, BlockConnection, ValidationError, CompiledStrategy, BlockTemplate } from '../types/blocks';

export interface IStrategyBuilderService {
  // Strategy management
  createStrategy(name: string, description: string): Promise<StrategyDefinition>;
  saveStrategy(strategy: StrategyDefinition): Promise<void>;
  loadStrategy(id: string): Promise<StrategyDefinition>;
  deleteStrategy(id: string): Promise<void>;
  listStrategies(userId: string): Promise<StrategyDefinition[]>;
  
  // Strategy validation and compilation
  validateStrategy(strategy: StrategyDefinition): Promise<ValidationError[]>;
  compileStrategy(strategy: StrategyDefinition): Promise<CompiledStrategy>;
  
  // Strategy execution
  deployStrategy(compiledStrategy: CompiledStrategy): Promise<void>;
  stopStrategy(strategyId: string): Promise<void>;
}

export interface IBlockService {
  // Block management
  getAvailableBlocks(): Promise<BlockTemplate[]>;
  createBlock(template: BlockTemplate): StrategyBlock;
  updateBlock(blockId: string, updates: Partial<StrategyBlock>): void;
  deleteBlock(blockId: string): void;
  duplicateBlock(blockId: string): StrategyBlock;
  
  // Block validation
  validateBlock(block: StrategyBlock): ValidationError[];
  validateBlockConnections(block: StrategyBlock, connections: BlockConnection[]): ValidationError[];
}

export interface IConnectionService {
  // Connection management
  createConnection(connection: Omit<BlockConnection, 'id'>): BlockConnection;
  updateConnection(connectionId: string, updates: Partial<BlockConnection>): void;
  deleteConnection(connectionId: string): void;
  
  // Connection validation
  validateConnection(connection: BlockConnection, blocks: StrategyBlock[]): ValidationError[];
  isValidConnectionType(sourceType: string, targetType: string): boolean;
  findConnectionPath(fromBlockId: string, toBlockId: string, connections: BlockConnection[]): BlockConnection[];
  
  // Connection utilities
  getBlockInputConnections(blockId: string, connections: BlockConnection[]): BlockConnection[];
  getBlockOutputConnections(blockId: string, connections: BlockConnection[]): BlockConnection[];
  hasCircularDependency(connections: BlockConnection[]): boolean;
}

export interface ICodeGenerationService {
  // Code generation
  generateStrategyCode(strategy: StrategyDefinition): Promise<CompiledStrategy>;
  generateBlockCode(block: StrategyBlock): string;
  optimizeCode(code: string, level: number): string;
  
  // Code analysis
  analyzePerformance(code: string): PerformanceMetrics;
  validateGeneratedCode(code: string): ValidationError[];
}

export interface IValidationService {
  // Strategy validation
  validateStrategyStructure(strategy: StrategyDefinition): ValidationError[];
  validateDataFlow(strategy: StrategyDefinition): ValidationError[];
  validateBusinessLogic(strategy: StrategyDefinition): ValidationError[];
  
  // Block validation
  validateBlockProperties(block: StrategyBlock): ValidationError[];
  validateBlockInputs(block: StrategyBlock): ValidationError[];
  validateBlockOutputs(block: StrategyBlock): ValidationError[];
}

export interface PerformanceMetrics {
  complexity: number;
  estimatedExecutionTime: number;
  memoryUsage: number;
  dependencies: string[];
  bottlenecks: string[];
  optimizationSuggestions: string[];
}