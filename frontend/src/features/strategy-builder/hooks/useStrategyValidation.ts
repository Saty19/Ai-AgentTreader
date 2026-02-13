import { useCallback } from 'react';
import type { StrategyDefinition, StrategyBlock, BlockConnection, ValidationError } from '../types/blocks';

export const useStrategyValidation = () => {
  const validateStrategyStructure = useCallback((strategy: StrategyDefinition): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Basic strategy validation
    if (!strategy.name.trim()) {
      errors.push({
        type: 'error',
        code: 'MISSING_PROPERTY',
        message: 'Strategy name is required'
      });
    }

    if (strategy.blocks.length === 0) {
      errors.push({
        type: 'warning',
        code: 'EMPTY_STRATEGY',
        message: 'Strategy has no blocks',
        suggestion: 'Add blocks to build your strategy logic'
      });
      return errors;
    }

    // Validate individual blocks
    strategy.blocks.forEach(block => {
      const blockErrors = validateBlock(block);
      errors.push(...blockErrors);
    });

    // Validate connections
    strategy.connections.forEach(connection => {
      const connectionErrors = validateConnection(connection, strategy.blocks);
      errors.push(...connectionErrors);
    });

    // Validate data flow
    const dataFlowErrors = validateDataFlow(strategy);
    errors.push(...dataFlowErrors);

    // Check for orphaned blocks
    const orphanedBlockErrors = findOrphanedBlocks(strategy);
    errors.push(...orphanedBlockErrors);

    // Check for circular dependencies
    if (hasCircularDependency(strategy.connections)) {
      errors.push({
        type: 'error',
        code: 'CIRCULAR_DEPENDENCY',
        message: 'Strategy contains circular dependencies',
        suggestion: 'Remove connections that create loops in your strategy'
      });
    }

    return errors;
  }, []);

  const validateBlock = useCallback((block: StrategyBlock): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate required properties
    block.properties.forEach(prop => {
      if (prop.required && (prop.value === undefined || prop.value === null || prop.value === '')) {
        errors.push({
          type: 'error',
          code: 'MISSING_PROPERTY',
          message: `Required property "${prop.name}" is not set`,
          blockId: block.id,
          suggestion: `Set a value for the "${prop.name}" property`
        });
      }

      // Validate property constraints
      if (prop.type === 'number' && typeof prop.value === 'number') {
        if (prop.min !== undefined && prop.value < prop.min) {
          errors.push({
            type: 'error',
            code: 'INVALID_PROPERTY',
            message: `Property "${prop.name}" value ${prop.value} is below minimum ${prop.min}`,
            blockId: block.id
          });
        }
        if (prop.max !== undefined && prop.value > prop.max) {
          errors.push({
            type: 'error',
            code: 'INVALID_PROPERTY',
            message: `Property "${prop.name}" value ${prop.value} is above maximum ${prop.max}`,
            blockId: block.id
          });
        }
      }
    });

    return errors;
  }, []);

  const validateConnection = useCallback((
    connection: BlockConnection, 
    blocks: StrategyBlock[]
  ): ValidationError[] => {
    const errors: ValidationError[] = [];

    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);

    if (!sourceBlock) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Source block not found`,
        connectionId: connection.id
      });
      return errors;
    }

    if (!targetBlock) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Target block not found`,
        connectionId: connection.id
      });
      return errors;
    }

    const sourceOutput = sourceBlock.outputs.find(o => o.id === connection.sourceOutput);
    const targetInput = targetBlock.inputs.find(i => i.id === connection.targetInput);

    if (!sourceOutput) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Source output not found`,
        connectionId: connection.id,
        blockId: connection.sourceBlockId
      });
    }

    if (!targetInput) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Target input not found`,
        connectionId: connection.id,
        blockId: connection.targetBlockId
      });
    }

    // Validate data type compatibility
    if (sourceOutput && targetInput) {
      if (!isCompatibleDataType(sourceOutput.dataType, targetInput.dataType)) {
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
  }, []);

  const validateDataFlow = useCallback((strategy: StrategyDefinition): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check for input blocks (entry points)
    const inputBlocks = strategy.blocks.filter(block => 
      block.category === 'input' || block.inputs.length === 0
    );

    if (inputBlocks.length === 0) {
      errors.push({
        type: 'warning',
        code: 'NO_INPUT_BLOCKS',
        message: 'Strategy has no input blocks',
        suggestion: 'Add market data or parameter input blocks to feed data into your strategy'
      });
    }

    // Check for output blocks (exit points)
    const outputBlocks = strategy.blocks.filter(block => 
      block.category === 'outputs' || block.category === 'actions'
    );

    if (outputBlocks.length === 0) {
      errors.push({
        type: 'error',
        code: 'NO_OUTPUT_BLOCKS',
        message: 'Strategy has no output or action blocks',
        suggestion: 'Add action blocks (buy/sell orders) or output blocks to make your strategy functional'
      });
    }

    // Check for required input connections
    strategy.blocks.forEach(block => {
      const requiredInputs = block.inputs.filter(input => input.required);
      const connectedInputs = strategy.connections
        .filter(conn => conn.targetBlockId === block.id)
        .map(conn => conn.targetInput);

      requiredInputs.forEach(input => {
        if (!connectedInputs.includes(input.id)) {
          errors.push({
            type: 'error',
            code: 'MISSING_CONNECTION',
            message: `Required input "${input.name}" is not connected`,
            blockId: block.id,
            suggestion: `Connect a block output to the "${input.name}" input`
          });
        }
      });
    });

    return errors;
  }, []);

  const findOrphanedBlocks = useCallback((strategy: StrategyDefinition): ValidationError[] => {
    const errors: ValidationError[] = [];

    const connectedBlocks = new Set<string>();
    
    // Mark all blocks that are connected
    strategy.connections.forEach(conn => {
      connectedBlocks.add(conn.sourceBlockId);
      connectedBlocks.add(conn.targetBlockId);
    });

    // Find blocks that are not connected to anything
    const orphanedBlocks = strategy.blocks.filter(block => 
      !connectedBlocks.has(block.id) && 
      block.inputs.length > 0 && 
      block.outputs.length > 0
    );

    orphanedBlocks.forEach(block => {
      errors.push({
        type: 'warning',
        code: 'ORPHANED_BLOCK',
        message: `Block "${block.name}" is not connected to any other blocks`,
        blockId: block.id,
        suggestion: 'Connect this block to integrate it into your strategy flow'
      });
    });

    return errors;
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
      if (recursionStack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
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

    // Check all nodes
    for (const node in graph) {
      if (hasCycle(node)) {
        return true;
      }
    }

    return false;
  }, []);

  const isCompatibleDataType = useCallback((sourceType: string, targetType: string): boolean => {
    // Any type can connect to any
    if (sourceType === 'any' || targetType === 'any') {
      return true;
    }

    // Same types are compatible
    if (sourceType === targetType) {
      return true;
    }

    // Define compatibility rules
    const compatibilityRules: { [source: string]: string[] } = {
      'number': ['string', 'boolean'],
      'boolean': ['string'],
      'candle': ['number'],
      'indicator': ['number'],
      'signal': ['boolean'],
      'array': ['number', 'string', 'boolean']
    };

    const compatibleTypes = compatibilityRules[sourceType] || [];
    return compatibleTypes.includes(targetType);
  }, []);

  return {
    validateStrategyStructure,
    validateBlock,
    validateConnection,
    validateDataFlow,
    findOrphanedBlocks,
    hasCircularDependency,
    isCompatibleDataType
  };
};