import type { StrategyDefinition, CompiledStrategy } from '../types/strategy';

export class StrategyCompilationService {

  static async compileStrategy(strategyDefinition: StrategyDefinition): Promise<CompiledStrategy> {
    try {
      // Generate execution order based on dependencies
      const executionOrder = this.generateExecutionOrder(strategyDefinition);

      // Generate JavaScript code
      const code = this.generateCode(strategyDefinition, executionOrder);

      // Create compiled strategy object
      const compiledStrategy: CompiledStrategy = {
        id: this.generateCompiledId(),
        version: strategyDefinition.version || 1,
        executionOrder,
        code,
        metadata: {
          blockCount: strategyDefinition.blocks?.length || 0,
          connectionCount: strategyDefinition.connections?.length || 0,
          compiledAt: new Date().toISOString(),
          ...strategyDefinition.metadata
        }
      };

      return compiledStrategy;
    } catch (error) {
      throw new Error(`Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static generateExecutionOrder(strategyDefinition: StrategyDefinition): string[] {
    const blocks = strategyDefinition.blocks || [];
    const connections = strategyDefinition.connections || [];

    // Build dependency graph
    const dependencies = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const block of blocks) {
      dependencies.set(block.id, new Set());
      inDegree.set(block.id, 0);
    }

    // Build graph
    for (const connection of connections) {
      const deps = dependencies.get(connection.to) || new Set();
      deps.add(connection.from);
      dependencies.set(connection.to, deps);
      inDegree.set(connection.to, (inDegree.get(connection.to) || 0) + 1);
    }

    // Topological sort (Kahn's algorithm)
    const queue: string[] = [];
    const executionOrder: string[] = [];

    // Find all nodes with no dependencies
    for (const [blockId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(blockId);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      executionOrder.push(current);

      // Find blocks that depend on current
      for (const [blockId, deps] of dependencies.entries()) {
        if (deps.has(current)) {
          deps.delete(current);
          if (deps.size === 0) {
            queue.push(blockId);
          }
        }
      }
    }

    if (executionOrder.length !== blocks.length) {
      throw new Error('Circular dependency detected in strategy');
    }

    return executionOrder;
  }

  private static generateCode(strategyDefinition: StrategyDefinition, executionOrder: string[]): string {
    const blocks = strategyDefinition.blocks || [];
    const connections = strategyDefinition.connections || [];

    // Create block lookup
    const blockMap = new Map(blocks.map(b => [b.id, b]));

    // Generate code sections
    const codeLines: string[] = [];

    // Header
    codeLines.push('// Auto-generated strategy code');
    codeLines.push('// Generated at: ' + new Date().toISOString());
    codeLines.push('');
    codeLines.push('async function executeStrategy(context) {');
    codeLines.push('  const { marketData, portfolio, broker, indicators } = context;');
    codeLines.push('  const values = {};');
    codeLines.push('');

    // Generate code for each block in execution order
    for (const blockId of executionOrder) {
      const block = blockMap.get(blockId);
      if (!block) continue;

      codeLines.push(`  // Block: ${block.type} (${blockId})`);
      const blockCode = this.generateBlockCode(block, connections, blockMap);
      codeLines.push(...blockCode.split('\n').map(line => '  ' + line));
      codeLines.push('');
    }

    // Footer
    codeLines.push('  return values;');
    codeLines.push('}');
    codeLines.push('');
    codeLines.push('module.exports = { executeStrategy };');

    return codeLines.join('\n');
  }

  private static generateBlockCode(
    block: any,
    connections: any[],
    blockMap: Map<string, any>
  ): string {
    const props = block.properties || {};

    switch (block.type) {
      case 'market_data':
        return `values['${block.id}'] = {
  open: marketData.open,
  high: marketData.high,
  low: marketData.low,
  close: marketData.close,
  volume: marketData.volume,
  timestamp: marketData.timestamp
};`;

      case 'portfolio_info':
        return `values['${block.id}'] = {
  balance: portfolio.balance,
  equity: portfolio.equity,
  positions: portfolio.positions
};`;

      case 'sma':
      case 'ema':
        const inputConn = connections.find(c => c.to === block.id);
        const inputValue = inputConn ? `values['${inputConn.from}'].${inputConn.fromPort}` : 'marketData.close';
        return `values['${block.id}'] = {
  output: await indicators.${block.type}(${inputValue}, ${props.period || 14})
};`;

      case 'rsi':
        const rsiInputConn = connections.find(c => c.to === block.id);
        const rsiInputValue = rsiInputConn ? `values['${rsiInputConn.from}'].${rsiInputConn.fromPort}` : 'marketData.close';
        return `values['${block.id}'] = {
  output: await indicators.rsi(${rsiInputValue}, ${props.period || 14})
};`;

      case 'macd':
        const macdInputConn = connections.find(c => c.to === block.id);
        const macdInputValue = macdInputConn ? `values['${macdInputConn.from}'].${macdInputConn.fromPort}` : 'marketData.close';
        return `values['${block.id}'] = {
  macd: await indicators.macd(${macdInputValue}, ${props.fastPeriod || 12}, ${props.slowPeriod || 26}, ${props.signalPeriod || 9})
};`;

      case 'bollinger_bands':
        const bbInputConn = connections.find(c => c.to === block.id);
        const bbInputValue = bbInputConn ? `values['${bbInputConn.from}'].${bbInputConn.fromPort}` : 'marketData.close';
        return `const bb_${block.id} = await indicators.bollingerBands(${bbInputValue}, ${props.period || 20}, ${props.deviation || 2});
values['${block.id}'] = {
  upper: bb_${block.id}.upper,
  middle: bb_${block.id}.middle,
  lower: bb_${block.id}.lower
};`;

      case 'greater_than':
      case 'less_than':
      case 'equals':
        const aConn = connections.find(c => c.to === block.id && c.toPort === 'a');
        const bConn = connections.find(c => c.to === block.id && c.toPort === 'b');
        const aValue = aConn ? `values['${aConn.from}'].${aConn.fromPort}` : (props.value || '0');
        const bValue = bConn ? `values ['${bConn.from}'].${bConn.fromPort}` : (props.value || '0');
        
        const operator = block.type === 'greater_than' ? '>' : 
                        block.type === 'less_than' ? '<' : '===';
        
        return `const result_${block.id} = ${aValue} ${operator} ${bValue};
values['${block.id}'] = {
  true: result_${block.id},
  false: !result_${block.id},
  result: result_${block.id}
};`;

      case 'and_gate':
      case 'or_gate':
        const inputs = connections.filter(c => c.to === block.id);
        const inputChecks = inputs.map(c => `values['${c.from}'].${c.fromPort}`).join(block.type === 'and_gate' ? ' && ' : ' || ');
        return `const result_${block.id} = ${inputChecks || 'false'};
values['${block.id}'] = {
  output: result_${block.id}
};`;

      case 'buy_order':
      case 'sell_order':
        const triggerConn = connections.find(c => c.to === block.id);
        const triggerValue = triggerConn ? `values['${triggerConn.from}'].${triggerConn.fromPort}` : 'false';
        
        return `if (${triggerValue}) {
  await broker.${block.type === 'buy_order' ? 'buy' : 'sell'}({
    symbol: '${props.symbol || 'BTCUSD'}',
    quantity: ${props.quantity || '0'},
    orderType: '${props.orderType || 'MARKET'}',
    price: ${props.price || 'null'}
  });
}
values['${block.id}'] = { executed: ${triggerValue} };`;

      case 'signal_output':
        const signalConn = connections.find(c => c.to === block.id);
        const signalValue = signalConn ? `values['${signalConn.from}'].${signalConn.fromPort}` : 'null';
        
        return `if (${signalValue}) {
  await context.emitSignal({
    type: '${props.signalType || 'CUSTOM'}',
    value: ${signalValue},
    timestamp: new Date().toISOString()
  });
}
values['${block.id}'] = { emitted: !!${signalValue} };`;

      default:
        return `// Unknown block type: ${block.type}
values['${block.id}'] = {};`;
    }
  }

  private static generateCompiledId(): string {
    return `compiled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async decompileStrategy(compiledStrategy: CompiledStrategy): Promise<StrategyDefinition> {
    // This is a simplified decompilation - in a real system, you'd need more sophisticated parsing
    throw new Error('Decompilation not yet implemented');
  }

  static async optimizeStrategy(strategyDefinition: StrategyDefinition): Promise<StrategyDefinition> {
    // Remove orphaned blocks
    const connectedBlocks = new Set<string>();
    for (const conn of strategyDefinition.connections || []) {
      connectedBlocks.add(conn.from);
      connectedBlocks.add(conn.to);
    }

    const optimizedBlocks = (strategyDefinition.blocks || []).filter(
      block => connectedBlocks.has(block.id)
    );

    return {
      ...strategyDefinition,
      blocks: optimizedBlocks
    };
  }
}
