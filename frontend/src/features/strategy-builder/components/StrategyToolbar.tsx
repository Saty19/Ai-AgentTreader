import React from 'react';
import type { StrategyDefinition, ValidationError } from '../types/blocks';
import { Button } from '../../../components/atoms/Button';

interface StrategyToolbarProps {
  strategy: StrategyDefinition | null;
  isEditable: boolean;
  validationErrors: ValidationError[];
  onSave: () => void;
  onLoad: () => void;
  onNew: () => void;
  onValidate: () => void;
  onCompile: () => void;
  onTest: () => void;
  onDeploy: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  loading?: boolean;
}

export const StrategyToolbar: React.FC<StrategyToolbarProps> = ({
  strategy,
  isEditable,
  validationErrors,
  onSave,
  onLoad,
  onNew,
  onValidate,
  onCompile,
  onTest,
  onDeploy,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  loading = false
}) => {
  const hasErrors = validationErrors.filter(e => e.type === 'error').length > 0;
  const hasWarnings = validationErrors.filter(e => e.type === 'warning').length > 0;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: File operations */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={onNew}
            className="flex items-center space-x-1 px-3 py-1 text-sm"
            disabled={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New</span>
          </Button>

          <Button
            onClick={onLoad}
            className="flex items-center space-x-1 px-3 py-1 text-sm"
            disabled={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5L7 5a2 2 0 00-2 2z" />
            </svg>
            <span>Load</span>
          </Button>

          <Button
            onClick={onSave}
            disabled={!strategy || !isEditable || loading}
            className="flex items-center space-x-1 px-3 py-1 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3-3-3m3-3v12" />
            </svg>
            <span>Save</span>
          </Button>

          <div className="h-6 w-px bg-gray-300" />

          {/* Undo/Redo */}
          <Button
            onClick={onUndo}
            disabled={!canUndo || !isEditable || loading}
            className="px-2 py-1 text-sm"
            title="Undo"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </Button>

          <Button
            onClick={onRedo}
            disabled={!canRedo || !isEditable || loading}
            className="px-2 py-1 text-sm"
            title="Redo"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </Button>
        </div>

        {/* Center: Strategy info and validation */}
        <div className="flex items-center space-x-4">
          {strategy && (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-800">{strategy.name}</h2>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{strategy.blocks.length} blocks</span>
                <span>•</span>
                <span>{strategy.connections.length} connections</span>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {validationErrors.length > 0 && (
            <div className="flex items-center space-x-2">
              {hasErrors && (
                <div className="flex items-center text-red-600">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                  </svg>
                  <span className="text-sm">{validationErrors.filter(e => e.type === 'error').length} errors</span>
                </div>
              )}
              
              {hasWarnings && (
                <div className="flex items-center text-yellow-600">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                  <span className="text-sm">{validationErrors.filter(e => e.type === 'warning').length} warnings</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Strategy operations and zoom */}
        <div className="flex items-center space-x-2">
          {/* Strategy Operations */}
          <Button
            onClick={onValidate}
            disabled={!strategy || loading}
            className="flex items-center space-x-1 px-3 py-1 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Validate</span>
          </Button>

          <Button
            onClick={onCompile}
            disabled={!strategy || hasErrors || loading}
            className="flex items-center space-x-1 px-3 py-1 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Compile</span>
          </Button>

          <Button
            onClick={onTest}
            disabled={!strategy || hasErrors || loading}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 010 5H9m0-5v5m0-5H7.5a2.5 2.5 0 000 5H9" />
            </svg>
            <span>Test</span>
          </Button>

          <Button
            onClick={onDeploy}
            disabled={!strategy || hasErrors || loading}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v8a1 1 0 01-1 1M7 4a1 1 0 00-1 1v8a1 1 0 001 1m7-10a1 1 0 011 1v8a1 1 0 01-1 1M7 4h10M5 21l14-9" />
            </svg>
            <span>Deploy</span>
          </Button>

          <div className="h-6 w-px bg-gray-300" />

          {/* Zoom controls */}
          <Button
            onClick={onZoomOut}
            disabled={zoom <= 0.25}
            className="px-2 py-1 text-sm"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth={2}/>
              <path d="M8 11h6" strokeWidth={2} strokeLinecap="round"/>
              <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>

          <span className="text-sm text-gray-600 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            onClick={onZoomIn}
            disabled={zoom >= 2}
            className="px-2 py-1 text-sm"
            title="Zoom In"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth={2}/>
              <path d="M8 11h6" strokeWidth={2} strokeLinecap="round"/>
              <path d="M11 8v6" strokeWidth={2} strokeLinecap="round"/>
              <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>

          <Button
            onClick={onZoomReset}
            className="px-2 py-1 text-sm"
            title="Reset Zoom"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-200">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};