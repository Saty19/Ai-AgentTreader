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
import { strategyBuilderRoutes } from './modules/strategy-builder/routes';

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
app.use('/api/strategy-builder', strategyBuilderRoutes);


const orchestrator = TradingOrchestrator.initialize(socketService);

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit, just log the error
});

// Express error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

async function start() {
    try {
        // Initialize database (without running migrations)
        await initDB();
        console.log('✓ Database connection established');
        
        // Start trading orchestrator
        orchestrator.start();
        console.log('✓ Trading orchestrator started');

        // Start server
        server.listen(config.port, () => {
            console.log(`✓ Server running on port ${config.port}`);
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('  Server is ready to accept requests');
            console.log('  Run migrations: npm run cli migrate');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
