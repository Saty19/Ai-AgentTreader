import type { StrategyDefinition, ValidationError, CompiledStrategy, BlockTemplate, StrategyTemplate } from '../types/blocks';

export interface SaveStrategyRequest {
  name: string;
  description: string;
  strategyDefinition: StrategyDefinition;
  isPublic: boolean;
}

export interface UpdateStrategyRequest {
  name?: string;
  description?: string;
  strategyDefinition?: StrategyDefinition;
  isPublic?: boolean;
}

export interface ValidateStrategyRequest {
  strategyDefinition: StrategyDefinition;
}

export interface CompileStrategyRequest {
  strategyDefinition: StrategyDefinition;
}

export interface BacktestRequest {
  strategyDefinition: StrategyDefinition;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital?: number;
  commission?: number;
}

export interface BacktestResults {
  totalReturn: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profit: number;
  loss: number;
  averageWin: number;
  averageLoss: number;
  trades: Array<{
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    timestamp: string;
    profit?: number;
  }>;
  equity: Array<{
    timestamp: string;
    value: number;
  }>;
}

export interface CreateCustomBlockRequest {
  blockType: string;
  name: string;
  description: string;
  inputSchema: object;
  outputSchema: object;
  implementationCode: string;
}

class StrategyBuilderApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // Strategy Management

  async getStrategies(userId?: string): Promise<{ strategies: StrategyDefinition[]; total: number }> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);

    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch strategies: ${response.statusText}`);
    }
    return response.json();
  }

  async getStrategy(strategyId: string): Promise<StrategyDefinition> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch strategy: ${response.statusText}`);
    }
    return response.json();
  }

  async createStrategy(request: SaveStrategyRequest): Promise<{ strategyId: string; success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create strategy: ${response.statusText}`);
    }
    return response.json();
  }

  async updateStrategy(strategyId: string, request: UpdateStrategyRequest): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to update strategy: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteStrategy(strategyId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete strategy: ${response.statusText}`);
    }
    return response.json();
  }

  async duplicateStrategy(strategyId: string): Promise<{ strategyId: string; success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}/duplicate`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to duplicate strategy: ${response.statusText}`);
    }
    return response.json();
  }

  // Block Management

  async getAvailableBlocks(): Promise<{ blocks: BlockTemplate[]; categories: string[] }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/blocks`);
    if (!response.ok) {
      throw new Error(`Failed to fetch blocks: ${response.statusText}`);
    }
    return response.json();
  }

  async createCustomBlock(request: CreateCustomBlockRequest): Promise<{ blockId: string; success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create custom block: ${response.statusText}`);
    }
    return response.json();
  }

  async updateCustomBlock(blockId: string, request: Partial<CreateCustomBlockRequest>): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/blocks/${blockId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to update custom block: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteCustomBlock(blockId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/blocks/${blockId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete custom block: ${response.statusText}`);
    }
    return response.json();
  }

  // Template Management

  async getStrategyTemplates(params?: {
    category?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ templates: StrategyTemplate[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`${this.baseUrl}/strategy-builder/templates?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }
    return response.json();
  }

  async getStrategyTemplate(templateId: string): Promise<StrategyTemplate> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/templates/${templateId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    return response.json();
  }

  // Validation & Compilation

  async validateStrategy(request: ValidateStrategyRequest): Promise<{
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
  }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to validate strategy: ${response.statusText}`);
    }
    return response.json();
  }

  async compileStrategy(request: CompileStrategyRequest): Promise<{
    success: boolean;
    compiledStrategy?: CompiledStrategy;
    error?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to compile strategy: ${response.statusText}`);
    }
    return response.json();
  }

  // Backtesting

  async runBacktest(request: BacktestRequest): Promise<{
    success: boolean;
    results?: BacktestResults;
    error?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/backtest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to run backtest: ${response.statusText}`);
    }
    return response.json();
  }

  async getBacktestHistory(strategyId: string): Promise<{
    tests: Array<{
      id: string;
      parameters: BacktestRequest;
      results: BacktestResults;
      createdAt: string;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}/backtests`);
    if (!response.ok) {
      throw new Error(`Failed to fetch backtest history: ${response.statusText}`);
    }
    return response.json();
  }

  // Strategy Deployment

  async deployStrategy(strategyId: string, config?: {
    enablePaperTrading?: boolean;
    maxPositionSize?: number;
    stopLossPercent?: number;
    takeProfitPercent?: number;
  }): Promise<{ success: boolean; deploymentId?: string; error?: string }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config || {}),
    });

    if (!response.ok) {
      throw new Error(`Failed to deploy strategy: ${response.statusText}`);
    }
    return response.json();
  }

  async stopStrategy(strategyId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}/stop`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to stop strategy: ${response.statusText}`);
    }
    return response.json();
  }

  async getStrategyStatus(strategyId: string): Promise<{
    status: 'STOPPED' | 'RUNNING' | 'PAUSED' | 'ERROR';
    deploymentId?: string;
    startedAt?: string;
    lastSignal?: string;
    performance?: {
      totalReturn: number;
      totalTrades: number;
      runningTime: string;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}/status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch strategy status: ${response.statusText}`);
    }
    return response.json();
  }

  // Market Data for Strategy Builder

  async getMarketData(symbol: string, timeframe: string, limit = 100): Promise<{
    data: Array<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
  }> {
    const params = new URLSearchParams({
      symbol,
      timeframe,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}/market/data?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.statusText}`);
    }
    return response.json();
  }

  // Strategy Sharing

  async shareStrategy(strategyId: string, isPublic: boolean): Promise<{ success: boolean; shareUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isPublic }),
    });

    if (!response.ok) {
      throw new Error(`Failed to share strategy: ${response.statusText}`);
    }
    return response.json();
  }

  async importStrategy(shareUrl: string): Promise<{ strategyId: string; success: boolean }> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shareUrl }),
    });

    if (!response.ok) {
      throw new Error(`Failed to import strategy: ${response.statusText}`);
    }
    return response.json();
  }

  // Export/Import

  async exportStrategy(strategyId: string, format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/${strategyId}/export?format=${format}`);
    if (!response.ok) {
      throw new Error(`Failed to export strategy: ${response.statusText}`);
    }
    return response.blob();
  }

  async importStrategyFile(file: File): Promise<{ strategyId: string; success: boolean }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/strategy-builder/strategies/import-file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to import strategy file: ${response.statusText}`);
    }
    return response.json();
  }
}

// Create and export a singleton instance
export const strategyBuilderApi = new StrategyBuilderApiClient();

// Export the class for testing or custom instances
export { StrategyBuilderApiClient };