# Trade EMA - Automated Trading System Documentation

## Project Overview

Trade EMA is a sophisticated real-time cryptocurrency trading platform that implements algorithmic trading strategies using Exponential Moving Average (EMA) analysis. The system provides automated signal generation, trade execution, portfolio management, and comprehensive analytics.

## System Architecture

### Technology Stack

**Backend (Node.js/TypeScript)**
- **Express.js**: REST API framework
- **Socket.IO**: Real-time WebSocket communication
- **MySQL2**: Database connectivity
- **JWT**: Authentication and authorization
- **TypeScript**: Type-safe development
- **Binance API**: Cryptocurrency market data

**Frontend (React/TypeScript)**
- **React 19**: Modern UI framework
- **Vite**: Build tool and dev server
- **TanStack Query**: Data fetching and caching
- **Socket.IO Client**: Real-time communication
- **TailwindCSS**: Utility-first CSS framework
- **Lightweight Charts**: Trading chart visualization
- **React Router**: Client-side routing

### Core Features

1. **Real-time Market Data**
   - Live price feeds from Binance
   - Real-time candlestick chart updates
   - WebSocket-based price streaming

2. **Algorithmic Trading Strategies**
   - EMA Trend Following Strategy
   - MACD Strategy
   - Custom strategy framework
   - Paper trading simulation

3. **Trade Management**
   - Automated signal generation
   - Stop-loss and take-profit execution
   - Trade history and analytics
   - Risk management

4. **Portfolio Dashboard**
   - Real-time portfolio balance
   - Performance statistics
   - Win rate and profit factor analysis
   - Drawdown tracking

5. **User Authentication**
   - JWT-based authentication
   - Secure user sessions
   - Protected routes

## Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd "/var/www/html/Trade ema"
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   Create `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=trade_ema

   # Server Configuration
   PORT=3000
   CORS_ORIGIN=http://localhost:5173

   # Authentication
   JWT_SECRET=your_super_secret_jwt_key

   # Trading Configuration
   SIMULATION_ENABLED=true
   SIMULATION_INTERVAL=1000
   ```

5. **Database Setup**
   - Create MySQL database named `trade_ema`
   - The application will automatically create tables on first run

### Running the Application

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Project Structure

```
Trade ema/
├── backend/                 # Node.js/TypeScript API
│   ├── src/
│   │   ├── core/           # Core system components
│   │   ├── domain/         # Domain entities and interfaces
│   │   ├── infrastructure/ # Data persistence layer
│   │   ├── modules/        # Feature modules
│   │   └── presentation/   # Controllers and routes
│   │── package.json
│   └── tsconfig.json
├── frontend/               # React/TypeScript SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-based modules
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context providers
│   │   └── types.ts        # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
└── docs/                   # Project documentation
```

## Key Components

### Trading Orchestrator
The central component that coordinates all trading activities:
- Market data processing
- Strategy execution
- Signal generation
- Trade management
- Real-time broadcasting

### Strategy Engine
Modular strategy framework supporting:
- EMA-based trend following
- MACD oscillator analysis
- Custom strategy development
- Backtesting capabilities

### Broker Engine
Trading execution layer with:
- Paper trading simulation
- Real broker integration support
- Order management
- Risk controls

### Market Data Engine
Real-time market data processing:
- Binance WebSocket integration
- Candlestick data aggregation
- Technical indicator calculation

## Documentation Index

- [System Architecture](./system-architecture.md) - Detailed system design and component interactions
- [Database Design](./database-design.md) - Database schema and data models
- [API Documentation](./api-documentation.md) - REST API endpoints and WebSocket events
- [Deployment Guide](./deployment.md) - Production deployment instructions
- [Features Overview](./features.md) - Comprehensive feature documentation

## Development Workflow

### Code Organization
- **Modular Architecture**: Feature-based module organization
- **Clean Architecture**: Separation of concerns with clear boundaries
- **Type Safety**: Full TypeScript coverage
- **Real-time Updates**: WebSocket-based live data

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end testing for user workflows

### Security Considerations
- JWT authentication with secure secrets
- CORS protection
- SQL injection prevention
- Input validation and sanitization

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Maintain modular code structure
3. Write comprehensive tests
4. Update documentation for new features

### Git Workflow
1. Create feature branches
2. Make atomic commits
3. Write descriptive commit messages
4. Create pull requests for review

## License

This project is licensed under the ISC License.

## Support

For technical support or questions, please refer to the documentation or create an issue in the project repository.