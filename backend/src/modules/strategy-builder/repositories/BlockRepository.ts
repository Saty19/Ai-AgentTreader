import { db } from '../../../core/db';

export class BlockRepository {

  async findAllPublicCustomBlocks(): Promise<any[]> {
    return await db.query(
      'SELECT * FROM custom_blocks WHERE is_public = true ORDER BY usage_count DESC'
    );
  }

  async findCustomBlockById(blockId: string): Promise<any | null> {
    const [block] = await db.query('SELECT * FROM custom_blocks WHERE id = ?',
      [blockId]
    ) as any;
    return block || null;
  }

  async createCustomBlock(block: any): Promise<void> {
    await db.query(
      `INSERT INTO custom_blocks 
       (id, user_id, block_type, name, description, input_schema, output_schema, implementation_code, is_public, usage_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        block.id,
        block.userId,
        block.blockType,
        block.name,
        block.description,
        block.inputSchema,
        block.outputSchema,
        block.implementationCode,
        block.isPublic,
        block.usageCount,
        block.createdAt,
        block.updatedAt
      ]
    );
  }

  async updateCustomBlock(blockId: string, updates: any): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = ?`);
      values.push(value);
    });

    if (fields.length === 0) return false;

    values.push(blockId);

    const [result] = await db.query(`UPDATE custom_blocks SET ${fields.join(', ')} WHERE id = ?`,
      values
    ) as any;

    return result.affectedRows > 0;
  }

  async deleteCustomBlock(blockId: string): Promise<boolean> {
    const [result] = await db.query('DELETE FROM custom_blocks WHERE id = ?',
      [blockId]
    ) as any;
    return result.affectedRows > 0;
  }

  async getBlockUsageCount(blockId: string): Promise<number> {
    const [result] = await db.query('SELECT COUNT(*) as count FROM block_usage_stats WHERE block_type = ?',
      [blockId]
    ) as any;
    return result?.count || 0;
  }

  async findCustomBlocksByUser(userId: string): Promise<any[]> {
    return await db.query(
      'SELECT * FROM custom_blocks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  async incrementBlockUsage(blockId: string): Promise<void> {
    await db.query(
      'UPDATE custom_blocks SET usage_count = usage_count + 1 WHERE id = ?',
      [blockId]
    );
  }

  async getPopularBlocks(limit: number): Promise<any[]> {
    return await db.query(
      'SELECT * FROM custom_blocks WHERE is_public = true ORDER BY usage_count DESC LIMIT ?',
      [limit]
    );
  }

  async searchCustomBlocks(query: string, limit: number): Promise<any[]> {
    return await db.query(
      `SELECT * FROM custom_blocks 
       WHERE is_public = true AND MATCH(name, description) AGAINST(? IN NATURAL LANGUAGE MODE) 
       LIMIT ?`,
      [query, limit]
    );
  }
}
