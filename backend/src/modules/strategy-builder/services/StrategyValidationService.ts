import type { StrategyDefinition, ValidationError, Block, Connection } from '../types/strategy';

export class StrategyValidationService {

  static async validateStrategy(strategyDefinition: StrategyDefinition): Promise<{
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Basic structure validation
      if (!strategyDefinition) {
        errors.push({
          type: 'STRUCTURE',
          message: 'Strategy definition is required',
          severity: 'error',
          blockId: undefined
        });
        return { isValid: false, errors, warnings };
      }

      // Validate blocks exist
      if (!strategyDefinition.blocks || strategyDefinition.blocks.length === 0) {
        errors.push({
          type: 'STRUCTURE',
          message: 'Strategy must contain at least one block',
          severity: 'error',
          blockId: undefined
        });
      }

      // Validate connections exist
      if (!strategyDefinition.connections || strategyDefinition.connections.length === 0) {
        warnings.push({
          type: 'STRUCTURE',
          message: 'Strategy has no connections between blocks',
          severity: 'warning',
          blockId: undefined
        });
      }

      // Validate each block
      const blockIds = new Set<string>();
      for (const block of strategyDefinition.blocks || []) {
        // Check for duplicate IDs
        if (blockIds.has(block.id)) {
          errors.push({
            type: 'DUPLICATE_ID',
            message: `Duplicate block ID: ${block.id}`,
            severity: 'error',
            blockId: block.id
          });
        }
        blockIds.add(block.id);

        // Validate block has required fields
        if (!block.type) {
          errors.push({
            type: 'MISSING_FIELD',
            message: 'Block is missing type',
            severity: 'error',
            blockId: block.id
          });
        }

        if (!block.position) {
          errors.push({
            type: 'MISSING_FIELD',
            message: 'Block is missing position',
            severity: 'error',
            blockId: block.id
          });
        }

        // Validate block-specific requirements
        const blockValidation = await this.validateBlock(block);
        errors.push(...blockValidation.errors);
        warnings.push(...blockValidation.warnings);
      }

      // Validate connections
      for (const connection of strategyDefinition.connections || []) {
        const connectionValidation = this.validateConnection(connection, blockIds);
        errors.push(...connectionValidation.errors);
        warnings.push(...connectionValidation.warnings);
      }

      // Check for orphaned blocks (blocks with no connections)
      const connectedBlocks = new Set<string>();
      for (const connection of strategyDefinition.connections || []) {
        connectedBlocks.add(connection.from);
        connectedBlocks.add(connection.to);
      }

      for (const block of strategyDefinition.blocks || []) {
        if (!connectedBlocks.has(block.id)) {
          warnings.push({
            type: 'ORPHANED_BLOCK',
            message: `Block "${block.type}" is not connected to any other blocks`,
            severity: 'warning',
            blockId: block.id
          });
        }
      }

      // Check for input blocks
      const hasInputBlock = (strategyDefinition.blocks || []).some(
        b => b.type === 'market_data' || b.type === 'portfolio_info'
      );
      if (!hasInputBlock) {
        errors.push({
          type: 'MISSING_INPUT',
          message: 'Strategy must have at least one input block (market data or portfolio info)',
          severity: 'error',
          blockId: undefined
        });
      }

      // Check for output/action blocks
      const hasOutputBlock = (strategyDefinition.blocks || []).some(
        b => b.type === 'buy_order' || b.type === 'sell_order' || b.type === 'signal_output'
      );
      if (!hasOutputBlock) {
        warnings.push({
          type: 'MISSING_OUTPUT',
          message: 'Strategy has no output or action blocks',
          severity: 'warning',
          blockId: undefined
        });
      }

      // Check for circular dependencies
      const circularCheck = this.checkCircularDependencies(strategyDefinition);
      if (circularCheck.hasCircular) {
        errors.push({
          type: 'CIRCULAR_DEPENDENCY',
          message: 'Strategy contains circular dependencies',
          severity: 'error',
          blockId: circularCheck.cycleBlocks?.[0]
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'VALIDATION_ERROR',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          blockId: undefined
        }],
        warnings
      };
    }
  }

  private static async validateBlock(block: Block): Promise<{
    errors: ValidationError[];
    warnings: ValidationError[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate properties based on block type
    switch (block.type) {
      case 'sma':
      case 'ema':
        if (!block.properties?.period || block.properties.period < 1) {
          errors.push({
            type: 'INVALID_PROPERTY',
            message: `${block.type.toUpperCase()} period must be at least 1`,
            severity: 'error',
            blockId: block.id
          });
        }
        break;

      case 'rsi':
        if (!block.properties?.period || block.properties.period < 2) {
          errors.push({
            type: 'INVALID_PROPERTY',
            message: 'RSI period must be at least 2',
            severity: 'error',
            blockId: block.id
          });
        }
        break;

      case 'bollinger_bands':
        if (!block.properties?.period || block.properties.period < 2) {
          errors.push({
            type: 'INVALID_PROPERTY',
            message: 'Bollinger Bands period must be at least 2',
            severity: 'error',
            blockId: block.id
          });
        }
        if (!block.properties?.deviation || block.properties.deviation <= 0) {
          errors.push({
            type: 'INVALID_PROPERTY',
            message: 'Bollinger Bands deviation must be positive',
            severity: 'error',
            blockId: block.id
          });
        }
        break;

      case 'buy_order':
      case 'sell_order':
        if (block.properties?.quantity && block.properties.quantity <= 0) {
          errors.push({
            type: 'INVALID_PROPERTY',
            message: 'Order quantity must be positive',
            severity: 'error',
            blockId: block.id
          });
        }
        if (block.properties?.price && block.properties.price <= 0) {
          errors.push({
            type: 'INVALID_PROPERTY',
            message: 'Order price must be positive',
            severity: 'error',
            blockId: block.id
          });
        }
        break;

      case 'comparison':
        if (!block.properties?.operator) {
          errors.push({
            type: 'MISSING_PROPERTY',
            message: 'Comparison operator is required',
            severity: 'error',
            blockId: block.id
          });
        }
        break;
    }

    return { errors, warnings };
  }

  private static validateConnection(
    connection: Connection,
    validBlockIds: Set<string>
  ): {
    errors: ValidationError[];
    warnings: ValidationError[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate connection structure
    if (!connection.from || !connection.to) {
      errors.push({
        type: 'INVALID_CONNECTION',
        message: 'Connection must have both from and to blocks',
        severity: 'error',
        blockId: undefined
      });
      return { errors, warnings };
    }

    // Validate block IDs exist
    if (!validBlockIds.has(connection.from)) {
      errors.push({
        type: 'INVALID_CONNECTION',
        message: `Connection references non-existent block: ${connection.from}`,
        severity: 'error',
        blockId: connection.from
      });
    }

    if (!validBlockIds.has(connection.to)) {
      errors.push({
        type: 'INVALID_CONNECTION',
        message: `Connection references non-existent block: ${connection.to}`,
        severity: 'error',
        blockId: connection.to
      });
    }

    // Validate port names exist
    if (!connection.fromPort) {
      errors.push({
        type: 'MISSING_PORT',
        message: 'Connection is missing fromPort',
        severity: 'error',
        blockId: connection.from
      });
    }

    if (!connection.toPort) {
      errors.push({
        type: 'MISSING_PORT',
        message: 'Connection is missing toPort',
        severity: 'error',
        blockId: connection.to
      });
    }

    return { errors, warnings };
  }

  private static checkCircularDependencies(strategyDefinition: StrategyDefinition): {
    hasCircular: boolean;
    cycleBlocks?: string[];
  } {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    for (const block of strategyDefinition.blocks || []) {
      graph.set(block.id, []);
    }

    for (const connection of strategyDefinition.connections || []) {
      const neighbors = graph.get(connection.from) || [];
      neighbors.push(connection.to);
      graph.set(connection.from, neighbors);
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      path.pop();
      return false;
    };

    for (const blockId of graph.keys()) {
      if (!visited.has(blockId)) {
        if (hasCycle(blockId)) {
          return { hasCircular: true, cycleBlocks: [...path] };
        }
      }
    }

    return { hasCircular: false };
  }

  static async validateStrategyDefinitionJSON(jsonString: string): Promise<{
    isValid: boolean;
    error?: string;
    strategyDefinition?: StrategyDefinition;
  }> {
    try {
      const strategyDefinition = JSON.parse(jsonString);
      
      // Validate basic structure
      if (typeof strategyDefinition !== 'object') {
        return { isValid: false, error: 'Strategy definition must be an object' };
      }

      return { isValid: true, strategyDefinition };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}
