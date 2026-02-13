import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trade_ema',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDB() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        side ENUM('BUY', 'SELL') NOT NULL,
        entryPrice DECIMAL(10, 2) NOT NULL,
        exitPrice DECIMAL(10, 2),
        sl DECIMAL(10, 2) NOT NULL,
        tp DECIMAL(10, 2) NOT NULL,
        pnl DECIMAL(10, 2),
        result ENUM('WIN', 'LOSS', 'OPEN') DEFAULT 'OPEN',
        entryTime BIGINT NOT NULL,
        exitTime BIGINT
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        side ENUM('BUY', 'SELL') NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        time BIGINT NOT NULL,
        reason TEXT,
        ema5 DECIMAL(10, 2),
        ema26 DECIMAL(10, 2),
        ema150 DECIMAL(10, 2),
        angle DECIMAL(10, 2)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        totalTrades INT DEFAULT 0,
        wins INT DEFAULT 0,
        losses INT DEFAULT 0,
        winRate DECIMAL(5, 2) DEFAULT 0,
        profitFactor DECIMAL(5, 2) DEFAULT 0,
        drawdown DECIMAL(5, 2) DEFAULT 0,
        netPnl DECIMAL(10, 2) DEFAULT 0
      )
    `);

    // Initialize stats if empty
    const [rows]: any = await connection.query('SELECT * FROM stats LIMIT 1');
    if (rows.length === 0) {
      await connection.query('INSERT INTO stats VALUES (1, 0, 0, 0, 0, 0, 0, 0)');
    }

    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    connection.release();
  }
}
