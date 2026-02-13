import { Pool } from 'mysql2/promise';
import { Signal } from '../../../domain/entities';
import { ISignalRepository } from '../../../domain/interfaces';
import { pool } from '../../../core/db';

export class MySQLSignalRepository implements ISignalRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  async create(signal: Signal): Promise<void> {
    await this.db.query(
      'INSERT INTO signals (symbol, side, price, time, reason, ema5, ema26, ema150, angle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [signal.symbol, signal.side, signal.price, signal.time, signal.reason, signal.ema5, signal.ema26, signal.ema150, signal.angle]
    );
  }

  async getLatest(limit: number): Promise<Signal[]> {
    const [rows]: any = await this.db.query('SELECT * FROM signals ORDER BY time DESC LIMIT ?', [limit]);
    return rows;
  }
}
