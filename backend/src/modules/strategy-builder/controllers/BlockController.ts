import { Request, Response } from 'express';
import { BlockService } from '../services/BlockService';

export class BlockController {

  static async getAvailableBlocks(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      const result = await BlockService.getAvailableBlocks({
        category,
        search
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching available blocks:', error);
      res.status(500).json({
        error: 'Failed to fetch available blocks',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async createCustomBlock(req: Request, res: Response): Promise<void> {
    try {
      const {
        blockType,
        name,
        description,
        inputSchema,
        outputSchema,
        implementationCode
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!blockType || !name || !implementationCode) {
        res.status(400).json({ 
          error: 'Block type, name, and implementation code are required' 
        });
        return;
      }

      // Validate the implementation code
      const validation = await BlockService.validateBlockImplementation(implementationCode);
      if (!validation.isValid) {
        res.status(400).json({
          error: 'Invalid implementation code',
          validationErrors: validation.errors
        });
        return;
      }

      const blockId = await BlockService.createCustomBlock({
        blockType,
        name,
        description: description || '',
        inputSchema: inputSchema || {},
        outputSchema: outputSchema || {},
        implementationCode,
        userId
      });

      res.status(201).json({ blockId, success: true });
    } catch (error) {
      console.error('Error creating custom block:', error);
      res.status(500).json({
        error: 'Failed to create custom block',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async updateCustomBlock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Validate implementation code if provided
      if (updateData.implementationCode) {
        const validation = await BlockService.validateBlockImplementation(updateData.implementationCode);
        if (!validation.isValid) {
          res.status(400).json({
            error: 'Invalid implementation code',
            validationErrors: validation.errors
          });
          return;
        }
      }

      const success = await BlockService.updateCustomBlock(id, updateData, userId);
      
      if (!success) {
        res.status(404).json({ error: 'Custom block not found or access denied' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating custom block:', error);
      res.status(500).json({
        error: 'Failed to update custom block',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async deleteCustomBlock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const success = await BlockService.deleteCustomBlock(id, userId);
      
      if (!success) {
        res.status(404).json({ error: 'Custom block not found or access denied' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting custom block:', error);
      res.status(500).json({
        error: 'Failed to delete custom block',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getCustomBlocks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const blocks = await BlockService.getCustomBlocks(userId);

      res.status(200).json({ blocks });
    } catch (error) {
      console.error('Error fetching custom blocks:', error);
      res.status(500).json({
        error: 'Failed to fetch custom blocks',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getCustomBlock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const block = await BlockService.getCustomBlock(id, userId);
      
      if (!block) {
        res.status(404).json({ error: 'Custom block not found' });
        return;
      }

      res.status(200).json(block);
    } catch (error) {
      console.error('Error fetching custom block:', error);
      res.status(500).json({
        error: 'Failed to fetch custom block',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async testCustomBlock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { testData } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!testData) {
        res.status(400).json({ error: 'Test data is required' });
        return;
      }

      const result = await BlockService.testCustomBlock(id, testData, userId);
      
      if (!result) {
        res.status(404).json({ error: 'Custom block not found or access denied' });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error testing custom block:', error);
      res.status(500).json({
        error: 'Failed to test custom block',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}