import { useCallback, useRef } from 'react';
import type { StrategyBlock, BlockTemplate, BlockPosition } from '../types/blocks';
import { v4 as uuidv4 } from 'uuid';

export interface BlockManager {
  createBlock: (template: BlockTemplate, position: BlockPosition) => StrategyBlock;
  updateBlock: (blockId: string, updates: Partial<StrategyBlock>) => void;
  updateBlockProperty: (blockId: string, propertyId: string, value: any) => void;
  deleteBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => StrategyBlock | null;
  findBlock: (blockId: string) => StrategyBlock | undefined;
  getBlockBounds: (blocks: StrategyBlock[]) => { minX: number; minY: number; maxX: number; maxY: number };
}

interface UseBlockManagerProps {
  blocks: StrategyBlock[];
  onBlocksChange: (blocks: StrategyBlock[]) => void;
}

export const useBlockManager = (props?: UseBlockManagerProps) => {
  const blocksRef = useRef<StrategyBlock[]>(props?.blocks || []);
  const onBlocksChangeRef = useRef(props?.onBlocksChange);

  // Update refs when props change
  if (props?.blocks) {
    blocksRef.current = props.blocks;
  }
  if (props?.onBlocksChange) {
    onBlocksChangeRef.current = props.onBlocksChange;
  }

  const updateBlocks = useCallback((newBlocks: StrategyBlock[]) => {
    blocksRef.current = newBlocks;
    onBlocksChangeRef.current?.(newBlocks);
  }, []);

  const createBlock = useCallback((template: BlockTemplate, position: BlockPosition): StrategyBlock => {
    const blockId = uuidv4();
    
    const newBlock: StrategyBlock = {
      id: blockId,
      type: template.type,
      category: template.category,
      name: template.name,
      description: template.description,
      position,
      size: template.defaultSize,
      inputs: template.inputs.map((input, index) => ({
        id: `${blockId}_input_${index}`,
        ...input
      })),
      outputs: template.outputs.map((output, index) => ({
        id: `${blockId}_output_${index}`,
        ...output
      })),
      properties: template.properties.map((prop, index) => ({
        id: `${blockId}_prop_${index}`,
        value: prop.type === 'boolean' ? false : 
               prop.type === 'number' ? (prop.min || 0) :
               prop.type === 'multiselect' ? [] : '',
        ...prop
      })),
      isCustom: false,
      implementation: template.implementation
    };

    const updatedBlocks = [...blocksRef.current, newBlock];
    updateBlocks(updatedBlocks);
    
    return newBlock;
  }, [updateBlocks]);

  const updateBlock = useCallback((blockId: string, updates: Partial<StrategyBlock>) => {
    const updatedBlocks = blocksRef.current.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    updateBlocks(updatedBlocks);
  }, [updateBlocks]);

  const updateBlockProperty = useCallback((blockId: string, propertyId: string, value: any) => {
    const updatedBlocks = blocksRef.current.map(block => {
      if (block.id === blockId) {
        const updatedProperties = block.properties.map(prop =>
          prop.id === propertyId ? { ...prop, value } : prop
        );
        return { ...block, properties: updatedProperties };
      }
      return block;
    });
    updateBlocks(updatedBlocks);
  }, [updateBlocks]);

  const deleteBlock = useCallback((blockId: string) => {
    const updatedBlocks = blocksRef.current.filter(block => block.id !== blockId);
    updateBlocks(updatedBlocks);
  }, [updateBlocks]);

  const duplicateBlock = useCallback((blockId: string): StrategyBlock | null => {
    const originalBlock = blocksRef.current.find(block => block.id === blockId);
    if (!originalBlock) return null;

    const newBlockId = uuidv4();
    const duplicatedBlock: StrategyBlock = {
      ...originalBlock,
      id: newBlockId,
      name: `${originalBlock.name} (Copy)`,
      position: {
        x: originalBlock.position.x + 50,
        y: originalBlock.position.y + 50
      },
      inputs: originalBlock.inputs.map((input, index) => ({
        ...input,
        id: `${newBlockId}_input_${index}`
      })),
      outputs: originalBlock.outputs.map((output, index) => ({
        ...output,
        id: `${newBlockId}_output_${index}`
      })),
      properties: originalBlock.properties.map((prop, index) => ({
        ...prop,
        id: `${newBlockId}_prop_${index}`
      }))
    };

    const updatedBlocks = [...blocksRef.current, duplicatedBlock];
    updateBlocks(updatedBlocks);
    
    return duplicatedBlock;
  }, [updateBlocks]);

  const findBlock = useCallback((blockId: string): StrategyBlock | undefined => {
    return blocksRef.current.find(block => block.id === blockId);
  }, []);

  const getBlockBounds = useCallback((blocks: StrategyBlock[]) => {
    if (blocks.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    blocks.forEach(block => {
      const left = block.position.x;
      const top = block.position.y;
      const right = left + block.size.width;
      const bottom = top + block.size.height;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    return { minX, minY, maxX, maxY };
  }, []);

  const blockManager: BlockManager = {
    createBlock,
    updateBlock,
    updateBlockProperty,
    deleteBlock,
    duplicateBlock,
    findBlock,
    getBlockBounds
  };

  return { blockManager };
};