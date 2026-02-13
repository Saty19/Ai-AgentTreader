import React, { useState, useMemo } from 'react';
import type { BlockTemplate } from '../types/blocks';
import { BlockCategory, BlockType } from '../types/blocks';
// import { Card } from '../../../components/atoms/Card';
import { Input } from '../../../components/atoms/Input';
import { Button } from '../../../components/atoms/Button';

interface ComponentPaletteProps {
  blockTemplates: BlockTemplate[];
  onBlockDragStart: (template: BlockTemplate, event: React.DragEvent) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  blockTemplates,
  onBlockDragStart,
  collapsed = false,
  onToggleCollapse
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['indicators', 'logic', 'actions'])
  );

  // Group blocks by category
  const categorizedBlocks = useMemo(() => {
    const filtered = blockTemplates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce((acc, template) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {} as Record<string, BlockTemplate[]>);
  }, [blockTemplates, searchTerm]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryIcon = (category: BlockCategory) => {
    switch (category) {
      case BlockCategory.INPUT:
        return '📥';
      case BlockCategory.INDICATORS:
        return '📊';
      case BlockCategory.LOGIC:
        return '🔄';
      case BlockCategory.MATH:
        return '🧮';
      case BlockCategory.ACTIONS:
        return '⚡';
      case BlockCategory.OUTPUTS:
        return '📤';
      case BlockCategory.CUSTOM:
        return '🔧';
      default:
        return '📦';
    }
  };

  /* 
  const getCategoryColor = (category: BlockCategory) => {
    switch (category) {
      case BlockCategory.INPUT:
        return 'bg-blue-50 border-blue-200';
      case BlockCategory.INDICATORS:
        return 'bg-green-50 border-green-200';
      case BlockCategory.LOGIC:
        return 'bg-yellow-50 border-yellow-200';
      case BlockCategory.MATH:
        return 'bg-purple-50 border-purple-200';
      case BlockCategory.ACTIONS:
        return 'bg-red-50 border-red-200';
      case BlockCategory.OUTPUTS:
        return 'bg-gray-50 border-gray-200';
      case BlockCategory.CUSTOM:
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-white border-gray-200';
    }
  };
  */

  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      // Input blocks
      case BlockType.MARKET_DATA: return '💹';
      case BlockType.PARAMETER: return '⚙️';
      case BlockType.TIME_CONDITION: return '⏰';
      
      // Indicator blocks
      case BlockType.EMA: return '📈';
      case BlockType.SMA: return '📊';
      case BlockType.MACD: return '〰️';
      case BlockType.RSI: return '📉';
      case BlockType.BOLLINGER_BANDS: return '🎯';
      case BlockType.STOCHASTIC: return '↕️';
      
      // Logic blocks
      case BlockType.COMPARISON: return '≡';
      case BlockType.LOGICAL_AND: return '∧';
      case BlockType.LOGICAL_OR: return '∨';
      case BlockType.LOGICAL_NOT: return '¬';
      case BlockType.CONDITIONAL: return '❓';
      
      // Math blocks
      case BlockType.ARITHMETIC: return '➕';
      case BlockType.MATH_FUNCTION: return 'ƒ';
      
      // Action blocks
      case BlockType.BUY_ORDER: return '🟢';
      case BlockType.SELL_ORDER: return '🔴';
      case BlockType.CLOSE_POSITION: return '⏹️';
      case BlockType.STOP_LOSS: return '🛑';
      case BlockType.TAKE_PROFIT: return '✅';
      case BlockType.NOTIFICATION: return '🔔';
      
      // Output blocks
      case BlockType.SIGNAL_OUTPUT: return '📡';
      case BlockType.LOG_OUTPUT: return '📝';
      
      default: return '📦';
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 shadow-lg">
        <Button
          onClick={onToggleCollapse}
          className="w-full h-12 border-none bg-transparent p-2"
          title="Expand Component Palette"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18l6-6-6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Components</h3>
        <Button
          onClick={onToggleCollapse}
          className="p-1 border-none bg-transparent"
          title="Collapse Component Palette"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>

      {/* Search */}
      <div className="p-4">
        <Input
          type="text"
          placeholder="Search blocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Block Categories */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(categorizedBlocks).map(([category, templates]) => (
          <div key={category} className="mb-2">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <span className="mr-2 text-lg">{getCategoryIcon(category as BlockCategory)}</span>
                <span className="font-medium capitalize">{category}</span>
                <span className="ml-2 text-sm text-gray-500">({templates.length})</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${
                  expandedCategories.has(category) ? 'rotate-180' : ''
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M6 9l6 6 6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Category Blocks */}
            {expandedCategories.has(category) && (
              <div className="bg-white">
                {templates.map((template) => (
                  <div
                    key={template.type}
                    draggable
                    onDragStart={(e) => onBlockDragStart(template, e)}
                    className="p-3 border-b border-gray-100 cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start">
                      <span className="mr-3 text-xl flex-shrink-0">
                        {getBlockIcon(template.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {template.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        {/* Inputs/Outputs info */}
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <span>📥 {template.inputs.length}</span>
                          <span className="mx-2">•</span>
                          <span>📤 {template.outputs.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer with tips */}
      <div className="p-4 bg-blue-50 border-t border-gray-200 text-xs text-blue-600">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Drag blocks to the canvas to start building your strategy!</p>
      </div>
    </div>
  );
};