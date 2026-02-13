import React, { useCallback, useState } from 'react';
import type { StrategyBlock, BlockPosition } from '../types/blocks';
import { Card } from '../../../components/atoms/Card';

interface BlockRendererProps {
  block: StrategyBlock;
  isSelected: boolean;
  editable: boolean;
  onSelect: () => void;
  onDragStart: (event: React.MouseEvent) => void;
  onDelete?: () => void;
  onConnectionStart: (blockId: string, outputId: string, position: BlockPosition) => void;
  onConnectionEnd: (blockId: string, inputId: string) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  isSelected,
  editable,
  onSelect,
  onDragStart,
  onDelete,
  onConnectionStart,
  onConnectionEnd
}) => {
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);

  const getBlockCategoryColor = (category: string) => {
    switch (category) {
      case 'input': return 'border-blue-500 bg-blue-50';
      case 'indicators': return 'border-green-500 bg-green-50';
      case 'logic': return 'border-yellow-500 bg-yellow-50';
      case 'math': return 'border-purple-500 bg-purple-50';
      case 'actions': return 'border-red-500 bg-red-50';
      case 'outputs': return 'border-gray-500 bg-gray-50';
      case 'custom': return 'border-indigo-500 bg-indigo-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const handleOutputMouseDown = useCallback((outputId: string, event: React.MouseEvent) => {
    if (!editable) return;
    event.stopPropagation();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    onConnectionStart(block.id, outputId, position);
    setIsDraggingConnection(true);
  }, [block.id, editable, onConnectionStart]);

  const handleInputMouseUp = useCallback((inputId: string, event: React.MouseEvent) => {
    if (!isDraggingConnection || !editable) return;
    event.stopPropagation();
    
    onConnectionEnd(block.id, inputId);
    setIsDraggingConnection(false);
  }, [block.id, editable, isDraggingConnection, onConnectionEnd]);

  const handleBlockClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect();
  }, [onSelect]);

  const handleDeleteClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.();
  }, [onDelete]);

  return (
    <div
      className={`absolute select-none cursor-pointer transition-all duration-200 ${
        isSelected ? 'z-20 scale-105' : 'z-10'
      }`}
      style={{
        left: block.position.x,
        top: block.position.y,
        width: block.size.width,
        height: block.size.height
      }}
      onClick={handleBlockClick}
      onMouseDown={onDragStart}
    >
      <Card 
        className={`
          w-full h-full border-2 transition-all duration-200 shadow-lg
          ${getBlockCategoryColor(block.category)}
          ${isSelected ? 'ring-2 ring-blue-400 shadow-xl' : 'hover:shadow-xl'}
          ${editable ? 'cursor-move' : 'cursor-pointer'}
        `}
      >
        {/* Block Header */}
        <div className="flex justify-between items-center p-2 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{block.name}</h4>
            <p className="text-xs text-gray-500 truncate">{block.type}</p>
          </div>
          
          {editable && onDelete && (
            <button
              onClick={handleDeleteClick}
              className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              title="Delete block"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Block Content */}
        <div className="flex flex-col p-2 flex-1">
          {/* Inputs */}
          {block.inputs.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-600 mb-1">Inputs</div>
              {block.inputs.map((input) => (
                <div
                  key={input.id}
                  className="flex items-center mb-1"
                  onMouseUp={(e) => handleInputMouseUp(input.id, e)}
                >
                  <div className="w-3 h-3 border-2 border-gray-400 rounded-full bg-white cursor-crosshair hover:border-blue-500 transition-colors"></div>
                  <span className="ml-2 text-xs text-gray-700 truncate">{input.name}</span>
                  {input.required && <span className="ml-1 text-red-500">*</span>}
                </div>
              ))}
            </div>
          )}

          {/* Properties Preview */}
          {block.properties.length > 0 && (
            <div className="mb-2 text-xs text-gray-600">
              {block.properties.slice(0, 2).map(prop => (
                <div key={prop.id} className="truncate">
                  {prop.name}: {prop.value}
                </div>
              ))}
              {block.properties.length > 2 && (
                <div className="text-gray-400">+{block.properties.length - 2} more</div>
              )}
            </div>
          )}

          {/* Outputs */}
          {block.outputs.length > 0 && (
            <div className="mt-auto">
              <div className="text-xs font-medium text-gray-600 mb-1">Outputs</div>
              {block.outputs.map((output) => (
                <div
                  key={output.id}
                  className="flex items-center justify-end mb-1"
                >
                  <span className="mr-2 text-xs text-gray-700 truncate">{output.name}</span>
                  <div
                    className="w-3 h-3 border-2 border-gray-400 rounded-full bg-white cursor-crosshair hover:border-green-500 transition-colors"
                    onMouseDown={(e) => handleOutputMouseDown(output.id, e)}
                  ></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connection indicators */}
        {isSelected && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -inset-1 border-2 border-blue-400 rounded-lg animate-pulse"></div>
          </div>
        )}
      </Card>
    </div>
  );
};