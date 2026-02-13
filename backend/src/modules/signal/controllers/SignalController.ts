import { Request, Response } from 'express';
import { ISignalRepository } from '../../../domain/interfaces';

export class SignalController {
  constructor(private signalRepo: ISignalRepository) {}

  getLatestSignals = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const signals = await this.signalRepo.getLatest(limit);
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch signals' });
    }
  }
}
