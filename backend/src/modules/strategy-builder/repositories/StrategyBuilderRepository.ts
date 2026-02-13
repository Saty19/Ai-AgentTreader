import { db } from '../../../core/db';

export class StrategyBuilderRepository {

  async findStrategies(options: {
    userId?: string;
    page: number;
    limit: number;
    search?: string;
    isPublic?: boolean;
  }): Promise<{ strategies: any[]; total: number }> {
    const offset = (options.page - 1) * options.limit;
    
    let query = 'SELECT * FROM visual_strategies WHERE 1=1';
    const params: any[] = [];

    if (options.userId) {
      query += ' AND user_id = ?';
      params.push(options.userId);
    }

    if (options.isPublic !== undefined) {
      query += ' AND is_public = ?';
      params.push(options.isPublic);
    }

    if (options.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(options.limit, offset);

    const [strategies] = await db.query(query, params) as any;

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM visual_strategies WHERE 1=1';
    const countParams: any[] = [];

    if (options.userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(options.userId);
    }

    if (options.isPublic !== undefined) {
      countQuery += ' AND is_public = ?';
      countParams.push(options.isPublic);
    }

    if (options.search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${options.search}%`, `%${options.search}%`);
    }

    const [countRows] = await db.query(countQuery, countParams) as any;
    const total = countRows?.total || 0;

    return { strategies, total };
  }

  async findStrategyById(strategyId: string): Promise<any | null> {
    const [rows] = await db.query(
      'SELECT * FROM visual_strategies WHERE id = ?',
      [strategyId]
    ) as any;
    return rows[0] || null;
  }

  async createStrategy(strategy: any): Promise<void> {
    await db.query(
      `INSERT INTO visual_strategies 
       (id, name, description, strategy_definition, is_public, user_id, version, status, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        strategy.id,
        strategy.name,
        strategy.description,
        strategy.strategyDefinition,
        strategy.isPublic,
        strategy.userId,
        strategy.version,
        strategy.status || 'DRAFT',
        strategy.tags,
        strategy.createdAt,
        strategy.updatedAt
      ]
    );
  }

  async updateStrategy(strategyId: string, updates: any): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = ?`);
      values.push(value);
    });

    if (fields.length === 0) return false;

    values.push(strategyId);

    const [result] = await db.query(
      `UPDATE visual_strategies SET ${fields.join(', ')} WHERE id = ?`,
      values
    ) as any;

    return result.affectedRows > 0;
  }

  async deleteStrategy(strategyId: string): Promise<boolean> {
    const [result] = await db.query(
      'DELETE FROM visual_strategies WHERE id = ?',
      [strategyId]
    ) as any;
    return result.affectedRows > 0;
  }

  async isStrategyDeployed(strategyId: string): Promise<boolean> {
    const [deployment] = await db.query('SELECT id FROM strategy_deployments WHERE strategy_id = ? AND status IN (?, ?)',
      [strategyId, 'RUNNING', 'PAUSED']
    ) as any;
    return !!deployment;
  }

  async createShareToken(strategyId: string, shareToken: string): Promise<void> {
    await db.query(
      `INSERT INTO strategy_shares (id, strategy_id, share_token, created_by, created_at)
       SELECT UUID(), ?, ?, user_id, NOW() FROM visual_strategies WHERE id = ?`,
      [strategyId, shareToken, strategyId]
    );
  }

  async findShareByToken(shareToken: string): Promise<any | null> {
    const [share] = await db.query('SELECT * FROM strategy_shares WHERE share_token = ?',
      [shareToken]
    ) as any;
    return share || null;
  }

  async incrementShareAccessCount(shareId: string): Promise<void> {
    await db.query(
      'UPDATE strategy_shares SET access_count = access_count + 1 WHERE id = ?',
      [shareId]
    );
  }

  async getStrategyStats(strategyId: string): Promise<any> {
    const [stats] = await db.query(`SELECT 
        (SELECT COUNT(*) FROM strategy_backtests WHERE strategy_id = ?) as backtest_count,
        (SELECT COUNT(*) FROM strategy_deployments WHERE strategy_id = ?) as deployment_count,
        (SELECT status FROM strategy_deployments WHERE strategy_id = ? ORDER BY deployed_at DESC LIMIT 1) as current_status
      FROM dual`,
      [strategyId, strategyId, strategyId]
    ) as any;
    return stats || {};
  }

  async getUserStrategyStats(userId: string): Promise<any> {
    const [stats] = await db.query(`SELECT 
        COUNT(*) as total_strategies,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_strategies,
        SUM(CASE WHEN is_public = TRUE THEN 1 ELSE 0 END) as public_strategies,
        MIN(created_at) as first_strategy_date,
        MAX(updated_at) as last_activity_date
      FROM visual_strategies WHERE user_id = ?`,
      [userId]
    ) as any;
    return stats || {};
  }

  async searchStrategies(query: string, options: {
    userId?: string;
    publicOnly: boolean;
    page: number;
    limit: number;
  }): Promise<{ strategies: any[]; total: number }> {
    const offset = (options.page - 1) * options.limit;
    
    let sqlQuery = 'SELECT * FROM visual_strategies WHERE MATCH(name, description) AGAINST(? IN NATURAL LANGUAGE MODE)';
    const params: any[] = [query];

    if (options.userId) {
      sqlQuery += ' AND user_id = ?';
      params.push(options.userId);
    }

    if (options.publicOnly) {
      sqlQuery += ' AND is_public = true';
    }

    sqlQuery += ' LIMIT ? OFFSET ?';
    params.push(options.limit, offset);

    const [strategies] = await db.query(sqlQuery, params) as any;

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM visual_strategies WHERE MATCH(name, description) AGAINST(? IN NATURAL LANGUAGE MODE)';
    const countParams: any[] = [query];

    if (options.userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(options.userId);
    }

    if (options.publicOnly) {
      countQuery += ' AND is_public = true';
    }

    const [countRows] = await db.query(countQuery, countParams) as any;
    const total = countRows?.total || 0;

    return { strategies, total };
  }

  async getPopularStrategies(limit: number): Promise<any[]> {
    return await db.query(
      `SELECT vs.* FROM visual_strategies vs
       LEFT JOIN (
         SELECT strategy_id, COUNT(*) as usage_count 
         FROM strategy_deployments 
         GROUP BY strategy_id
       ) sd ON vs.id = sd.strategy_id
       WHERE vs.is_public = true AND vs.status = 'ACTIVE'
       ORDER BY sd.usage_count DESC, vs.created_at DESC
       LIMIT ?`,
      [limit]
    );
  }

  async getRecentStrategies(userId?: string, limit = 10): Promise<any[]> {
    if (userId) {
      return await db.query(
        'SELECT * FROM visual_strategies WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?',
        [userId, limit]
      );
    } else {
      return await db.query(
        'SELECT * FROM visual_strategies WHERE is_public = true AND status = \'ACTIVE\' ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
    }
  }

  async deleteOldStrategies(cutoffDate: Date): Promise<number> {
    const [result] = await db.query('DELETE FROM visual_strategies WHERE status = \'ARCHIVED\' AND updated_at < ?',
      [cutoffDate]
    ) as any;
    return result.affectedRows || 0;
  }

  // Deployment methods

  async createDeployment(deployment: any): Promise<void> {
    await db.query(
      `INSERT INTO strategy_deployments 
       (id, strategy_id, user_id, deployment_name, status, config, paper_trading, 
        max_position_size, stop_loss_percent, take_profit_percent, deployed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deployment.id,
        deployment.strategyId,
        deployment.userId,
        deployment.deploymentName,
        deployment.status,
        deployment.config,
        deployment.paperTrading,
        deployment.maxPositionSize,
        deployment.stopLossPercent,
        deployment.takeProfitPercent,
        deployment.deployedAt
      ]
    );
  }

  async findActiveDeployment(strategyId: string): Promise<any | null> {
    const [deployment] = await db.query('SELECT * FROM strategy_deployments WHERE strategy_id = ? AND status IN (?, ?) ORDER BY deployed_at DESC LIMIT 1',
      [strategyId, 'RUNNING', 'PAUSED']
    ) as any;
    return deployment || null;
  }

  async findDeploymentById(deploymentId: string): Promise<any | null> {
    const [deployment] = await db.query('SELECT * FROM strategy_deployments WHERE id = ?',
      [deploymentId]
    ) as any;
    return deployment || null;
  }

  async updateDeployment(deploymentId: string, updates: any): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = ?`);
      values.push(value);
    });

    if (fields.length === 0) return false;

    values.push(deploymentId);

    const [result] = await db.query(`UPDATE strategy_deployments SET ${fields.join(', ')} WHERE id = ?`,
      values
    ) as any;

    return result.affectedRows > 0;
  }

  async getDeploymentMetrics(deploymentId: string): Promise<any | null> {
    const [metrics] = await db.query(`SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(sa.metric_data, '$.totalReturn')) as totalReturn,
        JSON_UNQUOTE(JSON_EXTRACT(sa.metric_data, '$.totalTrades')) as totalTrades
      FROM strategy_analytics sa
      JOIN strategy_deployments sd ON sa.strategy_id = sd.strategy_id
      WHERE sd.id = ?
      ORDER BY sa.recorded_at DESC
      LIMIT 1`,
      [deploymentId]
    ) as any;
    return metrics || null;
  }

  async findActiveDeployments(userId?: string): Promise<any[]> {
    if (userId) {
      return await db.query(
        'SELECT * FROM strategy_deployments WHERE user_id = ? AND status IN (?, ?) ORDER BY deployed_at DESC',
        [userId, 'RUNNING', 'PAUSED']
      );
    } else {
      return await db.query(
        'SELECT * FROM strategy_deployments WHERE status IN (?, ?) ORDER BY deployed_at DESC',
        ['RUNNING', 'PAUSED']
      );
    }
  }

  async getDeploymentLogs(deploymentId: string, limit: number): Promise<any[]> {
    // This would require a separate deployment_logs table
    // For now return empty array
    return [];
  }
}