import { TemplateRepository } from '../repositories/TemplateRepository';
import { StrategyValidationService } from './StrategyValidationService';
import { v4 as uuidv4 } from 'uuid';

export class TemplateService {
  private static repository = new TemplateRepository();

  static async getStrategyTemplates(options: {
    category?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
  }): Promise<{
    templates: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;

    const { templates, total } = await this.repository.findTemplates({
      category: options.category,
      difficulty: options.difficulty,
      search: options.search,
      tags: options.tags,
      page,
      limit
    });

    const totalPages = Math.ceil(total / limit);

    return {
      templates,
      total,
      page,
      totalPages
    };
  }

  static async getStrategyTemplate(templateId: string): Promise<any | null> {
    const template = await this.repository.findTemplateById(templateId);
    
    if (!template) return null;

    // Parse JSON fields
    return {
      ...template,
      strategyDefinition: JSON.parse(template.strategyDefinition),
      tags: template.tags ? JSON.parse(template.tags) : []
    };
  }

  static async createStrategyTemplate(data: {
    name: string;
    description: string;
    category: string;
    difficulty: string;
    tags: string[];
    strategyDefinition: any;
    previewImage?: string;
    documentation?: string;
    createdBy: string;
  }): Promise<string> {
    const templateId = uuidv4();

    const template = {
      id: templateId,
      name: data.name,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      strategyDefinition: JSON.stringify(data.strategyDefinition),
      previewImage: data.previewImage || null,
      documentation: data.documentation || null,
      tags: JSON.stringify(data.tags),
      isFeatured: false,
      usageCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.repository.createTemplate(template);
    
    return templateId;
  }

  static async updateStrategyTemplate(
    templateId: string,
    updateData: any
  ): Promise<boolean> {
    const updates: any = {
      updatedAt: new Date()
    };

    if (updateData.name) updates.name = updateData.name;
    if (updateData.description) updates.description = updateData.description;
    if (updateData.category) updates.category = updateData.category;
    if (updateData.difficulty) updates.difficulty = updateData.difficulty;
    if (updateData.strategyDefinition) {
      updates.strategyDefinition = JSON.stringify(updateData.strategyDefinition);
    }
    if (updateData.previewImage !== undefined) updates.previewImage = updateData.previewImage;
    if (updateData.documentation !== undefined) updates.documentation = updateData.documentation;
    if (updateData.tags) updates.tags = JSON.stringify(updateData.tags);
    if (updateData.isFeatured !== undefined) updates.isFeatured = updateData.isFeatured;

    return await this.repository.updateTemplate(templateId, updates);
  }

  static async deleteStrategyTemplate(templateId: string): Promise<boolean> {
    // Check if template is being used
    const usageCount = await this.repository.getTemplateUsageCount(templateId);
    if (usageCount > 0) {
      throw new Error('Cannot delete template that is being used in strategies');
    }

    return await this.repository.deleteTemplate(templateId);
  }

  static async cloneTemplate(
    templateId: string,
    data: {
      name: string;
      description?: string;
      userId: string;
    }
  ): Promise<string | null> {
    const originalTemplate = await this.repository.findTemplateById(templateId);
    
    if (!originalTemplate) return null;

    const newTemplateId = uuidv4();
    const template = {
      id: newTemplateId,
      name: data.name,
      description: data.description || originalTemplate.description,
      category: originalTemplate.category,
      difficulty: originalTemplate.difficulty,
      strategyDefinition: originalTemplate.strategyDefinition,
      previewImage: originalTemplate.previewImage,
      documentation: originalTemplate.documentation,
      tags: originalTemplate.tags,
      isFeatured: false,
      usageCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
      createdBy: data.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.repository.createTemplate(template);
    
    return newTemplateId;
  }

  static async getTemplateCategories(): Promise<string[]> {
    return await this.repository.getUniqueCategories();
  }

  static async getPopularTemplates(limit = 10): Promise<any[]> {
    const templates = await this.repository.findPopularTemplates(limit);
    
    return templates.map(t => ({
      ...t,
      strategyDefinition: JSON.parse(t.strategyDefinition),
      tags: t.tags ? JSON.parse(t.tags) : []
    }));
  }

  static async getFeaturedTemplates(limit = 5): Promise<any[]> {
    const templates = await this.repository.findFeaturedTemplates(limit);
    
    return templates.map(t => ({
      ...t,
      strategyDefinition: JSON.parse(t.strategyDefinition),
      tags: t.tags ? JSON.parse(t.tags) : []
    }));
  }

  static async rateTemplate(
    templateId: string,
    userId: string,
    rating: number,
    review?: string
  ): Promise<boolean> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const ratingId = uuidv4();
    const ratingData = {
      id: ratingId,
      templateId,
      userId,
      rating,
      review: review || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const success = await this.repository.createOrUpdateRating(ratingData);
    
    // The trigger will automatically update the template's rating average and count
    
    return success;
  }

  static async getTemplateRatings(templateId: string): Promise<any[]> {
    return await this.repository.getTemplateRatings(templateId);
  }

  static async validateTemplateStrategy(strategyDefinition: any): Promise<{
    isValid: boolean;
    errors: any[];
  }> {
    const validation = await StrategyValidationService.validateStrategy(strategyDefinition);
    
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  static async checkTemplateCreationPermission(userId: string): Promise<boolean> {
    // In a real system, check user permissions from database
    // For now, return true for all users
    return true;
  }

  static async checkTemplateEditPermission(templateId: string, userId: string): Promise<boolean> {
    const template = await this.repository.findTemplateById(templateId);
    
    if (!template) return false;
    
    // Check if user is the creator or an admin
    return template.createdBy === userId; // Add admin check in production
  }

  static async checkTemplateDeletePermission(templateId: string, userId: string): Promise<boolean> {
    return await this.checkTemplateEditPermission(templateId, userId);
  }

  static async searchTemplates(query: string, limit = 20): Promise<any[]> {
    const templates = await this.repository.searchTemplates(query, limit);
    
    return templates.map(t => ({
      ...t,
      strategyDefinition: JSON.parse(t.strategyDefinition),
      tags: t.tags ? JSON.parse(t.tags) : []
    }));
  }

  static async getTemplatesByTag(tag: string, limit = 20): Promise<any[]> {
    const templates = await this.repository.findTemplatesByTag(tag, limit);
    
    return templates.map(t => ({
      ...t,
      strategyDefinition: JSON.parse(t.strategyDefinition),
      tags: t.tags ? JSON.parse(t.tags) : []
    }));
  }

  static async incrementTemplateUsage(templateId: string): Promise<void> {
    await this.repository.incrementUsageCount(templateId);
  }
}