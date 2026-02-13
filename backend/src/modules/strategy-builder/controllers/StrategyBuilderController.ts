/// <reference path="../../../types/express.d.ts" />
import { Request, Response } from 'express';
import { StrategyBuilderService } from '../services/StrategyBuilderService';
import { StrategyValidationService } from '../services/StrategyValidationService';
import { StrategyCompilationService } from '../services/StrategyCompilationService';
import { StrategyDeploymentService } from '../services/StrategyDeploymentService';
import { StrategyImportExportService } from '../services/StrategyImportExportService';

export class StrategyBuilderController {
  
  // Strategy Management

  static async getStrategies(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const isPublic = req.query.isPublic === 'true';

      const result = await StrategyBuilderService.getStrategies({
        userId,
        page,
        limit,
        search,
        isPublic
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      res.status(500).json({ 
        error: 'Failed to fetch strategies',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Assuming auth middleware sets req.user

      const strategy = await StrategyBuilderService.getStrategyById(id, userId);
      
      if (!strategy) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
      }

      res.status(200).json(strategy);
    } catch (error) {
      console.error('Error fetching strategy:', error);
      res.status(500).json({ 
        error: 'Failed to fetch strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async createStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, strategyDefinition, isPublic } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!name || !strategyDefinition) {
        res.status(400).json({ error: 'Name and strategy definition are required' });
        return;
      }

      // Validate strategy definition
      const validation = await StrategyValidationService.validateStrategy(strategyDefinition);
      if (!validation.isValid) {
        res.status(400).json({ 
          error: 'Invalid strategy definition',
          validationErrors: validation.errors
        });
        return;
      }

      const strategyId = await StrategyBuilderService.createStrategy({
        name,
        description,
        strategyDefinition,
        isPublic: isPublic || false,
        userId
      });

      res.status(201).json({ strategyId, success: true });
    } catch (error) {
      console.error('Error creating strategy:', error);
      res.status(500).json({ 
        error: 'Failed to create strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async updateStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Validate strategy definition if provided
      if (updateData.strategyDefinition) {
        const validation = await StrategyValidationService.validateStrategy(updateData.strategyDefinition);
        if (!validation.isValid) {
          res.status(400).json({ 
            error: 'Invalid strategy definition',
            validationErrors: validation.errors
          });
          return;
        }
      }

      const success = await StrategyBuilderService.updateStrategy(id, updateData, userId);
      
      if (!success) {
        res.status(404).json({ error: 'Strategy not found or access denied' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating strategy:', error);
      res.status(500).json({ 
        error: 'Failed to update strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async deleteStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const success = await StrategyBuilderService.deleteStrategy(id, userId);
      
      if (!success) {
        res.status(404).json({ error: 'Strategy not found or access denied' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting strategy:', error);
      res.status(500).json({ 
        error: 'Failed to delete strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async duplicateStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const strategyId = await StrategyBuilderService.duplicateStrategy(id, userId);
      
      if (!strategyId) {
        res.status(404).json({ error: 'Strategy not found or access denied' });
        return;
      }

      res.status(201).json({ strategyId, success: true });
    } catch (error) {
      console.error('Error duplicating strategy:', error);
      res.status(500).json({ 
        error: 'Failed to duplicate strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Validation & Compilation

  static async validateStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { strategyDefinition } = req.body;

      if (!strategyDefinition) {
        res.status(400).json({ error: 'Strategy definition is required' });
        return;
      }

      const validation = await StrategyValidationService.validateStrategy(strategyDefinition);
      
      res.status(200).json(validation);
    } catch (error) {
      console.error('Error validating strategy:', error);
      res.status(500).json({ 
        error: 'Failed to validate strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async compileStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { strategyDefinition } = req.body;

      if (!strategyDefinition) {
        res.status(400).json({ error: 'Strategy definition is required' });
        return;
      }

      // Validate first
      const validation = await StrategyValidationService.validateStrategy(strategyDefinition);
      if (!validation.isValid) {
        res.status(400).json({ 
          success: false,
          error: 'Strategy validation failed',
          validationErrors: validation.errors
        });
        return;
      }

      const compiledStrategy = await StrategyCompilationService.compileStrategy(strategyDefinition);
      
      res.status(200).json({
        success: true,
        compiledStrategy
      });
    } catch (error) {
      console.error('Error compiling strategy:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to compile strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Strategy Deployment

  static async deployStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const config = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await StrategyDeploymentService.deployStrategy(id, userId, config);
      
      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error deploying strategy:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to deploy strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async stopStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const success = await StrategyDeploymentService.stopStrategy(id, userId);
      
      if (!success) {
        res.status(404).json({ error: 'Strategy not found or not running' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error stopping strategy:', error);
      res.status(500).json({ 
        error: 'Failed to stop strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getStrategyStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const status = await StrategyDeploymentService.getStrategyStatus(id, userId);
      
      if (!status) {
        res.status(404).json({ error: 'Strategy not found or access denied' });
        return;
      }

      res.status(200).json(status);
    } catch (error) {
      console.error('Error fetching strategy status:', error);
      res.status(500).json({ 
        error: 'Failed to fetch strategy status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Strategy Sharing

  static async shareStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isPublic } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await StrategyBuilderService.shareStrategy(id, userId, isPublic);
      
      if (!result.success) {
        res.status(404).json({ error: 'Strategy not found or access denied' });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error sharing strategy:', error);
      res.status(500).json({ 
        error: 'Failed to share strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async importStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { shareUrl } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!shareUrl) {
        res.status(400).json({ error: 'Share URL is required' });
        return;
      }

      const result = await StrategyImportExportService.importFromShareUrl(shareUrl, userId);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error importing strategy:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to import strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Export/Import

  static async exportStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const format = (req.query.format as string) || 'json';
      const userId = req.user?.id;

      if (!['json', 'yaml'].includes(format)) {
        res.status(400).json({ error: 'Format must be json or yaml' });
        return;
      }

      const result = await StrategyImportExportService.exportStrategy(id, userId, format as 'json' | 'yaml');
      
      if (!result) {
        res.status(404).json({ error: 'Strategy not found or access denied' });
        return;
      }

      const { data, filename, mimeType } = result;
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(data);
    } catch (error) {
      console.error('Error exporting strategy:', error);
      res.status(500).json({ 
        error: 'Failed to export strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async importStrategyFile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }

      const result = await StrategyImportExportService.importFromFile(req.file, userId);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error importing strategy file:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to import strategy file',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}