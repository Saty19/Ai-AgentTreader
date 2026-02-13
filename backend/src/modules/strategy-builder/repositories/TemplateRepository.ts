import { db } from '../../../core/db';

export class TemplateRepository {

  async findTemplates(options: {
    category?: string;
    difficulty?: string;
    search?: string;
    tags?: string[];
    page: number;
    limit: number;
  }): Promise<{ templates: any[]; total: number }> {
    const offset = (options.page - 1) * options.limit;
    
    let query = 'SELECT * FROM strategy_templates WHERE 1=1';
    const params: any[] = [];

    if (options.category) {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options.difficulty) {
      query += ' AND difficulty = ?';
      params.push(options.difficulty);
    }

    if (options.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.tags && options.tags.length > 0) {
      const tagConditions = options.tags.map(() => 'JSON_CONTAINS(tags, ?)').join(' OR ');
      query += ` AND (${tagConditions})`;
      options.tags.forEach(tag => params.push(JSON.stringify(tag)));
    }

    query += ' ORDER BY rating_average DESC, usage_count DESC LIMIT ? OFFSET ?';
    params.push(options.limit, offset);

    const [templates] = await db.query(query, params) as any;

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM strategy_templates WHERE 1=1';
    const countParams: any[] = [];

    if (options.category) {
      countQuery += ' AND category = ?';
      countParams.push(options.category);
    }

    if (options.difficulty) {
      countQuery += ' AND difficulty = ?';
      countParams.push(options.difficulty);
    }

    if (options.search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.tags && options.tags.length > 0) {
      const tagConditions = options.tags.map(() => 'JSON_CONTAINS(tags, ?)').join(' OR ');
      countQuery += ` AND (${tagConditions})`;
      options.tags.forEach(tag => countParams.push(JSON.stringify(tag)));
    }

    const [countResult] = await db.query(countQuery, countParams) as any;
    const total = countResult?.total || 0;

    return { templates, total };
  }

  async findTemplateById(templateId: string): Promise<any | null> {
    const [template] = await db.query('SELECT * FROM strategy_templates WHERE id = ?',
      [templateId]
    ) as any;
    return template || null;
  }

  async createTemplate(template: any): Promise<void> {
    await db.query(
      `INSERT INTO strategy_templates 
       (id, name, description, category, difficulty, strategy_definition, preview_image, documentation, tags, is_featured, usage_count, rating_average, rating_count, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template.id,
        template.name,
        template.description,
        template.category,
        template.difficulty,
        template.strategyDefinition,
        template.previewImage,
        template.documentation,
        template.tags,
        template.isFeatured,
        template.usageCount,
        template.ratingAverage,
        template.ratingCount,
        template.createdBy,
        template.createdAt,
        template.updatedAt
      ]
    );
  }

  async updateTemplate(templateId: string, updates: any): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = ?`);
      values.push(value);
    });

    if (fields.length === 0) return false;

    values.push(templateId);

    const [result] = await db.query(`UPDATE strategy_templates SET ${fields.join(', ')} WHERE id = ?`,
      values
    ) as any;

    return result.affectedRows > 0;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const [result] = await db.query('DELETE FROM strategy_templates WHERE id = ?',
      [templateId]
    ) as any;
    return result.affectedRows > 0;
  }

  async getTemplateUsageCount(templateId: string): Promise<number> {
    const [result] = await db.query(`SELECT COUNT(*) as count FROM visual_strategies 
       WHERE JSON_UNQUOTE(JSON_EXTRACT(strategy_definition, '$.templateId')) = ?`,
      [templateId]
    ) as any;
    return result?.count || 0;
  }

  async getUniqueCategories(): Promise<string[]> {
    const [results] = await db.query('SELECT DISTINCT category FROM strategy_templates ORDER BY category'
    ) as any;
    return results.map((r: any) => r.category);
  }

  async findPopularTemplates(limit: number): Promise<any[]> {
    return await db.query(
      'SELECT * FROM strategy_templates ORDER BY usage_count DESC, rating_average DESC LIMIT ?',
      [limit]
    );
  }

  async findFeaturedTemplates(limit: number): Promise<any[]> {
    return await db.query(
      'SELECT * FROM strategy_templates WHERE is_featured = true ORDER BY rating_average DESC LIMIT ?',
      [limit]
    );
  }

  async createOrUpdateRating(rating: any): Promise<boolean> {
    const [result] = await db.query(`INSERT INTO template_ratings (id, template_id, user_id, rating, review, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review), updated_at = VALUES(updated_at)`,
      [
        rating.id,
        rating.templateId,
        rating.userId,
        rating.rating,
        rating.review,
        rating.createdAt,
        rating.updatedAt
      ]
    ) as any;
    return result.affectedRows > 0;
  }

  async getTemplateRatings(templateId: string): Promise<any[]> {
    return await db.query(
      'SELECT * FROM template_ratings WHERE template_id = ? ORDER BY created_at DESC',
      [templateId]
    );
  }

  async searchTemplates(query: string, limit: number): Promise<any[]> {
    return await db.query(
      `SELECT * FROM strategy_templates 
       WHERE MATCH(name, description) AGAINST(? IN NATURAL LANGUAGE MODE)
       ORDER BY rating_average DESC
       LIMIT ?`,
      [query, limit]
    );
  }

  async findTemplatesByTag(tag: string, limit: number): Promise<any[]> {
    return await db.query(
      `SELECT * FROM strategy_templates 
       WHERE JSON_CONTAINS(tags, ?)
       ORDER BY rating_average DESC, usage_count DESC
       LIMIT ?`,
      [JSON.stringify(tag), limit]
    );
  }

  async incrementUsageCount(templateId: string): Promise<void> {
    await db.query(
      'UPDATE strategy_templates SET usage_count = usage_count + 1 WHERE id = ?',
      [templateId]
    );
  }
}