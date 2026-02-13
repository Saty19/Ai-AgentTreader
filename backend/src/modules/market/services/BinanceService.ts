import WebSocket from 'ws';
import { Candle } from '../../../domain/entities';

export class BinanceService {
  private ws: WebSocket | null = null;
  private onCandleCallback: ((candle: Candle) => void) | null = null;
  private symbol: string;
  private interval: string;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(symbol: string = 'btcusdt', interval: string = '1m') {
    this.symbol = symbol.toLowerCase();
    this.interval = interval;
  }

  public setDataCallback(callback: (candle: Candle) => void) {
    this.onCandleCallback = callback;
  }

  public start() {
    const url = `wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`;
    console.log(`Connecting to Binance WebSocket: ${url}`);

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('Connected to Binance WebSocket');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.e === 'kline') {
          const k = message.k;
          const candle: Candle = {
            symbol: this.symbol,
            time: Math.floor(k.t / 1000), // Convert to seconds
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
            isClosed: k.x
          };
          
          if (this.onCandleCallback) {
            this.onCandleCallback(candle);
          }
        }
      } catch (error) {
        console.error('Error parsing Binance message:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('Binance WebSocket closed. Reconnecting in 5s...');
      this.reconnectTimer = setTimeout(() => this.start(), 5000);
    });

    this.ws.on('error', (error) => {
      console.error('Binance WebSocket error:', error);
      this.ws?.close();
    });
  }

  public stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }
  }

  public async getHistoricalCandles(symbol: string, interval: string, limit: number = 1000): Promise<Candle[]> {
    try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
        console.log(`Fetching historical candles from: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Binance API Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Map Binance format [time, open, high, low, close, volume, ...] to Candle
        return data.map((k: any) => ({
            symbol: symbol.toLowerCase(),
            time: Math.floor(k[0] / 1000), // Time
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            isClosed: true
        }));

    } catch (error) {
        console.error('Error fetching historical candles:', error);
        return [];
    }
  }
}
