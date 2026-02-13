import { Pool } from 'mysql2/promise';
import { Trade, TradeResult } from '../../../domain/entities';
import { ITradeRepository } from '../../../domain/interfaces';
import { pool } from '../../../core/db';

export class MySQLTradeRepository implements ITradeRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  async create(trade: Trade): Promise<Trade> {
    const [result]: any = await this.db.query(
      'INSERT INTO trades (symbol, side, entryPrice, sl, tp, result, entryTime) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [trade.symbol, trade.side, trade.entryPrice, trade.sl, trade.tp, trade.result, trade.entryTime]
    );
    return { ...trade, id: result.insertId };
  }

  async update(trade: Trade): Promise<void> {
    await this.db.query(
      'UPDATE trades SET exitPrice = ?, pnl = ?, result = ?, exitTime = ? WHERE id = ?',
      [trade.exitPrice, trade.pnl, trade.result, trade.exitTime, trade.id]
    );
  }

  async getAll(): Promise<Trade[]> {
    const [rows]: any = await this.db.query('SELECT * FROM trades ORDER BY entryTime DESC');
    return rows;
  }

  async getOpenTrades(): Promise<Trade[]> {
    const [rows]: any = await this.db.query("SELECT * FROM trades WHERE result = 'OPEN'");
    return rows;
  }
}
