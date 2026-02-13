import React, { useState } from 'react';
import type { ValidationError } from '../types/blocks';
import { Card } from '../../../components/atoms/Card';
import { Button } from '../../../components/atoms/Button';

interface ValidationPanelProps {
  validationErrors: ValidationError[];
  onErrorClick?: (error: ValidationError) => void;
  onDismissError?: (index: number) => void;
  className?: string;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validationErrors,
  onErrorClick,
  onDismissError,
  className = ''
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');

  const errors = validationErrors.filter(e => e.type === 'error');
  const warnings = validationErrors.filter(e => e.type === 'warning');

  const filteredErrors = validationErrors.filter(error => {
    if (filter === 'error') return error.type === 'error';
    if (filter === 'warning') return error.type === 'warning';
    return true;
  });

  const getErrorIcon = (type: string) => {
    if (type === 'error') {
      return (
        <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    );
  };

  const getErrorCodeColor = (code: string) => {
    switch (code) {
      case 'MISSING_CONNECTION':
      case 'INVALID_CONNECTION':
        return 'bg-red-100 text-red-800';
      case 'MISSING_PROPERTY':
      case 'INVALID_PROPERTY':
        return 'bg-orange-100 text-orange-800';
      case 'CIRCULAR_DEPENDENCY':
        return 'bg-purple-100 text-purple-800';
      case 'TYPE_MISMATCH':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (validationErrors.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center text-green-600">
          <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="font-medium">Strategy validation passed!</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-800">Validation Results</h3>
          
          <div className="flex items-center space-x-2 text-sm">
            {errors.length > 0 && (
              <span className="flex items-center text-red-600">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                </svg>
                {errors.length} errors
              </span>
            )}
            
            {warnings.length > 0 && (
              <span className="flex items-center text-yellow-600">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
                {warnings.length} warnings
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Filter buttons */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'error' | 'warning')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All ({validationErrors.length})</option>
            <option value="error">Errors ({errors.length})</option>
            <option value="warning">Warnings ({warnings.length})</option>
          </select>
          
          <Button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 border-none bg-transparent"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg
              className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M6 9l6 6 6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="max-h-64 overflow-y-auto">
          {filteredErrors.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No {filter === 'all' ? '' : filter}s to display
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredErrors.map((error, index) => (
                <div
                  key={index}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    onErrorClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onErrorClick?.(error)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getErrorIcon(error.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getErrorCodeColor(error.code)}`}>
                            {error.code}
                          </span>
                          
                          {error.blockId && (
                            <span className="text-xs text-gray-500">
                              Block: {error.blockId.substring(0, 8)}...
                            </span>
                          )}
                          
                          {error.connectionId && (
                            <span className="text-xs text-gray-500">
                              Connection: {error.connectionId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-800 mb-1">{error.message}</p>
                        
                        {error.suggestion && (
                          <p className="text-xs text-gray-600 italic">
                            💡 {error.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {onDismissError && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismissError(index);
                        }}
                        className="p-1 border-none bg-transparent text-gray-400 hover:text-gray-600"
                        title="Dismiss"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M18 6L6 18M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!collapsed && validationErrors.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredErrors.length} of {validationErrors.length} issues shown
            </span>
            
            {errors.length > 0 && (
              <span className="text-red-600 font-medium">
                ⚠️ Strategy cannot be deployed until all errors are resolved
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};