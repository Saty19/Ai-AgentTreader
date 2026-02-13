import { Pool } from 'mysql2/promise';
import { Stats } from '../../../domain/entities';
import { IStatsRepository } from '../../../domain/interfaces';
import { pool } from '../../../core/db';

export class MySQLStatsRepository implements IStatsRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  async get(): Promise<Stats> {
    const [rows]: any = await this.db.query('SELECT * FROM stats LIMIT 1');
    if (rows.length === 0) {
      return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profitFactor: 0,
        drawdown: 0,
        netPnl: 0
      };
    }
    return rows[0];
  }

  async update(stats: Stats): Promise<void> {
    await this.db.query(
      'UPDATE stats SET totalTrades = ?, wins = ?, losses = ?, winRate = ?, profitFactor = ?, drawdown = ?, netPnl = ? WHERE id = 1',
      [stats.totalTrades, stats.wins, stats.losses, stats.winRate, stats.profitFactor, stats.drawdown, stats.netPnl]
    );
  }
}
