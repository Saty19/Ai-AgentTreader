// Export all block templates organized by category
export { IndicatorBlocks } from './IndicatorBlocks';
export { InputBlocks } from './InputBlocks';
export { LogicBlocks } from './LogicBlocks';
export { ActionBlocks } from './ActionBlocks';
export { OutputBlocks } from './OutputBlocks';

import { IndicatorBlocks } from './IndicatorBlocks';
import { InputBlocks } from './InputBlocks';
import { LogicBlocks } from './LogicBlocks';
import { ActionBlocks } from './ActionBlocks';
import { OutputBlocks } from './OutputBlocks';

import type { BlockTemplate } from '../types/blocks';
import { BlockCategory } from '../types/blocks';

// Combine all block templates
export const AllBlockTemplates: BlockTemplate[] = [
  ...IndicatorBlocks,
  ...InputBlocks,
  ...LogicBlocks,
  ...ActionBlocks,
  ...OutputBlocks
];

// Get block templates by category
export const getBlockTemplatesByCategory = (category: BlockCategory): BlockTemplate[] => {
  switch (category) {
    case BlockCategory.INDICATORS:
      return IndicatorBlocks;
    case BlockCategory.INPUT:
      return InputBlocks;
    case BlockCategory.LOGIC:
      return LogicBlocks;
    case BlockCategory.ACTIONS:
      return ActionBlocks;
    case BlockCategory.OUTPUTS:
      return OutputBlocks;
    case BlockCategory.MATH:
      return LogicBlocks.filter(block => 
        block.type.toString().includes('ARITHMETIC') || 
        block.type.toString().includes('MATH')
      );
    case BlockCategory.CUSTOM:
      return []; // Custom blocks would be loaded separately
    default:
      return [];
  }
};

// Get block template by type
export const getBlockTemplateByType = (type: string): BlockTemplate | undefined => {
  return AllBlockTemplates.find(template => template.type.toString() === type);
};

// Get available block categories
export const getAvailableCategories = (): BlockCategory[] => {
  return [
    BlockCategory.INPUT,
    BlockCategory.INDICATORS,
    BlockCategory.LOGIC,
    BlockCategory.MATH,
    BlockCategory.ACTIONS,
    BlockCategory.OUTPUTS
  ];
};

// Search block templates
export const searchBlockTemplates = (searchTerm: string): BlockTemplate[] => {
  const term = searchTerm.toLowerCase();
  return AllBlockTemplates.filter(template =>
    template.name.toLowerCase().includes(term) ||
    template.description.toLowerCase().includes(term) ||
    template.type.toString().toLowerCase().includes(term)
  );
};

// Export default block configurations for common strategies
export const DefaultBlockConfigs = {
  // Simple moving average crossover strategy blocks
  MA_CROSSOVER: [
    {
      templateType: 'MARKET_DATA',
      position: { x: 100, y: 100 },
      properties: { symbol: 'BTCUSD', timeframe: '1h' }
    },
    {
      templateType: 'SMA',
      position: { x: 350, y: 50 },
      properties: { period: 20 }
    },
    {
      templateType: 'SMA',
      position: { x: 350, y: 150 },
      properties: { period: 50 }
    },
    {
      templateType: 'COMPARISON',
      position: { x: 600, y: 100 },
      properties: { operator: 'crosses_above' }
    },
    {
      templateType: 'BUY_ORDER',
      position: { x: 850, y: 100 },
      properties: { orderType: 'market', quantity: 1 }
    }
  ],

  // RSI reversal strategy blocks
  RSI_REVERSAL: [
    {
      templateType: 'MARKET_DATA',
      position: { x: 100, y: 100 },
      properties: { symbol: 'ETHUSD', timeframe: '4h' }
    },
    {
      templateType: 'RSI',
      position: { x: 350, y: 100 },
      properties: { period: 14 }
    },
    {
      templateType: 'COMPARISON',
      position: { x: 600, y: 50 },
      properties: { operator: '<' }
    },
    {
      templateType: 'PARAMETER',
      position: { x: 450, y: 50 },
      properties: { parameterName: 'RSI_OVERSOLD', dataType: 'number', defaultValue: '30' }
    },
    {
      templateType: 'BUY_ORDER',
      position: { x: 850, y: 50 },
      properties: { orderType: 'market', quantity: 1 }
    }
  ],

  // Basic bollinger bands strategy
  BOLLINGER_BANDS: [
    {
      templateType: 'MARKET_DATA',
      position: { x: 100, y: 100 },
      properties: { symbol: 'SPY', timeframe: '1d' }
    },
    {
      templateType: 'BOLLINGER_BANDS',
      position: { x: 350, y: 100 },
      properties: { period: 20, standardDeviation: 2 }
    },
    {
      templateType: 'COMPARISON',
      position: { x: 600, y: 50 },
      properties: { operator: '<' }
    },
    {
      templateType: 'COMPARISON',
      position: { x: 600, y: 150 },
      properties: { operator: '>' }
    },
    {
      templateType: 'BUY_ORDER',
      position: { x: 850, y: 50 },
      properties: { orderType: 'limit', quantity: 1 }
    },
    {
      templateType: 'SELL_ORDER',
      position: { x: 850, y: 150 },
      properties: { orderType: 'limit', quantity: 1 }
    }
  ]
};

// Utility functions for block management
export const validateBlockTemplate = (template: BlockTemplate): boolean => {
  return !!(
    template.type &&
    template.category &&
    template.name &&
    template.description &&
    template.defaultSize &&
    template.inputs &&
    template.outputs &&
    template.properties
  );
};

export const createBlockFromTemplate = (template: BlockTemplate): any => {
  // This would typically be handled by the BlockService
  console.log('Creating block from template:', template.name);
  return template;
};