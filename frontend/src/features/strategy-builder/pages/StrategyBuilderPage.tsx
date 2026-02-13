import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStrategy, useAvailableBlocks, useCreateStrategy, useUpdateStrategy } from '../api/queries';
import { Card } from '../../../components/atoms/Card';
import { Button } from '../../../components/atoms/Button';
import { Loader } from '../../../components/atoms/Loader';
import { Save, Play, Share2, Settings as SettingsIcon, Plus, Grid3x3 } from 'lucide-react';
import type { Block, Connection } from '../types/blocks';

export function StrategyBuilderPage() {
  const { id: strategyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: availableBlocks } = useAvailableBlocks();
  const { data: strategyData, isLoading } = useStrategy(strategyId || '', !!strategyId);
  const createStrategy = useCreateStrategy();
  const updateStrategy = useUpdateStrategy();

  const [strategyName, setStrategyName] = useState('Untitled Strategy');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBlockPalette, setShowBlockPalette] = useState(false);
  
  // Dragging State
  const [draggingBlock, setDraggingBlock] = useState<{ id: string; initialX: number; initialY: number; startMouseX: number; startMouseY: number } | null>(null);

  // Connection State
  const [connectingSource, setConnectingSource] = useState<string | null>(null);

  // Load strategy data if editing
  useEffect(() => {
    if (strategyData) {
      setStrategyName(strategyData.name || 'Untitled Strategy');
      // Handle both nested and direct strategyDefinition structure
      const definition = strategyData.strategyDefinition || strategyData;
      setBlocks(definition.blocks || []);
      setConnections(definition.connections || []);
    }
  }, [strategyData]);

  const addBlock = useCallback((blockType: string) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type: blockType,
      position: { x: 100 + blocks.length * 50, y: 100 + blocks.length * 30 },
      properties: {},
      name: blockType,
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowBlockPalette(false);
  }, [blocks.length]);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    setConnections(prev => prev.filter(c => c.from !== blockId && c.to !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }, [selectedBlockId]);

  const handleSave = async () => {
    // preserve existing metadata if updating
    const existingDef = strategyData?.strategyDefinition || strategyData;
    const existingMeta = existingDef?.metadata || {};

    const strategyDefinition = {
      version: (existingDef?.version || 0) + 1,
      blocks,
      connections,
      metadata: {
        ...existingMeta,
        createdAt: existingMeta.createdAt || Date.now(),
        updatedAt: Date.now(),
        createdBy: existingMeta.createdBy || 'user',
        tags: existingMeta.tags || [],
      },
    };

    try {
      if (strategyId) {
        await updateStrategy.mutateAsync({
          strategyId,
          request: { name: strategyName, strategyDefinition },
        });
        // Optional: Add a success toast here
        alert('Strategy updated successfully');
      } else {
        const result = await createStrategy.mutateAsync({
          name: strategyName,
          description: 'Created with Strategy Builder',
          strategyDefinition,
          isPublic: false,
        });
        if (result.strategyId) {
          navigate(`/strategy-builder/${result.strategyId}`);
        }
      }
    } catch (error) {
      console.error('Failed to save strategy:', error);
      alert('Failed to save strategy');
    }
  };

  // Drag Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      setDraggingBlock({
        id: blockId,
        initialX: block.position.x,
        initialY: block.position.y,
        startMouseX: e.clientX,
        startMouseY: e.clientY
      });
      setSelectedBlockId(blockId);
      
      // If connecting mode is active and we click a DIFFERENT block, try connect
      if (connectingSource && connectingSource !== blockId) {
          // Check if connection already exists
          const exists = connections.some(c => c.from === connectingSource && c.to === blockId);
          if (!exists) {
              setConnections(prev => [...prev, { from: connectingSource, to: blockId }]);
          }
          setConnectingSource(null); // End connection mode
      }
    }
  }, [blocks, connectingSource, connections]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingBlock) {
      const dx = e.clientX - draggingBlock.startMouseX;
      const dy = e.clientY - draggingBlock.startMouseY;
      
      setBlocks(prev => prev.map(b => {
        if (b.id === draggingBlock.id) {
            return {
                ...b,
                position: {
                    x: draggingBlock.initialX + dx,
                    y: draggingBlock.initialY + dy
                }
            };
        }
        return b;
      }));
    }
  }, [draggingBlock]);

  const handleMouseUp = useCallback(() => {
    setDraggingBlock(null);
  }, []);

  // Update properties
  const updateBlockProperty = (key: string, value: any) => {
      if (!selectedBlockId) return;
      setBlocks(prev => prev.map(b => {
          if (b.id === selectedBlockId) {
              if (key === 'type') return b; // Can't change type easily
              return { 
                ...b, 
                properties: { ...b.properties, [key]: value } 
              };
          }
          return b;
      }));
  };

  if (isLoading) return <Loader />;

  const blockCategories = availableBlocks?.categories || ['Indicators', 'Conditions', 'Actions'];

  return (
    <div 
        className="strategy-builder-page h-full flex flex-col"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="text-2xl font-bold border-none outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
            />
            <span className="text-sm text-slate-500">
              {blocks.length} blocks, {connections.length} connections
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowBlockPalette(!showBlockPalette)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Block
            </Button>
            <Button variant="secondary" size="sm">
              <Play className="w-4 h-4 mr-1" />
              Test
            </Button>
            <Button variant="secondary" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button onClick={handleSave} disabled={createStrategy.isPending || updateStrategy.isPending}>
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            {selectedBlockId && !connectingSource && (
                <Button variant="secondary" onClick={() => setConnectingSource(selectedBlockId)}>
                    Connect
                </Button>
            )}
            {connectingSource && (
                <Button variant="primary" onClick={() => setConnectingSource(null)}>
                    Cancel Connect
                </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Block Palette Sidebar */}
        {showBlockPalette && (
          <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Block Palette</h3>
            {blockCategories.map(category => (
              <div key={category} className="mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">{category}</h4>
                <div className="space-y-2">
                  {['EMA', 'RSI', 'MACD', 'Bollinger Bands'].map(blockType => (
                    <button
                      key={blockType}
                      onClick={() => addBlock(blockType)}
                      className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-primary-50 rounded-lg text-sm transition-colors"
                    >
                      {blockType}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 bg-slate-50 p-6 overflow-auto">
          <Card className="min-h-full relative">
            {blocks.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Grid3x3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No blocks yet</h3>
                  <p className="text-slate-500 mb-4">Start building your strategy by adding blocks</p>
                  <Button onClick={() => setShowBlockPalette(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Block
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  {connections.map((conn, idx) => {
                    const fromBlock = blocks.find(b => b.id === conn.from);
                    const toBlock = blocks.find(b => b.id === conn.to);
                    if (!fromBlock || !toBlock) return null;
                    return (
                      <line
                        key={idx}
                        x1={fromBlock.position.x + 100}
                        y1={fromBlock.position.y + 40}
                        x2={toBlock.position.x}
                        y2={toBlock.position.y + 40}
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
                {blocks.map(block => (
                  <div
                    key={block.id}
                    onMouseDown={(e) => handleMouseDown(e, block.id)}
                    className={`absolute bg-white rounded-lg shadow-md p-4 cursor-move border-2 transition-colors ${
                      selectedBlockId === block.id ? 'border-primary-500' : 'border-transparent'
                    } ${connectingSource === block.id ? 'ring-2 ring-yellow-400' : ''}`}
                    style={{
                      left: block.position.x,
                      top: block.position.y,
                      width: '200px',
                      zIndex: 1,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{block.type}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(block.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs text-slate-500">{block.id}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Properties Panel */}
        {selectedBlockId && (
          <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon className="w-5 h-5 text-slate-500" />
              <h3 className="font-semibold text-slate-900">Block Properties</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Block ID</label>
                <input
                  type="text"
                  value={selectedBlockId}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Block Type</label>
                <input
                  type="text"
                  value={blocks.find(b => b.id === selectedBlockId)?.type || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              
              {/* Dynamic Property Editing */}
              {(() => {
                  const block = blocks.find(b => b.id === selectedBlockId);
                  if (!block) return null;
                  // Just some dummy editable props for now based on common needs
                  // In a real app key-value pairs should be derived from block definition
                  const commonProps = ['period', 'threshold', 'value', 'stopLoss', 'takeProfit'];
                  
                  return (
                      <div className="space-y-4 mt-4 border-t pt-4">
                          <h4 className="font-medium text-sm">Parameters</h4>
                          {Object.entries(block.properties || {}).map(([key, val]) => (
                              <div key={key}>
                                  <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">{key}</label>
                                  <input 
                                      type="text" 
                                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                      value={val}
                                      onChange={(e) => updateBlockProperty(key, e.target.value)}
                                  />
                              </div>
                          ))}
                          <div className="text-xs text-gray-500 mt-2">
                              Add properties:
                              <div className="flex gap-2 mt-1">
                                  {commonProps.map(prop => (
                                     !block.properties?.[prop] && (
                                      <button 
                                        key={prop}
                                        onClick={() => updateBlockProperty(prop, '')}
                                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                      >
                                        + {prop}
                                      </button>
                                     )
                                  ))}
                              </div>
                          </div>
                      </div>
                  );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
