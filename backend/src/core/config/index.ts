import dotenv from 'dotenv';
import path from 'path';

// Load .env from root of backend
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'trade_ema',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  simulation: {
    enabled: process.env.SIMULATION_ENABLED === 'true',
    interval: Number(process.env.SIMULATION_INTERVAL) || 1000
  },
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_me'
};
