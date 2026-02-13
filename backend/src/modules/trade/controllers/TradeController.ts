import { Request, Response } from 'express';
import { ITradeRepository, IStatsRepository } from '../../../domain/interfaces';

export class TradeController {
  constructor(
    private tradeRepo: ITradeRepository,
    private statsRepo: IStatsRepository
  ) {}

  getAllTrades = async (req: Request, res: Response) => {
    try {
      const trades = await this.tradeRepo.getAll();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  }

  getStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.statsRepo.get();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
}
