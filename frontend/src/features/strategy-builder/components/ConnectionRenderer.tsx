import React, { useMemo } from 'react';
import type { BlockConnection, StrategyBlock } from '../types/blocks';

interface ConnectionRendererProps {
  connection: BlockConnection;
  blocks: StrategyBlock[];
  isTemporary?: boolean;
  onDelete?: () => void;
}

export const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
  connection,
  blocks,
  isTemporary = false,
  onDelete
}) => {
  const connectionPath = useMemo(() => {
    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);

    if (!sourceBlock || (!targetBlock && !isTemporary)) {
      return null;
    }

    // Calculate source position (output connector)
    // const sourceOutput = sourceBlock.outputs.find(o => o.id === connection.sourceOutput);
    const sourceOutputIndex = sourceBlock.outputs.findIndex(o => o.id === connection.sourceOutput);
    
    const sourceX = sourceBlock.position.x + sourceBlock.size.width;
    const sourceY = sourceBlock.position.y + 60 + (sourceOutputIndex * 24) + 12; // Header height + output spacing

    // Calculate target position (input connector)
    let targetX: number, targetY: number;
    
    if (isTemporary) {
      // For temporary connections, follow mouse pointer
      // This would need to be updated with actual mouse position
      targetX = sourceX + 100;
      targetY = sourceY;
    } else if (targetBlock) {
      // const targetInput = targetBlock.inputs.find(i => i.id === connection.targetInput);
      const targetInputIndex = targetBlock.inputs.findIndex(i => i.id === connection.targetInput);
      
      targetX = targetBlock.position.x;
      targetY = targetBlock.position.y + 60 + (targetInputIndex * 24) + 12;
    } else {
      return null;
    }

    // Calculate control points for smooth curve
    const controlPoint1X = sourceX + (targetX - sourceX) * 0.5;
    const controlPoint1Y = sourceY;
    const controlPoint2X = sourceX + (targetX - sourceX) * 0.5;
    const controlPoint2Y = targetY;

    return {
      sourceX,
      sourceY,
      targetX,
      targetY,
      controlPoint1X,
      controlPoint1Y,
      controlPoint2X,
      controlPoint2Y,
      path: `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`
    };
  }, [connection, blocks, isTemporary]);

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'number': return '#3B82F6'; // blue
      case 'boolean': return '#10B981'; // green
      case 'string': return '#F59E0B'; // yellow
      case 'array': return '#8B5CF6'; // purple
      case 'candle': return '#EC4899'; // pink
      case 'indicator': return '#06B6D4'; // cyan
      case 'signal': return '#84CC16'; // lime
      case 'order': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  if (!connectionPath) {
    return null;
  }

  const strokeColor = getDataTypeColor(connection.dataType);

  return (
    <g>
      {/* Connection path */}
      <path
        d={connectionPath.path}
        stroke={strokeColor}
        strokeWidth={isTemporary ? 2 : 3}
        fill="none"
        strokeDasharray={isTemporary ? '5,5' : 'none'}
        opacity={isTemporary ? 0.7 : 1}
        className={`transition-all duration-200 ${
          !isTemporary ? 'hover:stroke-width-4 cursor-pointer' : ''
        }`}
        onClick={onDelete}
      />

      {/* Connection endpoints */}
      <circle
        cx={connectionPath.sourceX}
        cy={connectionPath.sourceY}
        r={4}
        fill={strokeColor}
      />
      
      {!isTemporary && (
        <circle
          cx={connectionPath.targetX}
          cy={connectionPath.targetY}
          r={4}
          fill={strokeColor}
        />
      )}

      {/* Data type indicator */}
      {!isTemporary && (
        <g>
          <circle
            cx={connectionPath.sourceX + (connectionPath.targetX - connectionPath.sourceX) * 0.5}
            cy={connectionPath.sourceY + (connectionPath.targetY - connectionPath.sourceY) * 0.5}
            r={8}
            fill="white"
            stroke={strokeColor}
            strokeWidth={2}
          />
          <text
            x={connectionPath.sourceX + (connectionPath.targetX - connectionPath.sourceX) * 0.5}
            y={connectionPath.sourceY + (connectionPath.targetY - connectionPath.sourceY) * 0.5 + 1}
            textAnchor="middle"
            fontSize="8"
            fill={strokeColor}
            className="pointer-events-none"
          >
            {connection.dataType.charAt(0).toUpperCase()}
          </text>
        </g>
      )}

      {/* Delete button for connections */}
      {!isTemporary && onDelete && (
        <g className="opacity-0 hover:opacity-100 transition-opacity">
          <circle
            cx={connectionPath.sourceX + (connectionPath.targetX - connectionPath.sourceX) * 0.8}
            cy={connectionPath.sourceY + (connectionPath.targetY - connectionPath.sourceY) * 0.2}
            r={8}
            fill="#EF4444"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
          <path
            d={`M ${connectionPath.sourceX + (connectionPath.targetX - connectionPath.sourceX) * 0.8 - 3} ${connectionPath.sourceY + (connectionPath.targetY - connectionPath.sourceY) * 0.2 - 3} 
                L ${connectionPath.sourceX + (connectionPath.targetX - connectionPath.sourceX) * 0.8 + 3} ${connectionPath.sourceY + (connectionPath.targetY - connectionPath.sourceY) * 0.2 + 3}
                M ${connectionPath.sourceX + (connectionPath.targetX - connectionPath.sourceX) * 0.8 + 3} ${connectionPath.sourceY + (connectionPath.targetY - connectionPath.sourceY) * 0.2 - 3}
                L ${connectionPath.sourceX + (connectionPath.targetX - connectionPath.sourceX) * 0.8 - 3} ${connectionPath.sourceY + (connectionPath.targetY - connectionPath.sourceY) * 0.2 + 3}`}
            stroke="white"
            strokeWidth={2}
            className="pointer-events-none"
          />
        </g>
      )}
    </g>
  );
};