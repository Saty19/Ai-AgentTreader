import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './core/config';
import { initDB } from './core/db';
import { SocketBroadcastService } from './core/socket/SocketBroadcastService';

// Repositories
import { MySQLTradeRepository } from './modules/trade/repositories/MySQLTradeRepository';
import { MySQLSignalRepository } from './modules/signal/repositories/MySQLSignalRepository';
import { MySQLStatsRepository } from './modules/stats/repositories/MySQLStatsRepository';

// Services
// Services
// (Moved to Orchestrator)

// Routes
import tradeRoutes from './modules/trade/routes';
import signalRoutes from './modules/signal/routes';
import statsRoutes from './modules/stats/routes';
import strategyRoutes from './modules/strategy-engine/routes';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: config.cors
});

app.use(cors(config.cors));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json());

// Initialize Services & Repositories
import { TradingOrchestrator } from './core/TradingOrchestrator';

const socketService = new SocketBroadcastService(io);

// Module Routes
import marketRoutes from './modules/market/routes';
import authRoutes from './modules/auth/routes';

app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/market', marketRoutes);


const orchestrator = TradingOrchestrator.initialize(socketService);

async function start() {
    await initDB();
    
    orchestrator.start();

    server.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
}

start();
