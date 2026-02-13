import { Request, Response } from 'express';
import { BinanceService } from '../services/BinanceService';

export class MarketController {
    private binanceService: BinanceService;

    constructor() {
        this.binanceService = new BinanceService();
    }

    public getCandles = async (req: Request, res: Response) => {
        try {
            const { symbol, interval, limit } = req.query;
            
            const candles = await this.binanceService.getHistoricalCandles(
                (symbol as string) || 'btcusdt',
                (interval as string) || '1m',
                limit ? parseInt(limit as string) : 1000
            );
            
            res.json(candles);
        } catch (error) {
            console.error('Error in getCandles:', error);
            res.status(500).json({ error: 'Failed to fetch candles' });
        }
    }
}
