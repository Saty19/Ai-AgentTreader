import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { StrategyBlock, BlockConnection, BlockPosition } from '../types/blocks';
import { BlockRenderer } from './BlockRenderer';
import { ConnectionRenderer } from './ConnectionRenderer';
// import { useBlockManager } from '../hooks/useBlockManager';
// import { useConnectionManager } from '../hooks/useConnectionManager';

interface StrategyCanvasProps {
  blocks: StrategyBlock[];
  connections: BlockConnection[];
  selectedBlockId?: string;
  onBlockSelect: (blockId: string) => void;
  onBlockMove: (blockId: string, position: BlockPosition) => void;
  onBlockDelete: (blockId: string) => void;
  onConnectionCreate: (connection: Omit<BlockConnection, 'id'>) => void;
  onConnectionDelete: (connectionId: string) => void;
  editable: boolean;
  zoom: number;
  panPosition: BlockPosition;
}

export const StrategyCanvas: React.FC<StrategyCanvasProps> = ({
  blocks,
  connections,
  selectedBlockId,
  onBlockSelect,
  onBlockMove,
  onBlockDelete,
  onConnectionCreate,
  onConnectionDelete,
  editable,
  zoom,
  panPosition
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<BlockPosition>({ x: 0, y: 0 });
  const [connectionStart, setConnectionStart] = useState<{
    blockId: string;
    outputId: string;
    position: BlockPosition;
  } | null>(null);

  // const { blockManager } = useBlockManager();
  // const { connectionManager } = useConnectionManager();

  // Handle block drag operations
  const handleBlockDragStart = useCallback((blockId: string, event: React.MouseEvent) => {
    if (!editable) return;
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    onBlockSelect(blockId);

    event.preventDefault();
  }, [blocks, editable, onBlockSelect]);

  const handleBlockDragMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !selectedBlockId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = (event.clientX - canvasRect.left - dragOffset.x - panPosition.x) / zoom;
    const newY = (event.clientY - canvasRect.top - dragOffset.y - panPosition.y) / zoom;

    onBlockMove(selectedBlockId, { x: newX, y: newY });
  }, [isDragging, selectedBlockId, dragOffset, panPosition, zoom, onBlockMove]);

  const handleBlockDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Handle connection creation
  const handleConnectionStart = useCallback((blockId: string, outputId: string, position: BlockPosition) => {
    if (!editable) return;
    setConnectionStart({ blockId, outputId, position });
  }, [editable]);

  const handleConnectionEnd = useCallback((blockId: string, inputId: string) => {
    if (!connectionStart || !editable) return;

    const sourceBlock = blocks.find(b => b.id === connectionStart.blockId);
    const targetBlock = blocks.find(b => b.id === blockId);
    
    if (sourceBlock && targetBlock) {
      const sourceOutput = sourceBlock.outputs.find(o => o.id === connectionStart.outputId);
      const targetInput = targetBlock.inputs.find(i => i.id === inputId);

      if (sourceOutput && targetInput) {
        onConnectionCreate({
          sourceBlockId: connectionStart.blockId,
          sourceOutput: connectionStart.outputId,
          targetBlockId: blockId,
          targetInput: inputId,
          dataType: sourceOutput.dataType
        });
      }
    }

    setConnectionStart(null);
  }, [connectionStart, blocks, editable, onConnectionCreate]);

  // Event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleBlockDragMove);
      document.addEventListener('mouseup', handleBlockDragEnd);

      return () => {
        document.removeEventListener('mousemove', handleBlockDragMove);
        document.removeEventListener('mouseup', handleBlockDragEnd);
      };
    }
  }, [isDragging, handleBlockDragMove, handleBlockDragEnd]);

  // Handle canvas click to deselect
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === canvasRef.current) {
      onBlockSelect('');
      setConnectionStart(null);
    }
  }, [onBlockSelect]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-gray-50 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})`
      }}
      onClick={handleCanvasClick}
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, gray 1px, transparent 1px)
          `,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${panPosition.x % (20 * zoom)}px ${panPosition.y % (20 * zoom)}px`
        }}
      />

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map(connection => (
          <ConnectionRenderer
            key={connection.id}
            connection={connection}
            blocks={blocks}
            onDelete={editable ? () => onConnectionDelete(connection.id) : undefined}
          />
        ))}
        
        {/* Temporary connection while dragging */}
        {connectionStart && (
          <ConnectionRenderer
            connection={{
              id: 'temp',
              sourceBlockId: connectionStart.blockId,
              sourceOutput: connectionStart.outputId,
              targetBlockId: '',
              targetInput: '',
              dataType: 'any'
            }}
            blocks={blocks}
            isTemporary
          />
        )}
      </svg>

      {/* Blocks */}
      {blocks.map(block => (
        <BlockRenderer
          key={block.id}
          block={block}
          isSelected={block.id === selectedBlockId}
          editable={editable}
          onSelect={() => onBlockSelect(block.id)}
          onDragStart={(event) => handleBlockDragStart(block.id, event)}
          onDelete={editable ? () => onBlockDelete(block.id) : undefined}
          onConnectionStart={handleConnectionStart}
          onConnectionEnd={handleConnectionEnd}
        />
      ))}

      {/* Selection overlay */}
      {selectedBlockId && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Block selection highlight */}
        </div>
      )}
    </div>
  );
};