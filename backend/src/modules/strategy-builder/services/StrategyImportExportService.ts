import { StrategyBuilderRepository } from '../repositories/StrategyBuilderRepository';
import { StrategyValidationService } from './StrategyValidationService';
import { v4 as uuidv4 } from 'uuid';
import * as yaml from 'js-yaml';

export class StrategyImportExportService {
  private static repository = new StrategyBuilderRepository();

  static async exportStrategy(
    strategyId: string,
    userId?: string,
    format: 'json' | 'yaml' = 'json'
  ): Promise<{
    data: string;
    filename: string;
    mimeType: string;
  } | null> {
    try {
      const strategy = await this.repository.findStrategyById(strategyId);
      
      if (!strategy) return null;
      if (userId && !strategy.isPublic && strategy.userId !== userId) return null;

      const exportData = {
        name: strategy.name,
        description: strategy.description,
        strategyDefinition: JSON.parse(strategy.strategyDefinition),
        tags: strategy.tags ? JSON.parse(strategy.tags) : [],
        version: strategy.version || 1,
        exportedAt: new Date().toISOString(),
        exportedBy: userId || 'anonymous'
      };

      let data: string;
      let mimeType: string;
      let extension: string;

      if (format === 'yaml') {
        data = yaml.dump(exportData);
        mimeType = 'application/x-yaml';
        extension = 'yaml';
      } else {
        data = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      const filename = `${strategy.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

      return { data, filename, mimeType };

    } catch (error) {
      console.error('Error exporting strategy:', error);
      return null;
    }
  }

  static async importFromFile(
    file: any,
    userId: string
  ): Promise<{
    success: boolean;
    strategyId?: string;
    error?: string;
  }> {
    try {
      // Read file content
      const content = file.buffer ? file.buffer.toString('utf-8') : file.content;
      
      if (!content) {
        return { success: false, error: 'File content is empty' };
      }

      // Parse based on file type
      let importData: any;
      
      if (file.originalname?.endsWith('.yaml') || file.originalname?.endsWith('.yml')) {
        try {
          importData = yaml.load(content);
        } catch (error) {
          return { success: false, error: 'Invalid YAML format' };
        }
      } else {
        try {
          importData = JSON.parse(content);
        } catch (error) {
          return { success: false, error: 'Invalid JSON format' };
        }
      }

      // Validate import data
      if (!importData.strategyDefinition) {
        return { success: false, error: 'Missing strategy definition' };
      }

      // Validate strategy definition
      const validation = await StrategyValidationService.validateStrategy(importData.strategyDefinition);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid strategy: ' + validation.errors.map(e => e.message).join(', ')
        };
      }

      // Create new strategy
      const strategyId = uuidv4();
      const strategy = {
        id: strategyId,
        name: importData.name || 'Imported Strategy',
        description: importData.description || 'Imported from file',
        strategyDefinition: JSON.stringify(importData.strategyDefinition),
        isPublic: false,
        userId,
        version: importData.version || 1,
        tags: importData.tags ? JSON.stringify(importData.tags) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.repository.createStrategy(strategy);

      return { success: true, strategyId };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async importFromShareUrl(
    shareUrl: string,
    userId: string
  ): Promise<{
    success: boolean;
    strategyId?: string;
    error?: string;
  }> {
    try {
      // Extract share token from URL
      const shareToken = this.extractShareToken(shareUrl);
      if (!shareToken) {
        return { success: false, error: 'Invalid share URL' };
      }

      // Find shared strategy
      const share = await this.repository.findShareByToken(shareToken);
      if (!share) {
        return { success: false, error: 'Share not found or expired' };
      }

      // Check expiration
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return { success: false, error: 'Share link has expired' };
      }

      // Get original strategy
      const originalStrategy = await this.repository.findStrategyById(share.strategyId);
      if (!originalStrategy || !originalStrategy.isPublic) {
        return { success: false, error: 'Strategy not available' };
      }

      // Create copy for user
      const newStrategyId = uuidv4();
      const strategy = {
        id: newStrategyId,
        name: `${originalStrategy.name} (Shared)`,
        description: originalStrategy.description,
        strategyDefinition: originalStrategy.strategyDefinition,
        isPublic: false,
        userId,
        version: originalStrategy.version,
        tags: originalStrategy.tags,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.repository.createStrategy(strategy);

      // Update access count
      await this.repository.incrementShareAccessCount(share.id);

      return { success: true, strategyId: newStrategyId };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static extractShareToken(shareUrl: string): string | null {
    try {
      // Extract token from URL
      // Supports formats: /shared/TOKEN or ?token=TOKEN
      const pathMatch = shareUrl.match(/\/shared\/([a-f0-9-]+)/i);
      if (pathMatch) return pathMatch[1];

      const queryMatch = shareUrl.match(/[?&]token=([a-f0-9-]+)/i);
      if (queryMatch) return queryMatch[1];

      // If just a token was provided
      if (/^[a-f0-9-]{36}$/i.test(shareUrl)) {
        return shareUrl;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  static async exportBatch(
    strategyIds: string[],
    userId: string,
    format: 'json' | 'yaml' = 'json'
  ): Promise<{
    data: string;
    filename: string;
    mimeType: string;
  } | null> {
    try {
      const strategies = [];

      for (const strategyId of strategyIds) {
        const strategy = await this.repository.findStrategyById(strategyId);
        
        if (!strategy) continue;
        if (!strategy.isPublic && strategy.userId !== userId) continue;

        strategies.push({
          id: strategy.id,
          name: strategy.name,
          description: strategy.description,
          strategyDefinition: JSON.parse(strategy.strategyDefinition),
          tags: strategy.tags ? JSON.parse(strategy.tags) : [],
          version: strategy.version || 1
        });
      }

      if (strategies.length === 0) {
        return null;
      }

      const exportData = {
        strategies,
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        count: strategies.length
      };

      let data: string;
      let mimeType: string;
      let extension: string;

      if (format === 'yaml') {
        data = yaml.dump(exportData);
        mimeType = 'application/x-yaml';
        extension = 'yaml';
      } else {
        data = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      const filename = `strategies_batch_${Date.now()}.${extension}`;

      return { data, filename, mimeType };

    } catch (error) {
      console.error('Error exporting batch:', error);
      return null;
    }
  }

  static async importBatch(
    file: any,
    userId: string
  ): Promise<{
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const content = file.buffer ? file.buffer.toString('utf-8') : file.content;
      let importData: any;

      if (file.originalname?.endsWith('.yaml') || file.originalname?.endsWith('.yml')) {
        importData = yaml.load(content);
      } else {
        importData = JSON.parse(content);
      }

      if (!importData.strategies || !Array.isArray(importData.strategies)) {
        return {
          success: false,
          imported: 0,
          failed: 0,
          errors: ['Invalid batch format: missing strategies array']
        };
      }

      const results = {
        imported: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const strategyData of importData.strategies) {
        try {
          const validation = await StrategyValidationService.validateStrategy(strategyData.strategyDefinition);
          
          if (!validation.isValid) {
            results.failed++;
            results.errors.push(`${strategyData.name}: ${validation.errors.map(e => e.message).join(', ')}`);
            continue;
          }

          const strategyId = uuidv4();
          await this.repository.createStrategy({
            id: strategyId,
            name: strategyData.name || 'Imported Strategy',
            description: strategyData.description || '',
            strategyDefinition: JSON.stringify(strategyData.strategyDefinition),
            isPublic: false,
            userId,
            version: strategyData.version || 1,
            tags: strategyData.tags ? JSON.stringify(strategyData.tags) : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          results.imported++;
        } catch (error) {
          results.failed++;
          results.errors.push(`${strategyData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: results.imported > 0,
        ...results
      };

    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}