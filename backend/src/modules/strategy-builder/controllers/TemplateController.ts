import { Request, Response } from 'express';
import { TemplateService } from '../services/TemplateService';

export class TemplateController {

  static async getStrategyTemplates(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      const difficulty = req.query.difficulty as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const tags = req.query.tags as string;

      const result = await TemplateService.getStrategyTemplates({
        category,
        difficulty,
        page,
        limit,
        search,
        tags: tags ? tags.split(',') : undefined
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching strategy templates:', error);
      res.status(500).json({
        error: 'Failed to fetch strategy templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getStrategyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const template = await TemplateService.getStrategyTemplate(id);
      
      if (!template) {
        res.status(404).json({ error: 'Strategy template not found' });
        return;
      }

      res.status(200).json(template);
    } catch (error) {
      console.error('Error fetching strategy template:', error);
      res.status(500).json({
        error: 'Failed to fetch strategy template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async createStrategyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        category,
        difficulty,
        tags,
        strategyDefinition,
        previewImage,
        documentation
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check if user has admin privileges for creating templates
      const hasPermission = await TemplateService.checkTemplateCreationPermission(userId);
      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions to create templates' });
        return;
      }

      if (!name || !description || !category || !strategyDefinition) {
        res.status(400).json({
          error: 'Name, description, category, and strategy definition are required'
        });
        return;
      }

      // Validate strategy definition
      const validation = await TemplateService.validateTemplateStrategy(strategyDefinition);
      if (!validation.isValid) {
        res.status(400).json({
          error: 'Invalid strategy definition',
          validationErrors: validation.errors
        });
        return;
      }

      const templateId = await TemplateService.createStrategyTemplate({
        name,
        description,
        category,
        difficulty: difficulty || 'INTERMEDIATE',
        tags: tags || [],
        strategyDefinition,
        previewImage,
        documentation,
        createdBy: userId
      });

      res.status(201).json({ templateId, success: true });
    } catch (error) {
      console.error('Error creating strategy template:', error);
      res.status(500).json({
        error: 'Failed to create strategy template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async updateStrategyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check permissions
      const hasPermission = await TemplateService.checkTemplateEditPermission(id, userId);
      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions to edit this template' });
        return;
      }

      // Validate strategy definition if provided
      if (updateData.strategyDefinition) {
        const validation = await TemplateService.validateTemplateStrategy(updateData.strategyDefinition);
        if (!validation.isValid) {
          res.status(400).json({
            error: 'Invalid strategy definition',
            validationErrors: validation.errors
          });
          return;
        }
      }

      const success = await TemplateService.updateStrategyTemplate(id, updateData);
      
      if (!success) {
        res.status(404).json({ error: 'Strategy template not found' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating strategy template:', error);
      res.status(500).json({
        error: 'Failed to update strategy template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async deleteStrategyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check permissions
      const hasPermission = await TemplateService.checkTemplateDeletePermission(id, userId);
      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions to delete this template' });
        return;
      }

      const success = await TemplateService.deleteStrategyTemplate(id);
      
      if (!success) {
        res.status(404).json({ error: 'Strategy template not found' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting strategy template:', error);
      res.status(500).json({
        error: 'Failed to delete strategy template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async cloneTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!name) {
        res.status(400).json({ error: 'Name is required for cloned template' });
        return;
      }

      const templateId = await TemplateService.cloneTemplate(id, {
        name,
        description,
        userId
      });
      
      if (!templateId) {
        res.status(404).json({ error: 'Strategy template not found' });
        return;
      }

      res.status(201).json({ templateId, success: true });
    } catch (error) {
      console.error('Error cloning strategy template:', error);
      res.status(500).json({
        error: 'Failed to clone strategy template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getTemplateCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await TemplateService.getTemplateCategories();

      res.status(200).json({ categories });
    } catch (error) {
      console.error('Error fetching template categories:', error);
      res.status(500).json({
        error: 'Failed to fetch template categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getPopularTemplates(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const templates = await TemplateService.getPopularTemplates(limit);

      res.status(200).json({ templates });
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      res.status(500).json({
        error: 'Failed to fetch popular templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getFeaturedTemplates(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      
      const templates = await TemplateService.getFeaturedTemplates(limit);

      res.status(200).json({ templates });
    } catch (error) {
      console.error('Error fetching featured templates:', error);
      res.status(500).json({
        error: 'Failed to fetch featured templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async rateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, review } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
        return;
      }

      const success = await TemplateService.rateTemplate(id, userId, rating, review);
      
      if (!success) {
        res.status(404).json({ error: 'Strategy template not found' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error rating template:', error);
      res.status(500).json({
        error: 'Failed to rate template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}