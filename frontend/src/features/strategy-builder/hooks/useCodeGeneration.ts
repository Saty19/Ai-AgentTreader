import { useCallback } from 'react';
import type { StrategyDefinition, StrategyBlock, BlockConnection } from '../types/blocks';

export interface CodeGenerationResult {
  success: boolean;
  code?: string;
  sourceMap?: any;
  error?: string;
  warnings?: string[];
}

export const useCodeGeneration = () => {
  const generateStrategyCode = useCallback(async (strategy: StrategyDefinition): Promise<CodeGenerationResult> => {
    try {
      // Build execution order based on dependencies
      const executionOrder = buildExecutionOrder(strategy.blocks, strategy.connections);
      
      if (!executionOrder) {
        return {
          success: false,
          error: 'Unable to determine execution order due to circular dependencies'
        };
      }

      // Generate TypeScript code
      const code = generateTypeScriptCode(strategy, executionOrder);
      
      // Create source map for debugging
      const sourceMap = createSourceMap(strategy, executionOrder);

      return {
        success: true,
        code,
        sourceMap,
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compilation error'
      };
    }
  }, []);

  const buildExecutionOrder = useCallback((
    blocks: StrategyBlock[], 
    connections: BlockConnection[]
  ): StrategyBlock[] | null => {
    const blockMap = new Map(blocks.map(block => [block.id, block]));
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize
    blocks.forEach(block => {
      inDegree.set(block.id, 0);
      adjList.set(block.id, []);
    });

    // Build adjacency list and calculate in-degrees
    connections.forEach(conn => {
      const sourceId = conn.sourceBlockId;
      const targetId = conn.targetBlockId;
      
      adjList.get(sourceId)?.push(targetId);
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    });

    // Topological sort
    const queue: string[] = [];
    const result: StrategyBlock[] = [];

    // Find all blocks with no dependencies (input blocks)
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

      // Process neighbors
      const neighbors = adjList.get(currentId) || [];
      neighbors.forEach(neighborId => {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      });
    }

    // Check for cycles
    if (result.length !== blocks.length) {
      return null; // Circular dependency detected
    }

    return result;
  }, []);

  const generateTypeScriptCode = useCallback((
    strategy: StrategyDefinition, 
    executionOrder: StrategyBlock[]
  ): string => {
    let code = `
// Generated Strategy: ${strategy.name}
// Description: ${strategy.description}
// Generated at: ${new Date().toISOString()}

import { IStrategy } from '../interfaces/IStrategy';
import { MarketData, Signal, Order } from '../types';

export class ${toPascalCase(strategy.name)}Strategy implements IStrategy {
  public readonly id = '${strategy.id}';
  public readonly name = '${strategy.name}';
  public readonly description = '${strategy.description}';
  
  // Block variables
${generateBlockVariables(executionOrder)}

  constructor() {
    this.initialize();
  }

  private initialize(): void {
${generateInitializationCode(executionOrder)}
  }

  public async execute(marketData: MarketData): Promise<Signal[]> {
    const signals: Signal[] = [];
    
    try {
${generateExecutionCode(strategy, executionOrder)}
    } catch (error) {
      console.error('Strategy execution error:', error);
    }
    
    return signals;
  }

  public getParameters(): any {
    return {
${generateParametersCode(executionOrder)}
    };
  }

  public setParameters(params: any): void {
${generateParameterSetterCode(executionOrder)}
  }

  public reset(): void {
${generateResetCode(executionOrder)}
  }
}
`;

    return code;
  }, []);

  const generateBlockVariables = (blocks: StrategyBlock[]): string => {
    return blocks.map(block => {
      const varName = getBlockVariableName(block);
      switch (block.category) {
        case 'indicators':
          return `  private ${varName}: any = null;`;
        case 'input':
          return `  private ${varName}: any = null;`;
        case 'logic':
          return `  private ${varName}: boolean = false;`;
        case 'actions':
          return `  private ${varName}: Order[] = [];`;
        default:
          return `  private ${varName}: any = null;`;
      }
    }).join('\n');
  };

  const generateInitializationCode = (blocks: StrategyBlock[]): string => {
    return blocks.map(block => {
      const lines: string[] = [];
      const varName = getBlockVariableName(block);
      
      // Initialize based on block type
      switch (block.type) {
        case 'ema':
          const emaPeriod = getBlockProperty(block, 'period', 14);
          lines.push(`    this.${varName} = new EMA(${emaPeriod});`);
          break;
        case 'sma':
          const smaPeriod = getBlockProperty(block, 'period', 14);
          lines.push(`    this.${varName} = new SMA(${smaPeriod});`);
          break;
        case 'rsi':
          const rsiPeriod = getBlockProperty(block, 'period', 14);
          lines.push(`    this.${varName} = new RSI(${rsiPeriod});`);
          break;
        case 'parameter':
          const defaultValue = getBlockProperty(block, 'defaultValue', 0);
          lines.push(`    this.${varName} = ${JSON.stringify(defaultValue)};`);
          break;
        default:
          lines.push(`    // Initialize ${block.name}`);
      }
      
      return lines.join('\n');
    }).join('\n');
  };

  const generateExecutionCode = (strategy: StrategyDefinition, blocks: StrategyBlock[]): string => {
    const lines: string[] = [];
    const connectionMap = buildConnectionMap(strategy.connections);
    
    blocks.forEach(block => {
      const varName = getBlockVariableName(block);
      const blockLines: string[] = [];
      
      // Get input connections
      const inputConnections = connectionMap.inputs[block.id] || {};
      
      switch (block.type) {
        case 'market_data':
          blockLines.push(`      this.${varName} = marketData;`);
          break;
          
        case 'ema':
        case 'sma':
        case 'rsi':
          const inputVar = getConnectionInputVariable(inputConnections, 'price', 'marketData.close');
          blockLines.push(`      this.${varName}.update(${inputVar});`);
          break;
          
        case 'comparison':
          const operator = getBlockProperty(block, 'operator', '>');
          const leftInput = getConnectionInputVariable(inputConnections, 'left', '0');
          const rightInput = getConnectionInputVariable(inputConnections, 'right', '0');
          blockLines.push(`      this.${varName} = ${leftInput} ${operator} ${rightInput};`);
          break;
          
        case 'logical_and':
          const input1 = getConnectionInputVariable(inputConnections, 'input1', 'false');
          const input2 = getConnectionInputVariable(inputConnections, 'input2', 'false');
          blockLines.push(`      this.${varName} = ${input1} && ${input2};`);
          break;
          
        case 'buy_order':
          const buyCondition = getConnectionInputVariable(inputConnections, 'condition', 'false');
          const quantity = getBlockProperty(block, 'quantity', 1);
          blockLines.push(`      if (${buyCondition}) {`);
          blockLines.push(`        this.${varName}.push({`);
          blockLines.push(`          type: 'BUY',`);
          blockLines.push(`          quantity: ${quantity},`);
          blockLines.push(`          price: marketData.close,`);
          blockLines.push(`          timestamp: Date.now()`);
          blockLines.push(`        });`);
          blockLines.push(`        signals.push({`);
          blockLines.push(`          type: 'BUY',`);
          blockLines.push(`          confidence: 1.0,`);
          blockLines.push(`          price: marketData.close,`);
          blockLines.push(`          quantity: ${quantity}`);
          blockLines.push(`        });`);
          blockLines.push(`      }`);
          break;
          
        case 'sell_order':
          const sellCondition = getConnectionInputVariable(inputConnections, 'condition', 'false');
          const sellQuantity = getBlockProperty(block, 'quantity', 1);
          blockLines.push(`      if (${sellCondition}) {`);
          blockLines.push(`        this.${varName}.push({`);
          blockLines.push(`          type: 'SELL',`);
          blockLines.push(`          quantity: ${sellQuantity},`);
          blockLines.push(`          price: marketData.close,`);
          blockLines.push(`          timestamp: Date.now()`);
          blockLines.push(`        });`);
          blockLines.push(`        signals.push({`);
          blockLines.push(`          type: 'SELL',`);
          blockLines.push(`          confidence: 1.0,`);
          blockLines.push(`          price: marketData.close,`);
          blockLines.push(`          quantity: ${sellQuantity}`);
          blockLines.push(`        });`);
          blockLines.push(`      }`);
          break;
      }
      
      if (blockLines.length > 0) {
        lines.push(`      // Block: ${block.name} (${block.type})`);
        lines.push(...blockLines);
        lines.push('');
      }
    });
    
    return lines.join('\n');
  };

  const generateParametersCode = (blocks: StrategyBlock[]): string => {
    const parameters: string[] = [];
    
    blocks.forEach(block => {
      block.properties.forEach(prop => {
        parameters.push(`      ${block.name}_${prop.name}: ${JSON.stringify(prop.value)}`);
      });
    });
    
    return parameters.join(',\n');
  };

  const generateParameterSetterCode = (blocks: StrategyBlock[]): string => {
    const lines: string[] = [];
    
    blocks.forEach(block => {
      block.properties.forEach(prop => {
        const paramName = `${block.name}_${prop.name}`;
        lines.push(`    if (params.${paramName} !== undefined) {`);
        lines.push(`      // Update ${block.name} ${prop.name}`);
        lines.push(`    }`);
      });
    });
    
    return lines.join('\n');
  };

  const generateResetCode = (blocks: StrategyBlock[]): string => {
    return blocks.map(block => {
      const varName = getBlockVariableName(block);
      switch (block.category) {
        case 'indicators':
          return `    this.${varName}?.reset();`;
        case 'actions':
          return `    this.${varName} = [];`;
        default:
          return `    // Reset ${block.name}`;
      }
    }).join('\n');
  };

  const createSourceMap = (strategy: StrategyDefinition, executionOrder: StrategyBlock[]) => {
    const sourceMap: any = {
      version: 3,
      sources: [`strategy-${strategy.id}.ts`],
      names: [],
      mappings: '',
      blocks: {},
      connections: {}
    };
    
    let line = 1;
    
    executionOrder.forEach((block, index) => {
      sourceMap.blocks[block.id] = {
        line: line + index * 3,
        column: 0,
        name: block.name
      };
    });
    
    strategy.connections.forEach((connection, index) => {
      sourceMap.connections[connection.id] = {
        line: line + strategy.blocks.length * 3 + index,
        column: 0
      };
    });
    
    return sourceMap;
  };

  // Helper functions
  const toPascalCase = (str: string): string => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toUpperCase() : word.toLowerCase();
    }).replace(/\s+/g, '');
  };

  const getBlockVariableName = (block: StrategyBlock): string => {
    return `${block.name.replace(/\s+/g, '_').toLowerCase()}_${block.id.substring(0, 8)}`;
  };

  const getBlockProperty = (block: StrategyBlock, propertyName: string, defaultValue: any): any => {
    const property = block.properties.find(p => p.name === propertyName);
    return property ? property.value : defaultValue;
  };

  const buildConnectionMap = (connections: BlockConnection[]) => {
    const inputs: { [blockId: string]: { [inputId: string]: string } } = {};
    const outputs: { [blockId: string]: { [outputId: string]: string[] } } = {};
    
    connections.forEach(conn => {
      // Map inputs
      if (!inputs[conn.targetBlockId]) {
        inputs[conn.targetBlockId] = {};
      }
      inputs[conn.targetBlockId][conn.targetInput] = `this.${getBlockVariableNameFromId(conn.sourceBlockId)}`;
      
      // Map outputs
      if (!outputs[conn.sourceBlockId]) {
        outputs[conn.sourceBlockId] = {};
      }
      if (!outputs[conn.sourceBlockId][conn.sourceOutput]) {
        outputs[conn.sourceBlockId][conn.sourceOutput] = [];
      }
      outputs[conn.sourceBlockId][conn.sourceOutput].push(conn.targetBlockId);
    });
    
    return { inputs, outputs };
  };

  const getConnectionInputVariable = (
    inputConnections: { [inputId: string]: string }, 
    inputName: string, 
    defaultValue: string
  ): string => {
    return inputConnections[inputName] || defaultValue;
  };

  const getBlockVariableNameFromId = (blockId: string): string => {
    return `block_${blockId.substring(0, 8)}`;
  };

  return {
    generateStrategyCode,
    buildExecutionOrder
  };
};