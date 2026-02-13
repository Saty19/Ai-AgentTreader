import React, { useCallback, useState } from 'react';
import type { StrategyBlock, BlockProperty } from '../types/blocks';
import { Card } from '../../../components/atoms/Card';
import { Input } from '../../../components/atoms/Input';
import { Button } from '../../../components/atoms/Button';

interface PropertiesPanelProps {
  selectedBlock: StrategyBlock | null;
  onPropertyUpdate: (blockId: string, propertyId: string, value: any) => void;
  onBlockUpdate: (blockId: string, updates: Partial<StrategyBlock>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedBlock,
  onPropertyUpdate,
  onBlockUpdate,
  collapsed = false,
  onToggleCollapse
}) => {
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  const handlePropertyChange = useCallback((propertyId: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [propertyId]: value }));
    
    if (selectedBlock) {
      onPropertyUpdate(selectedBlock.id, propertyId, value);
    }
  }, [selectedBlock, onPropertyUpdate]);

  const handleNameChange = useCallback((newName: string) => {
    if (selectedBlock) {
      onBlockUpdate(selectedBlock.id, { name: newName });
    }
  }, [selectedBlock, onBlockUpdate]);

  const handleDescriptionChange = useCallback((newDescription: string) => {
    if (selectedBlock) {
      onBlockUpdate(selectedBlock.id, { description: newDescription });
    }
  }, [selectedBlock, onBlockUpdate]);

  const renderPropertyInput = (property: BlockProperty) => {
    const currentValue = localValues[property.id] ?? property.value;

    switch (property.type) {
      case 'string':
        return (
          <Input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            placeholder={property.description}
            className="w-full"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue || 0}
            onChange={(e) => handlePropertyChange(property.id, parseFloat(e.target.value) || 0)}
            min={property.min}
            max={property.max}
            step={property.step || 0.1}
            placeholder={property.description}
            className="w-full"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentValue || false}
              onChange={(e) => handlePropertyChange(property.id, e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">{property.description || 'Enable'}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select...</option>
            {property.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-1">
            {property.options?.map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(currentValue || []).includes(option.value)}
                  onChange={(e) => {
                    const current = currentValue || [];
                    const newValue = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v: any) => v !== option.value);
                    handlePropertyChange(property.id, newValue);
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            className="w-full"
          />
        );
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 shadow-lg">
        <Button
          onClick={onToggleCollapse}
          className="w-full h-12 border-none bg-transparent p-2"
          title="Expand Properties Panel"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Properties</h3>
        <Button
          onClick={onToggleCollapse}
          className="p-1 border-none bg-transparent"
          title="Collapse Properties Panel"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18l6-6-6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedBlock ? (
          <div className="text-center text-gray-500 mt-8">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Select a block to edit its properties</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Block Info */}
            <Card className="p-4">
              <h4 className="font-semibold text-lg mb-4">Block Information</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    type="text"
                    value={selectedBlock.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={selectedBlock.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedBlock.type}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded capitalize">
                    {selectedBlock.category}
                  </p>
                </div>
              </div>
            </Card>

            {/* Block Properties */}
            {selectedBlock.properties.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold text-lg mb-4">Configuration</h4>
                
                <div className="space-y-4">
                  {selectedBlock.properties.map((property) => (
                    <div key={property.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {property.name}
                        {property.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderPropertyInput(property)}
                      {property.description && (
                        <p className="text-xs text-gray-500 mt-1">{property.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Block Inputs */}
            {selectedBlock.inputs.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold text-lg mb-4">Inputs</h4>
                
                <div className="space-y-3">
                  {selectedBlock.inputs.map((input) => (
                    <div key={input.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{input.name}</span>
                        {input.required && <span className="text-red-500 ml-1">*</span>}
                        <p className="text-xs text-gray-500">{input.dataType}</p>
                      </div>
                      <div className="w-3 h-3 border-2 border-blue-500 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Block Outputs */}
            {selectedBlock.outputs.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold text-lg mb-4">Outputs</h4>
                
                <div className="space-y-3">
                  {selectedBlock.outputs.map((output) => (
                    <div key={output.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{output.name}</span>
                        <p className="text-xs text-gray-500">{output.dataType}</p>
                      </div>
                      <div className="w-3 h-3 border-2 border-green-500 rounded-full bg-green-500"></div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};