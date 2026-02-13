import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  SaveStrategyRequest, 
  UpdateStrategyRequest, 
  ValidateStrategyRequest,
  CompileStrategyRequest,
  BacktestRequest,
  CreateCustomBlockRequest
} from './strategyBuilderApi';
import { strategyBuilderApi } from './strategyBuilderApi';
import type { StrategyDefinition } from '../types/blocks';

// Query Keys
export const strategyBuilderQueryKeys = {
  all: ['strategyBuilder'] as const,
  strategies: () => [...strategyBuilderQueryKeys.all, 'strategies'] as const,
  strategy: (id: string) => [...strategyBuilderQueryKeys.strategies(), id] as const,
  blocks: () => [...strategyBuilderQueryKeys.all, 'blocks'] as const,
  templates: () => [...strategyBuilderQueryKeys.all, 'templates'] as const,
  template: (id: string) => [...strategyBuilderQueryKeys.templates(), id] as const,
  backtests: (strategyId: string) => [...strategyBuilderQueryKeys.strategy(strategyId), 'backtests'] as const,
  status: (strategyId: string) => [...strategyBuilderQueryKeys.strategy(strategyId), 'status'] as const,
  marketData: (symbol: string, timeframe: string) => [...strategyBuilderQueryKeys.all, 'marketData', symbol, timeframe] as const,
};

// Strategy Queries

export const useStrategies = (userId?: string) => {
  return useQuery({
    queryKey: [...strategyBuilderQueryKeys.strategies(), userId],
    queryFn: () => strategyBuilderApi.getStrategies(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useStrategy = (strategyId: string, enabled = true) => {
  return useQuery({
    queryKey: strategyBuilderQueryKeys.strategy(strategyId),
    queryFn: () => strategyBuilderApi.getStrategy(strategyId),
    enabled: enabled && !!strategyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SaveStrategyRequest) => strategyBuilderApi.createStrategy(request),
    onSuccess: () => {
      // Invalidate strategies list to refetch with new strategy
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.strategies() });
    },
  });
};

export const useUpdateStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ strategyId, request }: { strategyId: string; request: UpdateStrategyRequest }) => 
      strategyBuilderApi.updateStrategy(strategyId, request),
    onSuccess: (_, { strategyId }) => {
      // Invalidate specific strategy and strategies list
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.strategy(strategyId) });
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.strategies() });
    },
  });
};

export const useDeleteStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => strategyBuilderApi.deleteStrategy(strategyId),
    onSuccess: (_, strategyId) => {
      // Remove from cache and invalidate strategies list
      queryClient.removeQueries({ queryKey: strategyBuilderQueryKeys.strategy(strategyId) });
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.strategies() });
    },
  });
};

export const useDuplicateStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => strategyBuilderApi.duplicateStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.strategies() });
    },
  });
};

// Block Queries

export const useAvailableBlocks = () => {
  return useQuery({
    queryKey: strategyBuilderQueryKeys.blocks(),
    queryFn: () => strategyBuilderApi.getAvailableBlocks(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateCustomBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateCustomBlockRequest) => strategyBuilderApi.createCustomBlock(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.blocks() });
    },
  });
};

export const useUpdateCustomBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blockId, request }: { blockId: string; request: Partial<CreateCustomBlockRequest> }) => 
      strategyBuilderApi.updateCustomBlock(blockId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.blocks() });
    },
  });
};

export const useDeleteCustomBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockId: string) => strategyBuilderApi.deleteCustomBlock(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.blocks() });
    },
  });
};

// Template Queries

export const useStrategyTemplates = (params?: {
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: [...strategyBuilderQueryKeys.templates(), params],
    queryFn: () => strategyBuilderApi.getStrategyTemplates(params),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useStrategyTemplate = (templateId: string, enabled = true) => {
  return useQuery({
    queryKey: strategyBuilderQueryKeys.template(templateId),
    queryFn: () => strategyBuilderApi.getStrategyTemplate(templateId),
    enabled: enabled && !!templateId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Validation & Compilation

export const useValidateStrategy = () => {
  return useMutation({
    mutationFn: (request: ValidateStrategyRequest) => strategyBuilderApi.validateStrategy(request),
  });
};

export const useCompileStrategy = () => {
  return useMutation({
    mutationFn: (request: CompileStrategyRequest) => strategyBuilderApi.compileStrategy(request),
  });
};

// Backtesting

export const useRunBacktest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BacktestRequest) => strategyBuilderApi.runBacktest(request),
    onSuccess: (_, request) => {
      // Invalidate backtest history if we have a strategy context
      if ('strategyId' in request) {
        queryClient.invalidateQueries({ 
          queryKey: strategyBuilderQueryKeys.backtests(request.strategyId as string)
        });
      }
    },
  });
};

export const useBacktestHistory = (strategyId: string, enabled = true) => {
  return useQuery({
    queryKey: strategyBuilderQueryKeys.backtests(strategyId),
    queryFn: () => strategyBuilderApi.getBacktestHistory(strategyId),
    enabled: enabled && !!strategyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Strategy Deployment

export const useDeployStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ strategyId, config }: { 
      strategyId: string; 
      config?: {
        enablePaperTrading?: boolean;
        maxPositionSize?: number;
        stopLossPercent?: number;
        takeProfitPercent?: number;
      }
    }) => strategyBuilderApi.deployStrategy(strategyId, config),
    onSuccess: (_, { strategyId }) => {
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.status(strategyId) });
    },
  });
};

export const useStopStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => strategyBuilderApi.stopStrategy(strategyId),
    onSuccess: (_, strategyId) => {
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.status(strategyId) });
    },
  });
};

export const useStrategyStatus = (strategyId: string, enabled = true) => {
  return useQuery({
    queryKey: strategyBuilderQueryKeys.status(strategyId),
    queryFn: () => strategyBuilderApi.getStrategyStatus(strategyId),
    enabled: enabled && !!strategyId,
    refetchInterval: 10000, // Refetch every 10 seconds for live status
    staleTime: 5000, // Consider stale after 5 seconds
  });
};

// Market Data

export const useMarketData = (symbol: string, timeframe: string, limit = 100, enabled = true) => {
  return useQuery({
    queryKey: strategyBuilderQueryKeys.marketData(symbol, timeframe),
    queryFn: () => strategyBuilderApi.getMarketData(symbol, timeframe, limit),
    enabled: enabled && !!symbol && !!timeframe,
    staleTime: 1000 * 30, // 30 seconds for market data
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};

// Strategy Sharing

export const useShareStrategy = () => {
  return useMutation({
    mutationFn: ({ strategyId, isPublic }: { strategyId: string; isPublic: boolean }) => 
      strategyBuilderApi.shareStrategy(strategyId, isPublic),
  });
};

export const useImportStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareUrl: string) => strategyBuilderApi.importStrategy(shareUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.strategies() });
    },
  });
};

// Export/Import

export const useExportStrategy = () => {
  return useMutation({
    mutationFn: ({ strategyId, format }: { strategyId: string; format?: 'json' | 'yaml' }) => 
      strategyBuilderApi.exportStrategy(strategyId, format),
  });
};

export const useImportStrategyFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => strategyBuilderApi.importStrategyFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.strategies() });
    },
  });
};

// Utility hooks for optimistic updates

export const useOptimisticStrategyUpdate = () => {
  const queryClient = useQueryClient();

  const updateStrategyOptimistic = (strategyId: string, updatedData: Partial<StrategyDefinition>) => {
    queryClient.setQueryData(
      strategyBuilderQueryKeys.strategy(strategyId),
      (old: StrategyDefinition | undefined) => {
        if (!old) return old;
        return { ...old, ...updatedData };
      }
    );
  };

  const revertStrategyUpdate = (strategyId: string) => {
    queryClient.invalidateQueries({ queryKey: strategyBuilderQueryKeys.strategy(strategyId) });
  };

  return { updateStrategyOptimistic, revertStrategyUpdate };
};

// Combined hook for strategy builder page
export const useStrategyBuilderData = (strategyId?: string) => {
  const strategiesQuery = useStrategies();
  const strategyQuery = useStrategy(strategyId!, !!strategyId);
  const blocksQuery = useAvailableBlocks();
  const templatesQuery = useStrategyTemplates();

  return {
    strategies: strategiesQuery,
    strategy: strategyQuery,
    blocks: blocksQuery,
    templates: templatesQuery,
    isLoading: strategiesQuery.isLoading || blocksQuery.isLoading || 
                (!!strategyId && strategyQuery.isLoading),
    error: strategiesQuery.error || blocksQuery.error || 
           (!!strategyId && strategyQuery.error),
  };
};