import { useCallback, useRef } from 'react';
import type { BlockConnection, StrategyBlock, ValidationError } from '../types/blocks';
import { DataType } from '../types/blocks';
import { v4 as uuidv4 } from 'uuid';

export interface ConnectionManager {
  createConnection: (connection: Omit<BlockConnection, 'id'>) => BlockConnection;
  updateConnection: (connectionId: string, updates: Partial<BlockConnection>) => void;
  deleteConnection: (connectionId: string) => void;
  validateConnection: (connection: Omit<BlockConnection, 'id'>, blocks: StrategyBlock[]) => ValidationError[];
  isValidConnectionType: (sourceType: DataType, targetType: DataType) => boolean;
  findConnectionPath: (fromBlockId: string, toBlockId: string, connections: BlockConnection[]) => BlockConnection[];
  getBlockInputConnections: (blockId: string, connections: BlockConnection[]) => BlockConnection[];
  getBlockOutputConnections: (blockId: string, connections: BlockConnection[]) => BlockConnection[];
  hasCircularDependency: (connections: BlockConnection[]) => boolean;
  deleteBlockConnections: (blockId: string) => void;
}

interface UseConnectionManagerProps {
  connections: BlockConnection[];
  onConnectionsChange: (connections: BlockConnection[]) => void;
}

export const useConnectionManager = (props?: UseConnectionManagerProps) => {
  const connectionsRef = useRef<BlockConnection[]>(props?.connections || []);
  const onConnectionsChangeRef = useRef(props?.onConnectionsChange);

  // Update refs when props change
  if (props?.connections) {
    connectionsRef.current = props.connections;
  }
  if (props?.onConnectionsChange) {
    onConnectionsChangeRef.current = props.onConnectionsChange;
  }

  const updateConnections = useCallback((newConnections: BlockConnection[]) => {
    connectionsRef.current = newConnections;
    onConnectionsChangeRef.current?.(newConnections);
  }, []);

  const createConnection = useCallback((connection: Omit<BlockConnection, 'id'>): BlockConnection => {
    const newConnection: BlockConnection = {
      id: uuidv4(),
      ...connection
    };

    const updatedConnections = [...connectionsRef.current, newConnection];
    updateConnections(updatedConnections);
    
    return newConnection;
  }, [updateConnections]);

  const updateConnection = useCallback((connectionId: string, updates: Partial<BlockConnection>) => {
    const updatedConnections = connectionsRef.current.map(conn =>
      conn.id === connectionId ? { ...conn, ...updates } : conn
    );
    updateConnections(updatedConnections);
  }, [updateConnections]);

  const deleteConnection = useCallback((connectionId: string) => {
    const updatedConnections = connectionsRef.current.filter(conn => conn.id !== connectionId);
    updateConnections(updatedConnections);
  }, [updateConnections]);

  const isValidConnectionType = useCallback((sourceType: DataType, targetType: DataType): boolean => {
    // Any type can connect to any
    if (sourceType === DataType.ANY || targetType === DataType.ANY) {
      return true;
    }

    // Same types can connect
    if (sourceType === targetType) {
      return true;
    }

    // Number can connect to string (for display/logging)
    if (sourceType === DataType.NUMBER && targetType === DataType.STRING) {
      return true;
    }

    // Array can connect to specific types if it contains that type
    if (sourceType === DataType.ARRAY || targetType === DataType.ARRAY) {
      return true;
    }

    // Candle data can provide number values (open, close, high, low)
    if (sourceType === DataType.CANDLE && targetType === DataType.NUMBER) {
      return true;
    }

    // Indicator can provide number values
    if (sourceType === DataType.INDICATOR && targetType === DataType.NUMBER) {
      return true;
    }

    // Signal can be converted to boolean
    if (sourceType === DataType.SIGNAL && targetType === DataType.BOOLEAN) {
      return true;
    }

    return false;
  }, []);

  const validateConnection = useCallback((
    connection: Omit<BlockConnection, 'id'>,
    blocks: StrategyBlock[]
  ): ValidationError[] => {
    const errors: ValidationError[] = [];

    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);

    if (!sourceBlock) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Source block not found: ${connection.sourceBlockId}`,
        connectionId: 'temp'
      });
      return errors;
    }

    if (!targetBlock) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Target block not found: ${connection.targetBlockId}`,
        connectionId: 'temp'
      });
      return errors;
    }

    // Check if source output exists
    const sourceOutput = sourceBlock.outputs.find(o => o.id === connection.sourceOutput);
    if (!sourceOutput) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Source output not found: ${connection.sourceOutput}`,
        blockId: connection.sourceBlockId,
        connectionId: 'temp'
      });
    }

    // Check if target input exists
    const targetInput = targetBlock.inputs.find(i => i.id === connection.targetInput);
    if (!targetInput) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Target input not found: ${connection.targetInput}`,
        blockId: connection.targetBlockId,
        connectionId: 'temp'
      });
    }

    // Check type compatibility
    if (sourceOutput && targetInput) {
      if (!isValidConnectionType(sourceOutput.dataType as DataType, targetInput.dataType as DataType)) {
        errors.push({
          type: 'error',
          code: 'TYPE_MISMATCH',
          message: `Cannot connect ${sourceOutput.dataType} to ${targetInput.dataType}`,
          connectionId: 'temp',
          suggestion: `Use a converter block to transform ${sourceOutput.dataType} to ${targetInput.dataType}`
        });
      }
    }

    // Check for self-connection
    if (connection.sourceBlockId === connection.targetBlockId) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: 'Cannot connect a block to itself',
        blockId: connection.sourceBlockId,
        connectionId: 'temp'
      });
    }

    // Check for duplicate connections
    const existingConnection = connectionsRef.current.find(conn =>
      conn.sourceBlockId === connection.sourceBlockId &&
      conn.sourceOutput === connection.sourceOutput &&
      conn.targetBlockId === connection.targetBlockId &&
      conn.targetInput === connection.targetInput
    );

    if (existingConnection) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: 'Connection already exists between these blocks',
        connectionId: 'temp'
      });
    }

    return errors;
  }, [isValidConnectionType]);

  const findConnectionPath = useCallback((
    fromBlockId: string,
    toBlockId: string,
    connections: BlockConnection[]
  ): BlockConnection[] => {
    const visited = new Set<string>();
    const path: BlockConnection[] = [];

    const findPath = (currentBlockId: string): boolean => {
      if (currentBlockId === toBlockId) {
        return true;
      }

      if (visited.has(currentBlockId)) {
        return false;
      }

      visited.add(currentBlockId);

      const outgoingConnections = connections.filter(conn => conn.sourceBlockId === currentBlockId);

      for (const connection of outgoingConnections) {
        path.push(connection);
        if (findPath(connection.targetBlockId)) {
          return true;
        }
        path.pop();
      }

      return false;
    };

    findPath(fromBlockId);
    return path;
  }, []);

  const getBlockInputConnections = useCallback((
    blockId: string,
    connections: BlockConnection[]
  ): BlockConnection[] => {
    return connections.filter(conn => conn.targetBlockId === blockId);
  }, []);

  const getBlockOutputConnections = useCallback((
    blockId: string,
    connections: BlockConnection[]
  ): BlockConnection[] => {
    return connections.filter(conn => conn.sourceBlockId === blockId);
  }, []);

  const hasCircularDependency = useCallback((connections: BlockConnection[]): boolean => {
    const graph: { [key: string]: string[] } = {};
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Build adjacency list
    connections.forEach(conn => {
      if (!graph[conn.sourceBlockId]) {
        graph[conn.sourceBlockId] = [];
      }
      graph[conn.sourceBlockId].push(conn.targetBlockId);
    });

    const hasCycle = (node: string): boolean => {
      if (!visited.has(node)) {
        visited.add(node);
        recursionStack.add(node);

        const neighbors = graph[node] || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && hasCycle(neighbor)) {
            return true;
          } else if (recursionStack.has(neighbor)) {
            return true;
          }
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Check for cycles in all connected components
    for (const node in graph) {
      if (hasCycle(node)) {
        return true;
      }
    }

    return false;
  }, []);

  const deleteBlockConnections = useCallback((blockId: string) => {
    const updatedConnections = connectionsRef.current.filter(conn =>
      conn.sourceBlockId !== blockId && conn.targetBlockId !== blockId
    );
    updateConnections(updatedConnections);
  }, [updateConnections]);

  const connectionManager: ConnectionManager = {
    createConnection,
    updateConnection,
    deleteConnection,
    validateConnection,
    isValidConnectionType,
    findConnectionPath,
    getBlockInputConnections,
    getBlockOutputConnections,
    hasCircularDependency,
    deleteBlockConnections
  };

  return { connectionManager };
};