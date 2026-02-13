import { db } from '../../../core/db';

export class BacktestRepository {

  async createBacktest(backtest: any): Promise<void> {
    await db.query(
      `INSERT INTO strategy_backtests 
       (id, strategy_id, user_id, name, symbol, timeframe, start_date, end_date, initial_capital, commission, status, progress, results, error_message, execution_time, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        backtest.id,
        backtest.strategyId,
        backtest.userId,
        backtest.name,
        backtest.symbol,
        backtest.timeframe,
        backtest.startDate,
        backtest.endDate,
        backtest.initialCapital,
        backtest.commission,
        backtest.status,
        backtest.progress,
        backtest.results,
        backtest.errorMessage,
        backtest.executionTime,
        backtest.createdAt,
        backtest.completedAt
      ]
    );
  }

  async findBacktestById(backtestId: string): Promise<any | null> {
    const [backtest] = await db.query('SELECT * FROM strategy_backtests WHERE id = ?',
      [backtestId]
    ) as any;
    return backtest || null;
  }

  async updateBacktest(backtestId: string, updates: any): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = ?`);
      values.push(value);
    });

    if (fields.length === 0) return false;

    values.push(backtestId);

    const [result] = await db.query(`UPDATE strategy_backtests SET ${fields.join(', ')} WHERE id = ?`,
      values
    ) as any;

    return result.affectedRows > 0;
  }

  async deleteBacktest(backtestId: string): Promise<boolean> {
    const [result] = await db.query('DELETE FROM strategy_backtests WHERE id = ?',
      [backtestId]
    ) as any;
    return result.affectedRows > 0;
  }

  async findBacktestsByStrategy(
    strategyId: string,
    options: { page: number; limit: number }
  ): Promise<{ tests: any[]; total: number }> {
    const offset = (options.page - 1) * options.limit;

    const [tests] = await db.query(`SELECT * FROM strategy_backtests 
       WHERE strategy_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [strategyId, options.limit, offset]
    ) as any;

    const [countResult] = await db.query('SELECT COUNT(*) as total FROM strategy_backtests WHERE strategy_id = ?',
      [strategyId]
    ) as any;

    const total = countResult?.total || 0;

    return { tests, total };
  }

  async findBacktestsByUser(
    userId: string,
    options: { page: number; limit: number }
  ): Promise<{ tests: any[]; total: number }> {
    const offset = (options.page - 1) * options.limit;

    const [tests] = await db.query(`SELECT * FROM strategy_backtests 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, options.limit, offset]
    ) as any;

    const [countResult] = await db.query('SELECT COUNT(*) as total FROM strategy_backtests WHERE user_id = ?',
      [userId]
    ) as any;

    const total = countResult?.total || 0;

    return { tests, total };
  }

  async findRunningBacktests(userId?: string): Promise<any[]> {
    if (userId) {
      return await db.query(
        'SELECT * FROM strategy_backtests WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
        [userId, 'RUNNING']
      );
    } else {
      return await db.query(
        'SELECT * FROM strategy_backtests WHERE status = ? ORDER BY created_at DESC',
        ['RUNNING']
      );
    }
  }

  async getBacktestStatistics(userId: string): Promise<any> {
    const [stats] = await db.query(`SELECT 
        COUNT(*) as total_backtests,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_backtests,
        SUM(CASE WHEN status = 'RUNNING' THEN 1 ELSE 0 END) as running_backtests,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_backtests,
        AVG(execution_time) as avg_execution_time,
        MAX(created_at) as last_backtest_date
      FROM strategy_backtests WHERE user_id = ?`,
      [userId]
    ) as any;
    return stats || {};
  }

  async deleteOldBacktests(cutoffDate: Date, statuses: string[] = ['COMPLETED', 'FAILED', 'CANCELLED']): Promise<number> {
    const placeholders = statuses.map(() => '?').join(',');
    const [result] = await db.query(`DELETE FROM strategy_backtests 
       WHERE created_at < ? AND status IN (${placeholders})`,
      [cutoffDate, ...statuses]
    ) as any;
    return result.affectedRows || 0;
  }

  async getRecentBacktests(userId: string, limit = 10): Promise<any[]> {
    return await db.query(
      'SELECT * FROM strategy_backtests WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
  }

  async getBacktestsBySymbol(symbol: string, limit = 20): Promise<any[]> {
    return await db.query(
      'SELECT * FROM strategy_backtests WHERE symbol = ? AND status = ? ORDER BY created_at DESC LIMIT ?',
      [symbol, 'COMPLETED', limit]
    );
  }

  async getBacktestPerformanceMetrics(backtestId: string): Promise<any | null> {
    const [backtest] = await db.query('SELECT results FROM strategy_backtests WHERE id = ? AND status = ?',
      [backtestId, 'COMPLETED']
    ) as any;

    if (!backtest || !backtest.results) return null;

    try {
      return JSON.parse(backtest.results);
    } catch (error) {
      return null;
    }
  }

  async getBestPerformingBacktests(userId: string, limit = 10): Promise<any[]> {
    return await db.query(
      `SELECT * FROM strategy_backtests 
       WHERE user_id = ? AND status = 'COMPLETED' AND results IS NOT NULL
       ORDER BY JSON_EXTRACT(results, '$.totalReturn') DESC
       LIMIT ?`,
      [userId, limit]
    );
  }
}