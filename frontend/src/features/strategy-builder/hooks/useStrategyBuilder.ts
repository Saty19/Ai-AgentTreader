import { useState, useCallback, useRef, useEffect } from 'react';
import type { StrategyDefinition, StrategyBlock, BlockConnection, ValidationError, BlockTemplate, BlockPosition } from '../types/blocks';
import { useBlockManager } from './useBlockManager';
import { useConnectionManager } from './useConnectionManager';
import { useStrategyValidation } from './useStrategyValidation';
import { v4 as uuidv4 } from 'uuid';

interface UseStrategyBuilderProps {
  initialStrategy?: StrategyDefinition;
  blockTemplates: BlockTemplate[];
  onStrategyChange?: (strategy: StrategyDefinition) => void;
}

export interface StrategyBuilderState {
  strategy: StrategyDefinition | null;
  selectedBlockId: string | null;
  validationErrors: ValidationError[];
  isEditable: boolean;
  zoom: number;
  panPosition: BlockPosition;
  loading: boolean;
}

export interface StrategyBuilderActions {
  // Strategy operations
  createNewStrategy: (name?: string, description?: string) => void;
  loadStrategy: (strategy: StrategyDefinition) => void;
  saveStrategy: () => Promise<void>;
  updateStrategyInfo: (updates: Partial<Pick<StrategyDefinition, 'name' | 'description'>>) => void;
  
  // Block operations
  addBlock: (template: BlockTemplate, position: BlockPosition) => StrategyBlock;
  updateBlock: (blockId: string, updates: Partial<StrategyBlock>) => void;
  deleteBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => StrategyBlock | null;
  selectBlock: (blockId: string | null) => void;
  
  // Block properties
  updateBlockProperty: (blockId: string, propertyId: string, value: any) => void;
  
  // Connection operations
  createConnection: (connection: Omit<BlockConnection, 'id'>) => void;
  deleteConnection: (connectionId: string) => void;
  
  // Canvas operations
  setZoom: (zoom: number) => void;
  setPanPosition: (position: BlockPosition) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  fitToScreen: () => void;
  
  // Validation and compilation
  validateStrategy: () => Promise<ValidationError[]>;
  compileStrategy: () => Promise<void>;
  testStrategy: () => Promise<void>;
  deployStrategy: () => Promise<void>;
  
  // Undo/redo
  undo: () => void;
  redo: () => void;
}

export const useStrategyBuilder = ({ 
  initialStrategy,
  // blockTemplates,
  onStrategyChange 
}: UseStrategyBuilderProps) => {
  // State
  const [strategy, setStrategy] = useState<StrategyDefinition | null>(initialStrategy || null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isEditable] = useState(true);
  const [zoom, setZoomState] = useState(1);
  const [panPosition, setPanPositionState] = useState<BlockPosition>({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  // History for undo/redo
  const historyRef = useRef<StrategyDefinition[]>([]);
  const historyIndexRef = useRef(-1);

  // Managers
  const { blockManager } = useBlockManager({
    blocks: strategy?.blocks || [],
    onBlocksChange: useCallback((blocks: StrategyBlock[]) => {
      if (strategy) {
        const updatedStrategy = { ...strategy, blocks };
        setStrategy(updatedStrategy);
        onStrategyChange?.(updatedStrategy);
      }
    }, [strategy, onStrategyChange])
  });

  const { connectionManager } = useConnectionManager({
    connections: strategy?.connections || [],
    onConnectionsChange: useCallback((connections: BlockConnection[]) => {
      if (strategy) {
        const updatedStrategy = { ...strategy, connections };
        setStrategy(updatedStrategy);
        onStrategyChange?.(updatedStrategy);
      }
    }, [strategy, onStrategyChange])
  });

  const { validateStrategyStructure } = useStrategyValidation();

  // Add to history when strategy changes
  useEffect(() => {
    if (strategy) {
      // Remove any entries after current index (when undoing then making changes)
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      
      // Add new state
      historyRef.current.push({ ...strategy });
      historyIndexRef.current = historyRef.current.length - 1;
      
      // Limit history size
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
        historyIndexRef.current--;
      }
    }
  }, [strategy]);

  // Strategy operations
  const createNewStrategy = useCallback((name = 'New Strategy', description = '') => {
    const newStrategy: StrategyDefinition = {
      id: uuidv4(),
      name,
      description,
      version: 1,
      blocks: [],
      connections: [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'current-user', // TODO: Get from auth context
        tags: []
      }
    };
    
    setStrategy(newStrategy);
    setSelectedBlockId(null);
    setValidationErrors([]);
    historyRef.current = [newStrategy];
    historyIndexRef.current = 0;
    onStrategyChange?.(newStrategy);
  }, [onStrategyChange]);

  const loadStrategy = useCallback((loadedStrategy: StrategyDefinition) => {
    setStrategy(loadedStrategy);
    setSelectedBlockId(null);
    setValidationErrors([]);
    historyRef.current = [loadedStrategy];
    historyIndexRef.current = 0;
    onStrategyChange?.(loadedStrategy);
  }, [onStrategyChange]);

  const saveStrategy = useCallback(async () => {
    if (!strategy) return;
    
    setLoading(true);
    try {
      // TODO: Implement API call to save strategy
      const updatedStrategy = {
        ...strategy,
        metadata: {
          ...strategy.metadata,
          updatedAt: Date.now()
        }
      };
      setStrategy(updatedStrategy);
      onStrategyChange?.(updatedStrategy);
    } catch (error) {
      console.error('Failed to save strategy:', error);
    } finally {
      setLoading(false);
    }
  }, [strategy, onStrategyChange]);

  const updateStrategyInfo = useCallback((updates: Partial<Pick<StrategyDefinition, 'name' | 'description'>>) => {
    if (strategy) {
      const updatedStrategy = { 
        ...strategy, 
        ...updates,
        metadata: { ...strategy.metadata, updatedAt: Date.now() }
      };
      setStrategy(updatedStrategy);
      onStrategyChange?.(updatedStrategy);
    }
  }, [strategy, onStrategyChange]);

  // Block operations
  const addBlock = useCallback((template: BlockTemplate, position: BlockPosition): StrategyBlock => {
    const newBlock = blockManager.createBlock(template, position);
    
    // Auto-select the new block
    setSelectedBlockId(newBlock.id);
    
    return newBlock;
  }, [blockManager]);

  const updateBlock = useCallback((blockId: string, updates: Partial<StrategyBlock>) => {
    blockManager.updateBlock(blockId, updates);
  }, [blockManager]);

  const deleteBlock = useCallback((blockId: string) => {
    // Delete associated connections first
    connectionManager.deleteBlockConnections(blockId);
    
    // Delete the block
    blockManager.deleteBlock(blockId);
    
    // Clear selection if this block was selected
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [blockManager, connectionManager, selectedBlockId]);

  const duplicateBlock = useCallback((blockId: string): StrategyBlock | null => {
    return blockManager.duplicateBlock(blockId);
  }, [blockManager]);

  const selectBlock = useCallback((blockId: string | null) => {
    setSelectedBlockId(blockId);
  }, []);

  // Block properties
  const updateBlockProperty = useCallback((blockId: string, propertyId: string, value: any) => {
    blockManager.updateBlockProperty(blockId, propertyId, value);
  }, [blockManager]);

  // Connection operations
  const createConnection = useCallback((connection: Omit<BlockConnection, 'id'>) => {
    const validationErrors = connectionManager.validateConnection(connection, strategy?.blocks || []);
    
    if (validationErrors.length === 0) {
      connectionManager.createConnection(connection);
    } else {
      setValidationErrors(prev => [...prev, ...validationErrors]);
    }
  }, [connectionManager, strategy]);

  const deleteConnection = useCallback((connectionId: string) => {
    connectionManager.deleteConnection(connectionId);
  }, [connectionManager]);

  // Canvas operations
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.min(Math.max(newZoom, 0.25), 2);
    setZoomState(clampedZoom);
  }, []);

  const setPanPosition = useCallback((position: BlockPosition) => {
    setPanPositionState(position);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(zoom * 1.2);
  }, [zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoom / 1.2);
  }, [zoom, setZoom]);

  const zoomReset = useCallback(() => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  }, [setZoom, setPanPosition]);

  const fitToScreen = useCallback(() => {
    if (!strategy?.blocks.length) return;
    
    const bounds = blockManager.getBlockBounds(strategy.blocks);
    const padding = 50;
    
    // TODO: Get actual canvas size from ref
    const canvasWidth = 800;
    const canvasHeight = 600;
    
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
    
    const zoomX = canvasWidth / contentWidth;
    const zoomY = canvasHeight / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 1);
    
    setZoom(newZoom);
    setPanPosition({
      x: -(bounds.minX - padding) * newZoom,
      y: -(bounds.minY - padding) * newZoom
    });
  }, [strategy, blockManager, setZoom, setPanPosition]);

  // Validation and compilation
  const validateStrategy = useCallback(async (): Promise<ValidationError[]> => {
    if (!strategy) return [];
    
    setLoading(true);
    try {
      const errors = validateStrategyStructure(strategy);
      setValidationErrors(errors);
      return errors;
    } catch (error) {
      console.error('Validation failed:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [strategy, validateStrategyStructure]);

  const compileStrategy = useCallback(async () => {
    if (!strategy) return;
    
    setLoading(true);
    try {
      // TODO: Implement compilation
      console.log('Compiling strategy:', strategy.name);
    } catch (error) {
      console.error('Compilation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [strategy]);

  const testStrategy = useCallback(async () => {
    if (!strategy) return;
    
    setLoading(true);
    try {
      // TODO: Implement testing
      console.log('Testing strategy:', strategy.name);
    } catch (error) {
      console.error('Testing failed:', error);
    } finally {
      setLoading(false);
    }
  }, [strategy]);

  const deployStrategy = useCallback(async () => {
    if (!strategy) return;
    
    setLoading(true);
    try {
      // TODO: Implement deployment
      console.log('Deploying strategy:', strategy.name);
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setLoading(false);
    }
  }, [strategy]);

  // Undo/redo
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousState = historyRef.current[historyIndexRef.current];
      setStrategy(previousState);
      onStrategyChange?.(previousState);
    }
  }, [onStrategyChange]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextState = historyRef.current[historyIndexRef.current];
      setStrategy(nextState);
      onStrategyChange?.(nextState);
    }
  }, [onStrategyChange]);

  const state: StrategyBuilderState = {
    strategy,
    selectedBlockId,
    validationErrors,
    isEditable,
    zoom,
    panPosition,
    loading
  };

  const actions: StrategyBuilderActions = {
    createNewStrategy,
    loadStrategy,
    saveStrategy,
    updateStrategyInfo,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    selectBlock,
    updateBlockProperty,
    createConnection,
    deleteConnection,
    setZoom,
    setPanPosition,
    zoomIn,
    zoomOut,
    zoomReset,
    fitToScreen,
    validateStrategy,
    compileStrategy,
    testStrategy,
    deployStrategy,
    undo,
    redo
  };

  return {
    state,
    actions,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1
  };
};