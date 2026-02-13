import type { BlockConnection, StrategyBlock, ValidationError } from '../types/blocks';
import type { IConnectionService } from '../types/services';
import { DataType } from '../types/blocks';
import { v4 as uuidv4 } from 'uuid';

export class ConnectionService implements IConnectionService {
  
  createConnection(connection: Omit<BlockConnection, 'id'>): BlockConnection {
    return {
      id: uuidv4(),
      ...connection
    };
  }

  updateConnection(connectionId: string, updates: Partial<BlockConnection>): void {
    // This method would typically update the connection in a store or state management system
    console.log(`Updating connection ${connectionId}:`, updates);
  }

  deleteConnection(connectionId: string): void {
    // This method would typically remove the connection from a store or state management system
    console.log(`Deleting connection: ${connectionId}`);
  }

  validateConnection(connection: BlockConnection, blocks: StrategyBlock[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);

    // Check if blocks exist
    if (!sourceBlock) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: 'Source block not found',
        connectionId: connection.id
      });
      return errors;
    }

    if (!targetBlock) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: 'Target block not found',
        connectionId: connection.id
      });
      return errors;
    }

    // Check if source output exists
    const sourceOutput = sourceBlock.outputs.find(o => o.id === connection.sourceOutput);
    if (!sourceOutput) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: 'Source output not found',
        connectionId: connection.id,
        blockId: connection.sourceBlockId
      });
    }

    // Check if target input exists
    const targetInput = targetBlock.inputs.find(i => i.id === connection.targetInput);
    if (!targetInput) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: 'Target input not found',
        connectionId: connection.id,
        blockId: connection.targetBlockId
      });
    }

    // Check for self-connection
    if (connection.sourceBlockId === connection.targetBlockId) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: 'Cannot connect a block to itself',
        connectionId: connection.id,
        blockId: connection.sourceBlockId
      });
    }

    // Validate data type compatibility
    if (sourceOutput && targetInput) {
      if (!this.isValidConnectionType(sourceOutput.dataType as DataType, targetInput.dataType as DataType)) {
        errors.push({
          type: 'error',
          code: 'TYPE_MISMATCH',
          message: `Cannot connect ${sourceOutput.dataType} output to ${targetInput.dataType} input`,
          connectionId: connection.id,
          suggestion: `Use a converter block to transform data types`
        });
      }
    }

    return errors;
  }

  isValidConnectionType(sourceType: DataType, targetType: DataType): boolean {
    // Any type can connect to any
    if (sourceType === DataType.ANY || targetType === DataType.ANY) {
      return true;
    }

    // Same types can connect
    if (sourceType === targetType) {
      return true;
    }

    // Define compatibility rules
    const compatibilityMatrix: { [source: string]: DataType[] } = {
      [DataType.NUMBER]: [DataType.STRING, DataType.BOOLEAN],
      [DataType.BOOLEAN]: [DataType.STRING, DataType.NUMBER],
      [DataType.STRING]: [DataType.NUMBER, DataType.BOOLEAN],
      [DataType.CANDLE]: [DataType.NUMBER],
      [DataType.INDICATOR]: [DataType.NUMBER],
      [DataType.SIGNAL]: [DataType.BOOLEAN, DataType.NUMBER],
      [DataType.ORDER]: [DataType.SIGNAL],
      [DataType.ARRAY]: [DataType.NUMBER, DataType.STRING, DataType.BOOLEAN]
    };

    const compatibleTypes = compatibilityMatrix[sourceType.toString()] || [];
    return compatibleTypes.includes(targetType);
  }

  findConnectionPath(fromBlockId: string, toBlockId: string, connections: BlockConnection[]): BlockConnection[] {
    const visited = new Set<string>();
    const path: BlockConnection[] = [];

    const dfs = (currentBlockId: string): boolean => {
      if (currentBlockId === toBlockId) {
        return true;
      }

      if (visited.has(currentBlockId)) {
        return false;
      }

      visited.add(currentBlockId);

      // Find all outgoing connections from current block
      const outgoingConnections = connections.filter(conn => conn.sourceBlockId === currentBlockId);

      for (const connection of outgoingConnections) {
        path.push(connection);
        
        if (dfs(connection.targetBlockId)) {
          return true;
        }
        
        path.pop();
      }

      return false;
    };

    dfs(fromBlockId);
    return path;
  }

  getBlockInputConnections(blockId: string, connections: BlockConnection[]): BlockConnection[] {
    return connections.filter(conn => conn.targetBlockId === blockId);
  }

  getBlockOutputConnections(blockId: string, connections: BlockConnection[]): BlockConnection[] {
    return connections.filter(conn => conn.sourceBlockId === blockId);
  }

  hasCircularDependency(connections: BlockConnection[]): boolean {
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
      if (recursionStack.has(node)) {
        return true; // Back edge found - cycle detected
      }
      
      if (visited.has(node)) {
        return false; // Already processed
      }

      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Check for cycles starting from each unvisited node
    for (const node in graph) {
      if (!visited.has(node) && hasCycle(node)) {
        return true;
      }
    }

    return false;
  }

  // Additional utility methods

  /**
   * Find all blocks that depend on a given block
   */
  findDependentBlocks(blockId: string, connections: BlockConnection[]): string[] {
    const dependents = new Set<string>();
    const visited = new Set<string>();

    const dfs = (currentBlockId: string) => {
      if (visited.has(currentBlockId)) {
        return;
      }
      
      visited.add(currentBlockId);
      
      const outputConnections = this.getBlockOutputConnections(currentBlockId, connections);
      outputConnections.forEach(conn => {
        dependents.add(conn.targetBlockId);
        dfs(conn.targetBlockId);
      });
    };

    dfs(blockId);
    return Array.from(dependents);
  }

  /**
   * Find all blocks that a given block depends on
   */
  findDependencyBlocks(blockId: string, connections: BlockConnection[]): string[] {
    const dependencies = new Set<string>();
    const visited = new Set<string>();

    const dfs = (currentBlockId: string) => {
      if (visited.has(currentBlockId)) {
        return;
      }
      
      visited.add(currentBlockId);
      
      const inputConnections = this.getBlockInputConnections(currentBlockId, connections);
      inputConnections.forEach(conn => {
        dependencies.add(conn.sourceBlockId);
        dfs(conn.sourceBlockId);
      });
    };

    dfs(blockId);
    return Array.from(dependencies);
  }

  /**
   * Get the execution order of blocks based on dependencies
   */
  getExecutionOrder(blocks: StrategyBlock[], connections: BlockConnection[]): StrategyBlock[] | null {
    if (this.hasCircularDependency(connections)) {
      return null; // Cannot determine order with cycles
    }

    const blockMap = new Map(blocks.map(block => [block.id, block]));
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize
    blocks.forEach(block => {
      inDegree.set(block.id, 0);
      adjList.set(block.id, []);
    });

    // Build graph and calculate in-degrees
    connections.forEach(conn => {
      const sourceId = conn.sourceBlockId;
      const targetId = conn.targetBlockId;
      
      adjList.get(sourceId)?.push(targetId);
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    });

    // Topological sort using Kahn's algorithm
    const queue: string[] = [];
    const result: StrategyBlock[] = [];

    // Find all blocks with no incoming edges (source blocks)
    inDegree.forEach((degree, blockId) => {
      if (degree === 0) {
        queue.push(blockId);
      }
    });

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentBlock = blockMap.get(currentId);
      
      if (currentBlock) {
        result.push(currentBlock);
      }

      // Process all dependent blocks
      const neighbors = adjList.get(currentId) || [];
      neighbors.forEach(neighborId => {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      });
    }

    return result.length === blocks.length ? result : null;
  }

  /**
   * Validate that a connection doesn't create a cycle
   */
  wouldCreateCycle(newConnection: Omit<BlockConnection, 'id'>, existingConnections: BlockConnection[]): boolean {
    const testConnections = [...existingConnections, { id: 'test', ...newConnection }];
    return this.hasCircularDependency(testConnections);
  }

  /**
   * Find the shortest path between two blocks
   */
  findShortestPath(fromBlockId: string, toBlockId: string, connections: BlockConnection[]): BlockConnection[] {
    const graph: { [key: string]: { connection: BlockConnection; target: string }[] } = {};
    
    // Build adjacency list with connection metadata
    connections.forEach(conn => {
      if (!graph[conn.sourceBlockId]) {
        graph[conn.sourceBlockId] = [];
      }
      graph[conn.sourceBlockId].push({
        connection: conn,
        target: conn.targetBlockId
      });
    });

    // BFS to find shortest path
    const queue = [{ blockId: fromBlockId, path: [] as BlockConnection[] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { blockId, path } = queue.shift()!;
      
      if (blockId === toBlockId) {
        return path;
      }
      
      if (visited.has(blockId)) {
        continue;
      }
      
      visited.add(blockId);
      
      const neighbors = graph[blockId] || [];
      neighbors.forEach(({ connection, target }) => {
        if (!visited.has(target)) {
          queue.push({
            blockId: target,
            path: [...path, connection]
          });
        }
      });
    }

    return []; // No path found
  }
}