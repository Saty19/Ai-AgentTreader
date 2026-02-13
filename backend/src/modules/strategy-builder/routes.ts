import express from 'express';
import { StrategyBuilderController } from './controllers/StrategyBuilderController';
import { BlockController } from './controllers/BlockController';
import { TemplateController } from './controllers/TemplateController';
import { BacktestController } from './controllers/BacktestController';

const router = express.Router();

// Strategy Management Routes
router.get('/strategies', StrategyBuilderController.getStrategies);
router.get('/strategies/:id', StrategyBuilderController.getStrategy);
router.post('/strategies', StrategyBuilderController.createStrategy);
router.put('/strategies/:id', StrategyBuilderController.updateStrategy);
router.delete('/strategies/:id', StrategyBuilderController.deleteStrategy);
router.post('/strategies/:id/duplicate', StrategyBuilderController.duplicateStrategy);

// Strategy Validation & Compilation Routes
router.post('/validate', StrategyBuilderController.validateStrategy);
router.post('/compile', StrategyBuilderController.compileStrategy);

// Strategy Deployment Routes
router.post('/strategies/:id/deploy', StrategyBuilderController.deployStrategy);
router.post('/strategies/:id/stop', StrategyBuilderController.stopStrategy);
router.get('/strategies/:id/status', StrategyBuilderController.getStrategyStatus);

// Strategy Sharing Routes
router.post('/strategies/:id/share', StrategyBuilderController.shareStrategy);
router.post('/strategies/import', StrategyBuilderController.importStrategy);

// Export/Import Routes
router.get('/strategies/:id/export', StrategyBuilderController.exportStrategy);
router.post('/strategies/import-file', StrategyBuilderController.importStrategyFile);

// Block Management Routes
router.get('/blocks', BlockController.getAvailableBlocks);
router.post('/blocks', BlockController.createCustomBlock);
router.put('/blocks/:id', BlockController.updateCustomBlock);
router.delete('/blocks/:id', BlockController.deleteCustomBlock);
router.get('/blocks/custom', BlockController.getCustomBlocks);
router.get('/blocks/custom/:id', BlockController.getCustomBlock);
router.post('/blocks/:id/test', BlockController.testCustomBlock);

// Template Management Routes
router.get('/templates', TemplateController.getStrategyTemplates);
router.get('/templates/:id', TemplateController.getStrategyTemplate);
router.post('/templates', TemplateController.createStrategyTemplate);
router.put('/templates/:id', TemplateController.updateStrategyTemplate);
router.delete('/templates/:id', TemplateController.deleteStrategyTemplate);
router.post('/templates/:id/clone', TemplateController.cloneTemplate);
router.get('/templates/categories/all', TemplateController.getTemplateCategories);
router.get('/templates/popular/top', TemplateController.getPopularTemplates);
router.get('/templates/featured/top', TemplateController.getFeaturedTemplates);
router.post('/templates/:id/rate', TemplateController.rateTemplate);

// Backtesting Routes
router.post('/backtest', BacktestController.runBacktest);
router.get('/strategies/:id/backtests', BacktestController.getBacktestHistory);
router.get('/backtests/:id', BacktestController.getBacktestResult);
router.delete('/backtests/:id', BacktestController.deleteBacktestResult);
router.post('/backtests/compare', BacktestController.compareBacktests);
router.get('/backtests/:id/progress', BacktestController.getBacktestProgress);
router.post('/backtests/:id/cancel', BacktestController.cancelBacktest);
router.get('/backtests/:id/metrics', BacktestController.getBacktestMetrics);
router.get('/backtests/:id/export', BacktestController.exportBacktestResults);

export { router as strategyBuilderRoutes };