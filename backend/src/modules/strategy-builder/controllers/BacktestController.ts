import { Request, Response } from 'express';
import { BacktestService } from '../services/BacktestService';

export class BacktestController {

  static async runBacktest(req: Request, res: Response): Promise<void> {
    try {
      const {
        strategyDefinition,
        symbol,
        timeframe,
        startDate,
        endDate,
        initialCapital = 10000,
        commission = 0.001
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!strategyDefinition || !symbol || !timeframe || !startDate || !endDate) {
        res.status(400).json({
          error: 'Strategy definition, symbol, timeframe, start date, and end date are required'
        });
        return;
      }

      // Validate date format and range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      if (start >= end) {
        res.status(400).json({ error: 'Start date must be before end date' });
        return;
      }

      // Check if the date range is reasonable (not too large)
      const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDifference > 365 * 2) { // Max 2 years
        res.status(400).json({ error: 'Date range too large. Maximum 2 years allowed.' });
        return;
      }

      // Validate initial capital and commission
      if (initialCapital <= 0) {
        res.status(400).json({ error: 'Initial capital must be positive' });
        return;
      }

      if (commission < 0 || commission > 0.1) {
        res.status(400).json({ error: 'Commission must be between 0 and 10%' });
        return;
      }

      const result = await BacktestService.runBacktest({
        strategyDefinition,
        symbol,
        timeframe,
        startDate: start,
        endDate: end,
        initialCapital,
        commission,
        userId
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error running backtest:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run backtest',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getBacktestHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id: strategyId } = req.params;
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await BacktestService.getBacktestHistory(strategyId, userId, {
        page,
        limit
      });

      if (!result) {
        res.status(404).json({ error: 'Strategy not found or access denied' });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching backtest history:', error);
      res.status(500).json({
        error: 'Failed to fetch backtest history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getBacktestResult(req: Request, res: Response): Promise<void> {
    try {
      const { id: backtestId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await BacktestService.getBacktestResult(backtestId, userId);

      if (!result) {
        res.status(404).json({ error: 'Backtest not found or access denied' });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching backtest result:', error);
      res.status(500).json({
        error: 'Failed to fetch backtest result',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async deleteBacktestResult(req: Request, res: Response): Promise<void> {
    try {
      const { id: backtestId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const success = await BacktestService.deleteBacktestResult(backtestId, userId);

      if (!success) {
        res.status(404).json({ error: 'Backtest not found or access denied' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting backtest result:', error);
      res.status(500).json({
        error: 'Failed to delete backtest result',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async compareBacktests(req: Request, res: Response): Promise<void> {
    try {
      const { backtestIds } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!Array.isArray(backtestIds) || backtestIds.length < 2 || backtestIds.length > 5) {
        res.status(400).json({
          error: 'backtestIds must be an array with 2-5 backtest IDs'
        });
        return;
      }

      const comparison = await BacktestService.compareBacktests(backtestIds, userId);

      if (!comparison) {
        res.status(404).json({ error: 'One or more backtests not found or access denied' });
        return;
      }

      res.status(200).json(comparison);
    } catch (error) {
      console.error('Error comparing backtests:', error);
      res.status(500).json({
        error: 'Failed to compare backtests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getBacktestProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id: backtestId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const progress = await BacktestService.getBacktestProgress(backtestId, userId);

      if (!progress) {
        res.status(404).json({ error: 'Backtest not found or access denied' });
        return;
      }

      res.status(200).json(progress);
    } catch (error) {
      console.error('Error fetching backtest progress:', error);
      res.status(500).json({
        error: 'Failed to fetch backtest progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async cancelBacktest(req: Request, res: Response): Promise<void> {
    try {
      const { id: backtestId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const success = await BacktestService.cancelBacktest(backtestId, userId);

      if (!success) {
        res.status(404).json({ error: 'Backtest not found or access denied' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error cancelling backtest:', error);
      res.status(500).json({
        error: 'Failed to cancel backtest',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getBacktestMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { id: backtestId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const metrics = await BacktestService.getDetailedMetrics(backtestId, userId);

      if (!metrics) {
        res.status(404).json({ error: 'Backtest not found or access denied' });
        return;
      }

      res.status(200).json(metrics);
    } catch (error) {
      console.error('Error fetching backtest metrics:', error);
      res.status(500).json({
        error: 'Failed to fetch backtest metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async exportBacktestResults(req: Request, res: Response): Promise<void> {
    try {
      const { id: backtestId } = req.params;
      const format = (req.query.format as string) || 'csv';
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!['csv', 'excel', 'json'].includes(format)) {
        res.status(400).json({ error: 'Format must be csv, excel, or json' });
        return;
      }

      const result = await BacktestService.exportResults(backtestId, userId, format as 'csv' | 'excel' | 'json');

      if (!result) {
        res.status(404).json({ error: 'Backtest not found or access denied' });
        return;
      }

      const { data, filename, mimeType } = result;

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(data);
    } catch (error) {
      console.error('Error exporting backtest results:', error);
      res.status(500).json({
        error: 'Failed to export backtest results',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}