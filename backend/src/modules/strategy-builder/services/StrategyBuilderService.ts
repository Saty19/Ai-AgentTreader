import { StrategyBuilderRepository } from '../repositories/StrategyBuilderRepository';
import { StrategyValidationService } from './StrategyValidationService';
import { v4 as uuidv4 } from 'uuid';

export interface CreateStrategyRequest {
  name: string;
  description?: string;
  strategyDefinition: any;
  isPublic: boolean;
  userId: string;
}

export interface UpdateStrategyRequest {
  name?: string;
  description?: string;
  strategyDefinition?: any;
  isPublic?: boolean;
}

export interface GetStrategiesOptions {
  userId?: string;
  page: number;
  limit: number;
  search?: string;
  isPublic?: boolean;
}

export interface ShareStrategyResult {
  success: boolean;
  shareUrl?: string;
}

export class StrategyBuilderService {
  private static repository = new StrategyBuilderRepository();

  // Strategy Management

  static async getStrategies(options: GetStrategiesOptions): Promise<{
    strategies: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { strategies, total } = await this.repository.findStrategies(options);
    const totalPages = Math.ceil(total / options.limit);

    return {
      strategies,
      total,
      page: options.page,
      totalPages
    };
  }

  static async getStrategyById(strategyId: string, userId?: string): Promise<any | null> {
    const strategy = await this.repository.findStrategyById(strategyId);
    
    if (!strategy) return null;

    // Check access permissions
    if (!strategy.isPublic && strategy.userId !== userId) {
      return null;
    }

    return strategy;
  }

  static async createStrategy(request: CreateStrategyRequest): Promise<string> {
    const strategyId = uuidv4();
    
    const strategy = {
      id: strategyId,
      name: request.name,
      description: request.description || '',
      strategyDefinition: JSON.stringify(request.strategyDefinition),
      isPublic: request.isPublic,
      userId: request.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.repository.createStrategy(strategy);
    
    return strategyId;
  }

  static async updateStrategy(
    strategyId: string, 
    updateData: UpdateStrategyRequest, 
    userId: string
  ): Promise<boolean> {
    // Check ownership
    const strategy = await this.repository.findStrategyById(strategyId);
    if (!strategy || strategy.userId !== userId) {
      return false;
    }

    const updateFields: any = {
      updatedAt: new Date()
    };

    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.strategyDefinition) {
      updateFields.strategyDefinition = JSON.stringify(updateData.strategyDefinition);
    }
    if (updateData.isPublic !== undefined) updateFields.isPublic = updateData.isPublic;

    return await this.repository.updateStrategy(strategyId, updateFields);
  }

  static async deleteStrategy(strategyId: string, userId: string): Promise<boolean> {
    // Check ownership
    const strategy = await this.repository.findStrategyById(strategyId);
    if (!strategy || strategy.userId !== userId) {
      return false;
    }

    // Check if strategy is currently deployed
    const isDeployed = await this.repository.isStrategyDeployed(strategyId);
    if (isDeployed) {
      throw new Error('Cannot delete a currently deployed strategy. Please stop it first.');
    }

    return await this.repository.deleteStrategy(strategyId);
  }

  static async duplicateStrategy(strategyId: string, userId: string): Promise<string | null> {
    const originalStrategy = await this.repository.findStrategyById(strategyId);
    
    if (!originalStrategy) return null;

    // Check access permissions
    if (!originalStrategy.isPublic && originalStrategy.userId !== userId) {
      return null;
    }

    const newStrategyId = uuidv4();
    const duplicatedStrategy = {
      id: newStrategyId,
      name: `${originalStrategy.name} (Copy)`,
      description: originalStrategy.description,
      strategyDefinition: originalStrategy.strategyDefinition,
      isPublic: false, // Duplicated strategies are private by default
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.repository.createStrategy(duplicatedStrategy);
    
    return newStrategyId;
  }

  // Strategy Sharing

  static async shareStrategy(
    strategyId: string, 
    userId: string, 
    isPublic: boolean
  ): Promise<ShareStrategyResult> {
    // Check ownership
    const strategy = await this.repository.findStrategyById(strategyId);
    if (!strategy || strategy.userId !== userId) {
      return { success: false };
    }

    // Update public status
    const success = await this.repository.updateStrategy(strategyId, { 
      isPublic,
      updatedAt: new Date()
    });

    if (!success) {
      return { success: false };
    }

    // Generate share URL if making public
    let shareUrl: string | undefined;
    if (isPublic) {
      shareUrl = await this.generateShareUrl(strategyId);
    }

    return {
      success: true,
      shareUrl
    };
  }

  private static async generateShareUrl(strategyId: string): Promise<string> {
    const shareToken = uuidv4();
    await this.repository.createShareToken(strategyId, shareToken);
    
    // In a real application, you would use your domain
    return `${process.env.FRONTEND_URL}/strategy-builder/shared/${shareToken}`;
  }

  // Statistics and Analytics

  static async getStrategyStats(strategyId: string, userId: string): Promise<any | null> {
    // Check access
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) return null;

    return await this.repository.getStrategyStats(strategyId);
  }

  static async getUserStrategyStats(userId: string): Promise<any> {
    return await this.repository.getUserStrategyStats(userId);
  }

  // Search and Filtering

  static async searchStrategies(query: string, options: {
    userId?: string;
    publicOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    strategies: any[];
    total: number;
  }> {
    return await this.repository.searchStrategies(query, {
      userId: options.userId,
      publicOnly: options.publicOnly || false,
      page: options.page || 1,
      limit: options.limit || 20
    });
  }

  static async getPopularStrategies(limit = 10): Promise<any[]> {
    return await this.repository.getPopularStrategies(limit);
  }

  static async getRecentStrategies(userId?: string, limit = 10): Promise<any[]> {
    return await this.repository.getRecentStrategies(userId, limit);
  }

  // Strategy Validation

  static async validateStrategyOwnership(strategyId: string, userId: string): Promise<boolean> {
    const strategy = await this.repository.findStrategyById(strategyId);
    return strategy?.userId === userId;
  }

  static async validateStrategyAccess(strategyId: string, userId?: string): Promise<boolean> {
    const strategy = await this.repository.findStrategyById(strategyId);
    
    if (!strategy) return false;
    if (strategy.isPublic) return true;
    if (strategy.userId === userId) return true;
    
    return false;
  }

  // Bulk Operations

  static async bulkDeleteStrategies(strategyIds: string[], userId: string): Promise<{
    success: string[];
    failed: string[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as string[]
    };

    for (const strategyId of strategyIds) {
      try {
        const success = await this.deleteStrategy(strategyId, userId);
        if (success) {
          results.success.push(strategyId);
        } else {
          results.failed.push(strategyId);
        }
      } catch (error) {
        results.failed.push(strategyId);
      }
    }

    return results;
  }

  static async bulkUpdateStrategies(
    updates: Array<{ strategyId: string; updateData: UpdateStrategyRequest }>,
    userId: string
  ): Promise<{
    success: string[];
    failed: string[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as string[]
    };

    for (const { strategyId, updateData } of updates) {
      try {
        const success = await this.updateStrategy(strategyId, updateData, userId);
        if (success) {
          results.success.push(strategyId);
        } else {
          results.failed.push(strategyId);
        }
      } catch (error) {
        results.failed.push(strategyId);
      }
    }

    return results;
  }

  // Migration and Cleanup

  static async migrateStrategy(strategyId: string, userId: string): Promise<boolean> {
    // This method can be used to migrate strategies from older formats
    const strategy = await this.repository.findStrategyById(strategyId);
    
    if (!strategy || strategy.userId !== userId) {
      return false;
    }

    try {
      const strategyDefinition = JSON.parse(strategy.strategyDefinition);
      
      // Apply any necessary migrations here
      const migratedDefinition = await this.applyMigrations(strategyDefinition);
      
      return await this.repository.updateStrategy(strategyId, {
        strategyDefinition: JSON.stringify(migratedDefinition),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Strategy migration failed:', error);
      return false;
    }
  }

  private static async applyMigrations(strategyDefinition: any): Promise<any> {
    // Apply version-specific migrations
    let migrated = { ...strategyDefinition };
    
    // Example migration logic
    if (!migrated.version || migrated.version < 2) {
      // Migrate from v1 to v2
      migrated = this.migrateToV2(migrated);
    }
    
    return migrated;
  }

  private static migrateToV2(definition: any): any {
    // Example migration logic
    return {
      ...definition,
      version: 2,
      metadata: {
        ...definition.metadata,
        migrated: true,
        migratedAt: new Date().toISOString()
      }
    };
  }

  // Cleanup old strategies
  static async cleanupOldStrategies(daysOld = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return await this.repository.deleteOldStrategies(cutoffDate);
  }
}