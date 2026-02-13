import { StrategyBuilderRepository } from '../repositories/StrategyBuilderRepository';
import { StrategyValidationService } from './StrategyValidationService';
import { StrategyCompilationService } from './StrategyCompilationService';
import { v4 as uuidv4 } from 'uuid';

export class StrategyDeploymentService {
  private static repository = new StrategyBuilderRepository();
  private static activeDeployments = new Map<string, any>();

  static async deployStrategy(
    strategyId: string,
    userId: string,
    config?: {
      enablePaperTrading?: boolean;
      maxPositionSize?: number;
      stopLossPercent?: number;
      takeProfitPercent?: number;
    }
  ): Promise<{
    success: boolean;
    deploymentId?: string;
    error?: string;
  }> {
    try {
      // Get strategy
      const strategy = await this.repository.findStrategyById(strategyId);
      
      if (!strategy || strategy.userId !== userId) {
        return { success: false, error: 'Strategy not found or access denied' };
      }

      // Parse and validate strategy definition
      const strategyDefinition = JSON.parse(strategy.strategyDefinition);
      const validation = await StrategyValidationService.validateStrategy(strategyDefinition);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Strategy validation failed: ' + validation.errors.map(e => e.message).join(', ')
        };
      }

      // Compile strategy
      const compiledStrategy = await StrategyCompilationService.compileStrategy(strategyDefinition);

      // Check if already deployed
      const existingDeployment = await this.repository.findActiveDeployment(strategyId);
      if (existingDeployment) {
        return {
          success: false,
          error: 'Strategy is already deployed. Stop it first before redeploying.'
        };
      }

      // Create deployment record
      const deploymentId = uuidv4();
      const deployment = {
        id: deploymentId,
        strategyId,
        userId,
        deploymentName: strategy.name,
        status: 'RUNNING' as const,
        config: JSON.stringify(config || {}),
        paperTrading: config?.enablePaperTrading ?? true,
        maxPositionSize: config?.maxPositionSize,
        stopLossPercent: config?.stopLossPercent,
        takeProfitPercent: config?.takeProfitPercent,
        deployedAt: new Date()
      };

      await this.repository.createDeployment(deployment);

      // Start execution (in a real system, this would start a worker/service)
      await this.startStrategyExecution(deploymentId, compiledStrategy, config);

      return {
        success: true,
        deploymentId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async stopStrategy(strategyId: string, userId: string): Promise<boolean> {
    try {
      const deployment = await this.repository.findActiveDeployment(strategyId);
      
      if (!deployment || deployment.userId !== userId) {
        return false;
      }

      // Stop execution
      await this.stopStrategyExecution(deployment.id);

      // Update deployment record
      await this.repository.updateDeployment(deployment.id, {
        status: 'STOPPED',
        stoppedAt: new Date()
      });

      return true;

    } catch (error) {
      console.error('Error stopping strategy:', error);
      return false;
    }
  }

  static async getStrategyStatus(strategyId: string, userId?: string): Promise<any | null> {
    try {
      const deployment = await this.repository.findActiveDeployment(strategyId);
      
      if (!deployment) {
        return {
          status: 'STOPPED',
          deploymentId: null,
          startedAt: null,
          lastSignal: null,
          performance: null
        };
      }

      // Check access
      if (userId && deployment.userId !== userId) {
        return null;
      }

      // Get performance metrics
      const metrics = await this.repository.getDeploymentMetrics(deployment.id);

      return {
        status: deployment.status,
        deploymentId: deployment.id,
        startedAt: deployment.deployedAt,
        lastSignal: deployment.lastSignalAt,
        performance: metrics ? {
          totalReturn: metrics.totalReturn || 0,
          totalTrades: metrics.totalTrades || 0,
          runningTime: this.calculateRunningTime(deployment.deployedAt)
        } : null
      };

    } catch (error) {
      console.error('Error getting strategy status:', error);
      return null;
    }
  }

  private static async startStrategyExecution(
    deploymentId: string,
    compiledStrategy: any,
    config?: any
  ): Promise<void> {
    // In a production system, this would:
    // 1. Start a worker process/service
    // 2. Subscribe to market data feeds
    // 3. Execute the compiled strategy code on each tick
    // 4. Manage risk and position sizing
    // 5. Send orders to broker API
    
    // For now, we'll just store it in memory
    this.activeDeployments.set(deploymentId, {
      compiledStrategy,
      config,
      startedAt: new Date()
    });

    console.log(`Strategy deployment ${deploymentId} started`);
  }

  private static async stopStrategyExecution(deploymentId: string): Promise<void> {
    // In a production system, this would:
    // 1. Stop the worker process/service
    // 2. Unsubscribe from market data feeds
    // 3. Close any open positions (if configured)
    // 4. Clean up resources
    
    this.activeDeployments.delete(deploymentId);
    console.log(`Strategy deployment ${deploymentId} stopped`);
  }

  private static calculateRunningTime(startedAt: Date): string {
    const now = new Date();
    const diff = now.getTime() - startedAt.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  }

  static async pauseStrategy(strategyId: string, userId: string): Promise<boolean> {
    try {
      const deployment = await this.repository.findActiveDeployment(strategyId);
      
      if (!deployment || deployment.userId !== userId || deployment.status !== 'RUNNING') {
        return false;
      }

      await this.repository.updateDeployment(deployment.id, {
        status: 'PAUSED'
      });

      return true;
    } catch (error) {
      console.error('Error pausing strategy:', error);
      return false;
    }
  }

  static async resumeStrategy(strategyId: string, userId: string): Promise<boolean> {
    try {
      const deployment = await this.repository.findActiveDeployment(strategyId);
      
      if (!deployment || deployment.userId !== userId || deployment.status !== 'PAUSED') {
        return false;
      }

      await this.repository.updateDeployment(deployment.id, {
        status: 'RUNNING'
      });

      return true;
    } catch (error) {
      console.error('Error resuming strategy:', error);
      return false;
    }
  }

  static async getAllActiveDeployments(userId?: string): Promise<any[]> {
    return await this.repository.findActiveDeployments(userId);
  }

  static async getDeploymentLogs(deploymentId: string, userId: string, limit = 100): Promise<any[]> {
    const deployment = await this.repository.findDeploymentById(deploymentId);
    
    if (!deployment || deployment.userId !== userId) {
      return [];
    }

    return await this.repository.getDeploymentLogs(deploymentId, limit);
  }
}