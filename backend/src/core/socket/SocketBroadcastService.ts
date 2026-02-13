import { Server } from 'socket.io';

export class SocketBroadcastService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  emitPriceUpdate(candle: any) {
    this.io.emit('price_update', candle);
  }

  emitIndicatorUpdate(indicators: any) {
    this.io.emit('indicator_update', indicators);
  }

  emitSignal(signal: any) {
    this.io.emit('signal', signal);
  }

  emitTradeOpen(trade: any) {
    this.io.emit('trade_open', trade);
  }

  emitTradeClose(trade: any) {
    this.io.emit('trade_close', trade);
  }

  emitStatsUpdate(stats: any) {
    this.io.emit('stats_update', stats);
  }
}
