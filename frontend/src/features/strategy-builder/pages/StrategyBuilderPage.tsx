import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function StrategyBuilderPage() {
  const { id: strategyId } = useParams<{ id: string }>();
  const [selectedBlockId] = useState<string | null>(null);

  return (
    <div className="strategy-builder-page p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-4">Strategy Builder</h1>
          <p className="text-gray-600 mb-6">
            Visual strategy building interface coming soon...{strategyId ? ` (Editing: ${strategyId})` : ''}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-blue-800">
              The Strategy Builder feature is being developed. This page will include:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700">
              <li>Drag-and-drop block-based strategy designer</li>
              <li>Real-time strategy validation</li>
              <li>Backtesting capabilities</li>
              <li>Strategy deployment and monitoring</li>
            </ul>
          </div>
          {selectedBlockId && (
            <div className="mt-4 text-sm text-gray-500">
              Selected block: {selectedBlockId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
