import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { config } from './config';

export const pool = mysql.createPool(config.db);

export async function initDB() {
  let connection;
  try {
    // 1. Ensure Database Exists ////////////////////////////
    connection = await pool.getConnection(); // Try getting connection
  } catch (err: any) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('Database does not exist. Creating...');
      const { database, ...dbConfig } = config.db;
      const tempConnection = await mysql.createConnection(dbConfig);
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\``);
      await tempConnection.end();
      console.log('Database created.');
      connection = await pool.getConnection();
    } else {
      throw err;
    }
  }

  try {
    // 2. Initialize Migrations Table ///////////////////////
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Run Core Table Creations (Legacy/Bootstrapping) ///
    // We keep this for now to ensure base tables exist before running new migrations
    // ideally strictly managed by migrations, but to keep existing logic safe:
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
    
    // Ensure one stats row
    const [statRows]: any = await connection.query('SELECT * FROM stats LIMIT 1');
    if (statRows.length === 0) {
      await connection.query('INSERT INTO stats VALUES (1, 0, 0, 0, 0, 0, 0, 0)');
    }

    // 4. Run Migrations ////////////////////////////////////
    const migrationDir = path.join(__dirname, '../migrations');
    if (fs.existsSync(migrationDir)) {
        const files = fs.readdirSync(migrationDir).sort();
        
        const [executedRows]: any = await connection.query('SELECT name FROM migrations');
        const executedMigrations = new Set(executedRows.map((r: any) => r.name));

        for (const file of files) {
            if (!file.endsWith('.sql')) continue;
            if (executedMigrations.has(file)) continue;

            console.log(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
            
            // Simple split by ';' might be fragile if SQL content has ';', but sufficient for now
            // or just execute the whole file if it supports multi-statements (mysql2 pool usually doesn't by default unless configured)
            // safer to split
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const statement of statements) {
                await connection.query(statement);
            }

            await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);
            console.log(`Migration ${file} completed.`);
        }
    }
    
    // 5. Post-Migration Schema Updates (Idempotent Alters) //
    // Safe column additions for existing tables
    await addColumnIfNotExists(connection, 'trades', 'user_id', 'INT');
    await addColumnIfNotExists(connection, 'trades', 'strategy_id', 'INT');
    
    await addColumnIfNotExists(connection, 'signals', 'user_id', 'INT');
    await addColumnIfNotExists(connection, 'signals', 'strategy_id', 'INT');

    console.log('Database initialized and up to date.');

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

async function addColumnIfNotExists(connection: any, table: string, column: string, type: string) {
    try {
        const [rows]: any = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
        if (rows.length === 0) {
            console.log(`Adding column ${column} to ${table}`);
            await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}`);
        }
    } catch (e) {
        console.error(`Failed to add column ${column} to ${table}`, e);
    }
}
