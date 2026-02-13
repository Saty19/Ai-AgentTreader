import type { StrategyBlock, BlockTemplate, ValidationError, BlockConnection, BlockPosition } from '../types/blocks';
import type { IBlockService } from '../types/services';
import { v4 as uuidv4 } from 'uuid';

export class BlockService implements IBlockService {
  private blockTemplates: Map<string, BlockTemplate> = new Map();

  constructor(templates: BlockTemplate[] = []) {
    this.initializeTemplates(templates);
  }

  private initializeTemplates(templates: BlockTemplate[]): void {
    templates.forEach(template => {
      this.blockTemplates.set(template.type.toString(), template);
    });
  }

  async getAvailableBlocks(): Promise<BlockTemplate[]> {
    // In a real implementation, this might fetch from an API
    return Array.from(this.blockTemplates.values());
  }

  createBlock(template: BlockTemplate): StrategyBlock {
    const blockId = uuidv4();
    
    return {
      id: blockId,
      type: template.type,
      category: template.category,
      name: template.name,
      description: template.description,
      position: { x: 0, y: 0 },
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
        value: this.getDefaultPropertyValue(prop),
        ...prop
      })),
      isCustom: false,
      implementation: template.implementation
    };
  }

  private getDefaultPropertyValue(property: any): any {
    switch (property.type) {
      case 'boolean':
        return false;
      case 'number':
        return property.min || 0;
      case 'multiselect':
        return [];
      case 'select':
        return property.options?.[0]?.value || '';
      default:
        return '';
    }
  }

  updateBlock(_blockId: string, _updates: Partial<StrategyBlock>): void {
    // This method would typically update the block in a store or state management system
    // For now, we'll just validate the updates
    this.validateBlockUpdates(_updates);
  }

  private validateBlockUpdates(updates: Partial<StrategyBlock>): void {
    if (updates.name && updates.name.trim().length === 0) {
      throw new Error('Block name cannot be empty');
    }
    
    if (updates.position && (updates.position.x < 0 || updates.position.y < 0)) {
      throw new Error('Block position cannot be negative');
    }
    
    if (updates.size && (updates.size.width <= 0 || updates.size.height <= 0)) {
      throw new Error('Block size must be positive');
    }
  }

  deleteBlock(blockId: string): void {
    // This method would typically remove the block from a store or state management system
    console.log(`Deleting block: ${blockId}`);
  }

  duplicateBlock(_blockId: string): StrategyBlock {
    // This would typically work with a state management system to find the original block
    // For now, we'll create a mock implementation
    throw new Error('Block not found for duplication');
  }

  validateBlock(block: StrategyBlock): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate basic properties
    if (!block.name?.trim()) {
      errors.push({
        type: 'error',
        code: 'MISSING_PROPERTY',
        message: 'Block name is required',
        blockId: block.id
      });
    }

    if (!block.type) {
      errors.push({
        type: 'error',
        code: 'MISSING_PROPERTY',
        message: 'Block type is required',
        blockId: block.id
      });
    }

    // Validate position and size
    if (block.position.x < 0 || block.position.y < 0) {
      errors.push({
        type: 'error',
        code: 'INVALID_PROPERTY',
        message: 'Block position cannot be negative',
        blockId: block.id
      });
    }

    if (block.size.width <= 0 || block.size.height <= 0) {
      errors.push({
        type: 'error',
        code: 'INVALID_PROPERTY',
        message: 'Block size must be positive',
        blockId: block.id
      });
    }

    // Validate required properties
    block.properties.forEach(property => {
      if (property.required && this.isEmptyValue(property.value)) {
        errors.push({
          type: 'error',
          code: 'MISSING_PROPERTY',
          message: `Required property '${property.name}' is not set`,
          blockId: block.id,
          suggestion: `Set a value for the '${property.name}' property`
        });
      }

      // Validate property constraints
      const propertyErrors = this.validateProperty(property, block.id);
      errors.push(...propertyErrors);
    });

    // Validate inputs and outputs
    if (block.inputs.length === 0 && block.outputs.length === 0) {
      errors.push({
        type: 'warning',
        code: 'NO_CONNECTIONS',
        message: 'Block has no inputs or outputs',
        blockId: block.id,
        suggestion: 'This block cannot connect to other blocks'
      });
    }

    return errors;
  }

  private isEmptyValue(value: any): boolean {
    return value === undefined || value === null || value === '' || 
           (Array.isArray(value) && value.length === 0);
  }

  private validateProperty(property: any, blockId: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (property.type === 'number' && typeof property.value === 'number') {
      if (property.min !== undefined && property.value < property.min) {
        errors.push({
          type: 'error',
          code: 'INVALID_PROPERTY',
          message: `Property '${property.name}' value ${property.value} is below minimum ${property.min}`,
          blockId: blockId
        });
      }

      if (property.max !== undefined && property.value > property.max) {
        errors.push({
          type: 'error',
          code: 'INVALID_PROPERTY',
          message: `Property '${property.name}' value ${property.value} is above maximum ${property.max}`,
          blockId: blockId
        });
      }
    }

    if (property.type === 'select' && property.options) {
      const validValues = property.options.map((opt: any) => opt.value);
      if (!validValues.includes(property.value)) {
        errors.push({
          type: 'error',
          code: 'INVALID_PROPERTY',
          message: `Property '${property.name}' has invalid value '${property.value}'`,
          blockId: blockId,
          suggestion: `Valid values are: ${validValues.join(', ')}`
        });
      }
    }

    return errors;
  }

  validateBlockConnections(block: StrategyBlock, connections: BlockConnection[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required inputs
    const requiredInputs = block.inputs.filter(input => input.required);
    const connectedInputs = connections
      .filter(conn => conn.targetBlockId === block.id)
      .map(conn => conn.targetInput);

    requiredInputs.forEach(input => {
      if (!connectedInputs.includes(input.id)) {
        errors.push({
          type: 'error',
          code: 'MISSING_CONNECTION',
          message: `Required input '${input.name}' is not connected`,
          blockId: block.id,
          suggestion: `Connect an output to the '${input.name}' input`
        });
      }
    });

    // Check for multiple connections to single inputs (if not allowed)
    const inputConnectionCount: { [inputId: string]: number } = {};
    connections
      .filter(conn => conn.targetBlockId === block.id)
      .forEach(conn => {
        inputConnectionCount[conn.targetInput] = (inputConnectionCount[conn.targetInput] || 0) + 1;
      });

    Object.entries(inputConnectionCount).forEach(([inputId, count]) => {
      if (count > 1) {
        const input = block.inputs.find(i => i.id === inputId);
        if (input) {
          errors.push({
            type: 'warning',
            code: 'MULTIPLE_CONNECTIONS',
            message: `Input '${input.name}' has multiple connections`,
            blockId: block.id,
            suggestion: 'Multiple connections to the same input may cause unexpected behavior'
          });
        }
      }
    });

    return errors;
  }

  // Helper method to get block template by type
  getBlockTemplate(type: string): BlockTemplate | undefined {
    return this.blockTemplates.get(type);
  }

  // Helper method to validate block placement
  isValidPosition(position: BlockPosition, existingBlocks: StrategyBlock[]): boolean {
    // Check for overlaps with existing blocks
    return !existingBlocks.some(block => {
      const blockRight = block.position.x + block.size.width;
      const blockBottom = block.position.y + block.size.height;
      const newRight = position.x + 200; // Default width
      const newBottom = position.y + 150; // Default height

      return !(position.x >= blockRight || newRight <= block.position.x ||
               position.y >= blockBottom || newBottom <= block.position.y);
    });
  }

  // Helper method to suggest optimal position for new block
  suggestPosition(existingBlocks: StrategyBlock[], preferredPosition?: BlockPosition): BlockPosition {
    const defaultPosition = preferredPosition || { x: 100, y: 100 };
    
    if (this.isValidPosition(defaultPosition, existingBlocks)) {
      return defaultPosition;
    }

    // Find a position that doesn't overlap
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const candidatePosition = {
        x: defaultPosition.x + (attempts * 50),
        y: defaultPosition.y + (Math.floor(attempts / 10) * 50)
      };
      
      if (this.isValidPosition(candidatePosition, existingBlocks)) {
        return candidatePosition;
      }
      
      attempts++;
    }

    // Fallback to original position if no valid position found
    return defaultPosition;
  }
}