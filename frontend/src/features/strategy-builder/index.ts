// Main Strategy Builder Components
export { StrategyCanvas } from './components/StrategyCanvas';
export { BlockRenderer } from './components/BlockRenderer';
export { ConnectionRenderer } from './components/ConnectionRenderer';
export { ComponentPalette } from './components/ComponentPalette';
export { PropertiesPanel } from './components/PropertiesPanel';
export { StrategyToolbar } from './components/StrategyToolbar';
export { ValidationPanel } from './components/ValidationPanel';

// Hooks
export { useBlockManager } from './hooks/useBlockManager';
export { useConnectionManager } from './hooks/useConnectionManager';
export { useStrategyBuilder } from './hooks/useStrategyBuilder';
export { useStrategyValidation } from './hooks/useStrategyValidation';
export { useCodeGeneration } from './hooks/useCodeGeneration';

// Services
export { BlockService } from './services/BlockService';
export { ConnectionService } from './services/ConnectionService';

// API
export * from './api';

// Types
export * from './types/blocks';
export * from './types/services';

// Block Templates
export * from './blocks';