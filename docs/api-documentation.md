# API Documentation

## Overview

The Trade EMA API provides RESTful endpoints for managing trading operations, user authentication, and real-time market data. The API uses JSON for data exchange and supports WebSocket connections for real-time updates.

## Base Configuration

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer tokens

## Authentication

### POST /api/auth/login

**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Status Codes**:
- `200`: Success
- `401`: Invalid credentials
- `400`: Invalid request data

### POST /api/auth/register

**Description**: Create new user account

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response**:
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

**Status Codes**:
- `201`: User created successfully
- `400`: Invalid request data
- `409`: Email already exists

### POST /api/auth/logout

**Description**: Invalidate JWT token (client-side implementation)

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

## Trades

### GET /api/trades

**Description**: Retrieve trade history with optional filtering

**Query Parameters**:
- `symbol` (optional): Filter by trading pair (e.g., 'BTCUSDT')
- `result` (optional): Filter by result ('WIN', 'LOSS', 'OPEN')
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)
- `startTime` (optional): Unix timestamp for start date
- `endTime` (optional): Unix timestamp for end date

**Request Example**:
```
GET /api/trades?symbol=BTCUSDT&limit=10&result=OPEN
```

**Response**:
```json
{
  "trades": [
    {
      "id": 123,
      "symbol": "BTCUSDT",
      "side": "BUY",
      "entryPrice": 45000.50,
      "exitPrice": null,
      "sl": 44500.00,
      "tp": 46000.00,
      "pnl": null,
      "result": "OPEN",
      "entryTime": 1640995200000,
      "exitTime": null,
      "userId": 1,
      "strategyId": 2
    }
  ],
  "total": 1,
  "hasMore": false
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `400`: Invalid query parameters

### GET /api/trades/:id

**Description**: Retrieve specific trade by ID

**Request Example**:
```
GET /api/trades/123
```

**Response**:
```json
{
  "id": 123,
  "symbol": "BTCUSDT",
  "side": "BUY",
  "entryPrice": 45000.50,
  "exitPrice": 45500.00,
  "sl": 44500.00,
  "tp": 46000.00,
  "pnl": 500.00,
  "result": "WIN",
  "entryTime": 1640995200000,
  "exitTime": 1641995400000,
  "userId": 1,
  "strategyId": 2
}
```

**Status Codes**:
- `200`: Success
- `404`: Trade not found
- `401`: Unauthorized

### POST /api/trades

**Description**: Manually create a new trade (for testing/admin)

**Request Body**:
```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "entryPrice": 45000.50,
  "sl": 44500.00,
  "tp": 46000.00,
  "strategyId": 1
}
```

**Response**:
```json
{
  "id": 124,
  "symbol": "BTCUSDT",
  "side": "BUY",
  "entryPrice": 45000.50,
  "sl": 44500.00,
  "tp": 46000.00,
  "result": "OPEN",
  "entryTime": 1640995200000,
  "strategyId": 1
}
```

**Status Codes**:
- `201`: Trade created
- `400`: Invalid trade data
- `401`: Unauthorized

### PUT /api/trades/:id/close

**Description**: Manually close an open trade

**Request Body**:
```json
{
  "exitPrice": 45500.00,
  "reason": "manual_close"
}
```

**Response**:
```json
{
  "id": 123,
  "exitPrice": 45500.00,
  "pnl": 500.00,
  "result": "WIN",
  "exitTime": 1641995400000
}
```

**Status Codes**:
- `200`: Trade closed
- `404`: Trade not found
- `400`: Invalid close data
- `401`: Unauthorized

## Signals

### GET /api/signals

**Description**: Retrieve trading signals history

**Query Parameters**:
- `symbol` (optional): Filter by trading pair
- `side` (optional): Filter by signal side ('BUY', 'SELL')
- `limit` (optional): Number of records (default: 100)
- `offset` (optional): Number of records to skip
- `startTime` (optional): Unix timestamp for start date
- `endTime` (optional): Unix timestamp for end date

**Response**:
```json
{
  "signals": [
    {
      "id": 456,
      "symbol": "BTCUSDT",
      "side": "BUY",
      "price": 45000.50,
      "time": 1640995200000,
      "reason": "EMA alignment with bullish momentum",
      "ema5": 45050.25,
      "ema26": 44800.30,
      "ema150": 43500.80,
      "angle": 45.2,
      "userId": 1,
      "strategyId": 1
    }
  ],
  "total": 1,
  "hasMore": false
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

### GET /api/signals/:id

**Description**: Retrieve specific signal by ID

**Response**:
```json
{
  "id": 456,
  "symbol": "BTCUSDT",
  "side": "BUY",
  "price": 45000.50,
  "time": 1640995200000,
  "reason": "EMA alignment with bullish momentum",
  "ema5": 45050.25,
  "ema26": 44800.30,
  "ema150": 43500.80,
  "angle": 45.2,
  "userId": 1,
  "strategyId": 1
}
```

**Status Codes**:
- `200`: Success
- `404`: Signal not found
- `401`: Unauthorized

## Statistics

### GET /api/stats

**Description**: Retrieve trading performance statistics

**Response**:
```json
{
  "totalTrades": 150,
  "wins": 89,
  "losses": 61,
  "winRate": 59.33,
  "profitFactor": 1.45,
  "drawdown": 8.75,
  "netPnl": 2750.50,
  "updatedAt": 1640995200000
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

### GET /api/stats/summary

**Description**: Retrieve detailed performance summary

**Response**:
```json
{
  "overview": {
    "totalTrades": 150,
    "wins": 89,
    "losses": 61,
    "winRate": 59.33,
    "profitFactor": 1.45,
    "netPnl": 2750.50
  },
  "monthly": [
    {
      "month": "2024-01",
      "trades": 25,
      "wins": 15,
      "pnl": 450.25
    }
  ],
  "byStrategy": [
    {
      "strategyId": 1,
      "name": "EMA Trend",
      "trades": 100,
      "wins": 60,
      "pnl": 1800.30
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

## Strategies

### GET /api/strategies

**Description**: Retrieve available trading strategies

**Response**:
```json
{
  "strategies": [
    {
      "id": 1,
      "name": "EMA Trend Follower",
      "description": "Original strategy using EMA 5/26/150 alignment and angle",
      "isActive": true,
      "parameters": {
        "ema5Period": 5,
        "ema26Period": 26,
        "ema150Period": 150,
        "minAngle": 40
      }
    },
    {
      "id": 2,
      "name": "MACD Strategy",
      "description": "MACD oscillator with signal line crossovers",
      "isActive": false,
      "parameters": {
        "fastPeriod": 12,
        "slowPeriod": 26,
        "signalPeriod": 9
      }
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

### POST /api/strategies/:id/start

**Description**: Start a specific trading strategy

**Response**:
```json
{
  "message": "Strategy 'EMA Trend Follower' started successfully",
  "strategyId": 1,
  "status": "active"
}
```

**Status Codes**:
- `200`: Strategy started
- `404`: Strategy not found
- `400`: Strategy already running
- `401`: Unauthorized

### POST /api/strategies/:id/stop

**Description**: Stop a running trading strategy

**Response**:
```json
{
  "message": "Strategy 'EMA Trend Follower' stopped successfully",
  "strategyId": 1,
  "status": "inactive"
}
```

**Status Codes**:
- `200`: Strategy stopped
- `404`: Strategy not found
- `400`: Strategy not running
- `401`: Unauthorized

### PUT /api/strategies/:id/parameters

**Description**: Update strategy parameters

**Request Body**:
```json
{
  "parameters": {
    "ema5Period": 5,
    "ema26Period": 26,
    "ema150Period": 150,
    "minAngle": 35
  }
}
```

**Response**:
```json
{
  "message": "Strategy parameters updated successfully",
  "strategyId": 1,
  "parameters": {
    "ema5Period": 5,
    "ema26Period": 26,
    "ema150Period": 150,
    "minAngle": 35
  }
}
```

**Status Codes**:
- `200`: Parameters updated
- `404`: Strategy not found
- `400`: Invalid parameters
- `401`: Unauthorized

## Market Data

### GET /api/market/candles

**Description**: Retrieve historical candlestick data

**Query Parameters**:
- `symbol`: Trading pair (required)
- `interval`: Time interval ('1m', '5m', '1h', '1d')
- `limit`: Number of candles (max 1000, default 100)
- `startTime` (optional): Start timestamp
- `endTime` (optional): End timestamp

**Request Example**:
```
GET /api/market/candles?symbol=BTCUSDT&interval=1h&limit=24
```

**Response**:
```json
{
  "symbol": "BTCUSDT",
  "interval": "1h",
  "candles": [
    {
      "time": 1640995200000,
      "open": 45000.00,
      "high": 45200.50,
      "low": 44800.25,
      "close": 45100.75,
      "volume": 125.45,
      "isClosed": true
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid parameters

### GET /api/market/current

**Description**: Get current market price for symbol

**Query Parameters**:
- `symbol`: Trading pair (required)

**Response**:
```json
{
  "symbol": "BTCUSDT",
  "price": 45100.75,
  "time": 1640995200000,
  "volume24h": 15420.50,
  "change24h": 2.35
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid symbol

## WebSocket Events

### Connection

**Endpoint**: `ws://localhost:3000`

**Authentication**: Include JWT token in connection query
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Client Events (Listen)

#### price_update
**Description**: Real-time price updates for current symbol

**Payload**:
```json
{
  "symbol": "BTCUSDT",
  "time": 1640995200000,
  "open": 45000.00,
  "high": 45200.50,
  "low": 44800.25,
  "close": 45100.75,
  "volume": 125.45,
  "isClosed": false
}
```

#### signal
**Description**: New trading signal generated

**Payload**:
```json
{
  "id": 456,
  "symbol": "BTCUSDT",
  "side": "BUY",
  "price": 45100.75,
  "time": 1640995200000,
  "reason": "EMA alignment with bullish momentum",
  "ema5": 45150.25,
  "ema26": 44900.30,
  "ema150": 43600.80,
  "angle": 45.2
}
```

#### trade_open
**Description**: New trade position opened

**Payload**:
```json
{
  "id": 123,
  "symbol": "BTCUSDT",
  "side": "BUY",
  "entryPrice": 45100.75,
  "sl": 44600.00,
  "tp": 46100.00,
  "result": "OPEN",
  "entryTime": 1640995200000,
  "strategyId": 1
}
```

#### trade_close
**Description**: Trade position closed

**Payload**:
```json
{
  "id": 123,
  "symbol": "BTCUSDT",
  "side": "BUY",
  "entryPrice": 45100.75,
  "exitPrice": 45600.25,
  "sl": 44600.00,
  "tp": 46100.00,
  "pnl": 499.50,
  "result": "WIN",
  "entryTime": 1640995200000,
  "exitTime": 1641000000000,
  "strategyId": 1
}
```

#### stats_update
**Description**: Updated trading statistics

**Payload**:
```json
{
  "totalTrades": 151,
  "wins": 90,
  "losses": 61,
  "winRate": 59.60,
  "profitFactor": 1.46,
  "drawdown": 8.75,
  "netPnl": 3250.00
}
```

#### error
**Description**: Error notifications

**Payload**:
```json
{
  "type": "EXECUTION_ERROR",
  "message": "Failed to execute trade: Insufficient balance",
  "code": "INSUFFICIENT_BALANCE",
  "timestamp": 1640995200000
}
```

### Server Events (Emit)

#### subscribe_symbol
**Description**: Subscribe to price updates for specific symbol

**Payload**:
```json
{
  "symbol": "BTCUSDT"
}
```

#### unsubscribe_symbol
**Description**: Unsubscribe from price updates

**Payload**:
```json
{
  "symbol": "BTCUSDT"
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context"
    },
    "timestamp": 1640995200000
  }
}
```

### Common Error Codes

- `AUTHENTICATION_FAILED`: Invalid or expired JWT token
- `VALIDATION_ERROR`: Request data validation failed
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `INSUFFICIENT_BALANCE`: Not enough funds for operation
- `STRATEGY_NOT_RUNNING`: Attempted operation on inactive strategy
- `MARKET_CLOSED`: Trading operation during non-market hours
- `RATE_LIMIT_EXCEEDED`: Too many requests from client
- `INTERNAL_SERVER_ERROR`: Unexpected server error

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error
- `502`: Bad Gateway
- `503`: Service Unavailable

## Rate Limiting

### Current Limits
- **API Requests**: 100 requests per minute per IP
- **WebSocket Connections**: 10 concurrent connections per user
- **Data Queries**: 1000 records maximum per request

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995260
```

## API Versioning

### Current Version
- API Version: `v1`
- Base Path: `/api/v1` (planned)
- Current Path: `/api` (legacy)

### Version Headers
```
Accept: application/vnd.tradeema.v1+json
API-Version: v1
```

## Testing

### Example cURL Commands

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

#### Get Trades
```bash
curl -X GET http://localhost:3000/api/trades \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Subscribe to WebSocket
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('price_update', (data) => {
  console.log('Price Update:', data);
});
```

## Postman Collection

A Postman collection with all API endpoints is available for testing. Import the collection and set the following environment variables:

- `base_url`: http://localhost:3000
- `jwt_token`: Your authentication token

## SDK Examples

### JavaScript SDK Usage
```javascript
import { TradeEMAClient } from 'trade-ema-sdk';

const client = new TradeEMAClient({
  baseURL: 'http://localhost:3000',
  apiKey: 'your_jwt_token'
});

// Get recent trades
const trades = await client.trades.getAll({ limit: 10 });

// Subscribe to real-time updates
client.on('price_update', (data) => {
  console.log('Price update:', data);
});
```

### Python SDK Usage
```python
from trade_ema import TradeEMAClient

client = TradeEMAClient(
    base_url='http://localhost:3000',
    api_key='your_jwt_token'
)

# Get trading statistics
stats = client.stats.get()
print(f"Win Rate: {stats['winRate']}%")

# Listen for signals
@client.on('signal')
def handle_signal(signal):
    print(f"New signal: {signal['side']} {signal['symbol']}")
```