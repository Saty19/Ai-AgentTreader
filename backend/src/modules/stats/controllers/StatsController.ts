import { Request, Response } from 'express';
import { IStatsRepository } from '../../../domain/interfaces';

export class StatsController {
  constructor(private statsRepo: IStatsRepository) {}

  getStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.statsRepo.get();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
}
