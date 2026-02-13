import React from 'react';
import { useStrategies } from '../api/useStrategies';

export const StrategyPanel: React.FC = () => {
  const { data: strategies, isLoading, error } = useStrategies();

  if (isLoading) return <div className="p-4 text-gray-400">Loading Strategies...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading strategies</div>;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Trading Strategies</h2>
      <div className="space-y-4">
        {strategies?.map((strategy) => (
          <div key={strategy.name} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors">
            <div>
              <h3 className="font-semibold text-white">{strategy.name}</h3>
              <p className="text-sm text-gray-400">{strategy.description}</p>
            </div>
            <div className="flex items-center space-x-3">
               <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                 {strategy.indicators.length} Indicators
               </span>
               <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium">
                 Configure
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
