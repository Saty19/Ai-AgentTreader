// Repository Helper - Common database query utilities
import { Pool, QueryResult, FieldPacket, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class RepositoryBase {
  /**
   * Execute a SELECT query and return rows
   */
  protected static async query<T = any>(pool: Pool, sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as T[];
  }

  /**
   * Execute a SELECT query and return the first row
   */
  protected static async queryOne<T = any>(pool: Pool, sql: string, params?: any[]): Promise<T | null> {
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as T) || null;
  }

  /**
   * Execute an INSERT/UPDATE/DELETE query and return result
   */
  protected static async execute(pool: Pool, sql: string, params?: any[]): Promise<ResultSetHeader> {
    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result;
  }

  /**
   * Execute query and get count
   */
  protected static async queryCount(pool: Pool, sql: string, params?: any[]): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows[0]?.total || rows[0]?.count || 0;
  }
}
