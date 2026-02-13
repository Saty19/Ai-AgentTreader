import { BlockRepository } from '../repositories/BlockRepository';
import { v4 as uuidv4 } from 'uuid';
import * as BlockTemplates from '../../../features/strategy-builder/blocks';

export class BlockService {
  private static repository = new BlockRepository();

  static async getAvailableBlocks(options?: {
    category?: string;
    search?: string;
  }): Promise<{
    blocks: any[];
    categories: string[];
  }> {
    try {
      // Get built-in block templates
      let builtInBlocks = BlockTemplates.getAllBlockTemplates();

      // Get custom blocks
      const customBlocks = await this.repository.findAllPublicCustomBlocks();

      // Merge blocks
      let allBlocks = [...builtInBlocks, ...customBlocks];

      // Filter by category
      if (options?.category) {
        allBlocks = allBlocks.filter(b => b.category === options.category);
      }

      // Search
      if (options?.search) {
        allBlocks = BlockTemplates.searchBlocks(options.search);
      }

      // Get unique categories
      const categories = [...new Set(allBlocks.map(b => b.category))].filter(Boolean);

      return {
        blocks: allBlocks,
        categories
      };

    } catch (error) {
      console.error('Error fetching available blocks:', error);
      return { blocks: [], categories: [] };
    }
  }

  static async createCustomBlock(data: {
    userId: string;
    blockType: string;
    name: string;
    description: string;
    inputSchema: object;
    outputSchema: object;
    implementationCode: string;
  }): Promise<string> {
    const blockId = uuidv4();

    const customBlock = {
      id: blockId,
      userId: data.userId,
      blockType: data.blockType,
      name: data.name,
      description: data.description,
      inputSchema: JSON.stringify(data.inputSchema),
      outputSchema: JSON.stringify(data.outputSchema),
      implementationCode: data.implementationCode,
      isPublic: false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.repository.createCustomBlock(customBlock);
    
    return blockId;
  }

  static async updateCustomBlock(
    blockId: string,
    updateData: any,
    userId: string
  ): Promise<boolean> {
    const block = await this.repository.findCustomBlockById(blockId);
    
    if (!block || block.userId !== userId) {
      return false;
    }

    const updates: any = {
      updatedAt: new Date()
    };

    if (updateData.name) updates.name = updateData.name;
    if (updateData.description) updates.description = updateData.description;
    if (updateData.inputSchema) updates.inputSchema = JSON.stringify(updateData.inputSchema);
    if (updateData.outputSchema) updates.outputSchema = JSON.stringify(updateData.outputSchema);
    if (updateData.implementationCode) updates.implementationCode = updateData.implementationCode;
    if (updateData.isPublic !== undefined) updates.isPublic = updateData.isPublic;

    return await this.repository.updateCustomBlock(blockId, updates);
  }

  static async deleteCustomBlock(blockId: string, userId: string): Promise<boolean> {
    const block = await this.repository.findCustomBlockById(blockId);
    
    if (!block || block.userId !== userId) {
      return false;
    }

    // Check if block is being used in any strategies
    const usageCount = await this.repository.getBlockUsageCount(blockId);
    if (usageCount > 0) {
      throw new Error('Cannot delete block that is being used in strategies');
    }

    return await this.repository.deleteCustomBlock(blockId);
  }

  static async getCustomBlocks(userId: string): Promise<any[]> {
    return await this.repository.findCustomBlocksByUser(userId);
  }

  static async getCustomBlock(blockId: string, userId?: string): Promise<any | null> {
    const block = await this.repository.findCustomBlockById(blockId);
    
    if (!block) return null;
    if (!block.isPublic && block.userId !== userId) return null;

    return block;
  }

  static async testCustomBlock(
    blockId: string,
    testData: any,
    userId: string
  ): Promise<any | null> {
    const block = await this.repository.findCustomBlockById(blockId);
    
    if (!block || (!block.isPublic && block.userId !== userId)) {
      return null;
    }

    try {
      // Execute block code in a sandbox
      const result = await this.executeBlockCode(
        block.implementationCode,
        testData
      );

      return {
        success: true,
        result,
        executionTime: result.executionTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  static async validateBlockImplementation(code: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Basic syntax validation
      if (!code || code.trim().length === 0) {
        errors.push('Implementation code cannot be empty');
        return { isValid: false, errors };
      }

      // Check for required function
      if (!code.includes('function execute') && !code.includes('const execute')) {
        errors.push('Implementation must define an "execute" function');
      }

      // Check for dangerous patterns
      const dangerousPatterns = [
        /require\s*\(/,
        /import\s+/,
        /eval\s*\(/,
        /Function\s*\(/,
        /process\./,
        /child_process/,
        /fs\./,
        /__dirname/,
        /__filename/
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
          errors.push(`Dangerous pattern detected: ${pattern.source}`);
        }
      }

      // Try to parse as JavaScript
      try {
        new Function(code);
      } catch (error) {
        errors.push(`Syntax error: ${error instanceof Error ? error.message : 'Invalid JavaScript'}`);
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }

  private static async executeBlockCode(code: string, testData: any): Promise<any> {
    const startTime = Date.now();

    try {
      // Create a safe execution context
      const context = {
        input: testData,
        console: {
          log: (...args: any[]) => console.log('[Block]', ...args)
        }
      };

      // Execute code in sandbox (simplified - in production use vm2 or similar)
      const func = new Function('context', `
        ${code}
        return execute(context.input);
      `);

      const result = await func(context);
      const executionTime = Date.now() - startTime;

      return {
        output: result,
        executionTime
      };

    } catch (error) {
      throw new Error(`Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async incrementBlockUsage(blockId: string): Promise<void> {
    await this.repository.incrementBlockUsage(blockId);
  }

  static async getPopularBlocks(limit = 10): Promise<any[]> {
    return await this.repository.getPopularBlocks(limit);
  }

  static async getBlocksByCategory(category: string): Promise<any[]> {
    const { blocks } = await this.getAvailableBlocks({ category });
    return blocks;
  }
}

// Helper function to get all built-in block templates
function getAllBlockTemplates(): any[] {
  // This should import from the frontend block templates
  // For now, returning empty array as placeholder
  return [];
}

// Helper function to search blocks
function searchBlocks(blocks: any[], query: string): any[] {
  const lowerQuery = query.toLowerCase();
  return blocks.filter(block => 
    block.name?.toLowerCase().includes(lowerQuery) ||
    block.description?.toLowerCase().includes(lowerQuery) ||
    block.blockType?.toLowerCase().includes(lowerQuery)
  );
}