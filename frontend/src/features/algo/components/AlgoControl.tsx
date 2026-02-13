import React, { useState } from 'react';
import { Play, Square, Settings } from 'lucide-react';
import { config } from '../../../config';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAlgoStatus } from '../../../api/client';

export const AlgoControl: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: statusData } = useQuery({
      queryKey: ['algoStatus'],
      queryFn: fetchAlgoStatus,
      refetchInterval: 3000
  });

  const isRunning = statusData?.status === 'running';
  const [isToggling, setIsToggling] = useState(false);

  const toggle = async () => {
      setIsToggling(true);
      try {
          const endpoint = isRunning ? '/api/algo/stop' : '/api/algo/start';
          // Fix: API Client uses /algo/start, manual fetch usage here needs full path or helper
          // Using fetch directly as originally done, but cleaner
          const res = await fetch(`${config.apiBaseUrl}${endpoint}`, { method: 'POST' });
          if (res.ok) {
              queryClient.invalidateQueries({ queryKey: ['algoStatus'] });
          }
      } catch (e) {
          console.error('Failed to toggle algo', e);
      } finally {
          setIsToggling(false);
      }
  };

  const isLoading = isToggling; // Compatible with existing UI logic

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-100">Algo Execution</h2>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">{isRunning ? 'Running' : 'Stopped'}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={toggle}
                disabled={isLoading}
                className={`flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold transition-colors ${
                    isRunning 
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50' 
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                {isLoading ? <span>Loading...</span> : (isRunning ? <><Square size={18} /> <span>Stop Algo</span></> : <><Play size={18} /> <span>Start Algo</span></>)}
             </button>
             <button className="flex items-center justify-center space-x-2 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 transition-colors">
                <Settings size={18} />
                <span>Settings</span>
             </button>
        </div>

        {/* Quick Stats/Risk */}
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Risk per Trade</span>
                <span className="text-white font-medium">1.0%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Active Broker</span>
                <span className="text-blue-400 font-medium">Paper Trading</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Symbol</span>
                <span className="text-yellow-400 font-medium">BTCUSDT</span>
            </div>
        </div>
      </div>
    </div>
  );
};
