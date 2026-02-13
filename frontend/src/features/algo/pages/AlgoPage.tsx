import React, { useState, useEffect } from 'react';
import { Bot, Play, Pause, Settings as SettingsIcon, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/atoms/Card';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchStats, fetchAlgoStatus, toggleAlgoStrategy } from '../../../api/client';
import { Loader } from '../../../components/atoms/Loader';
import { useSocket } from '../../../context/SocketContext';

interface AlgoBotConfig {
  id: string;
  name: string;
  status: 'Running' | 'Paused' | 'Stopped';
  uptime: string;
  trades: number;
  pnl: number;
  lastAction: string;
  description: string;
}

export const AlgoPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleTradeUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['stats'] });
      };
      
      socket.on('trade_update', handleTradeUpdate);
      
      return () => {
        socket.off('trade_update', handleTradeUpdate);
      };
    }
  }, [socket, queryClient]);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 1000 // Fallback if socket fails
  });

  const { data: algoStatus } = useQuery({
    queryKey: ['algoStatus'],
    queryFn: fetchAlgoStatus,
    refetchInterval: 2000
  });

  const toggleMutation = useMutation({
    mutationFn: ({ name, active }: { name: string; active: boolean }) => toggleAlgoStrategy(name, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['algoStatus'] });
    },
  });

  const statusMap = algoStatus?.strategies || {};

  const algos: AlgoBotConfig[] = [
    {
      id: '1',
      name: 'EMA Trend Follower',
      status: statusMap['EMA Trend Follower'] === 'Running' ? 'Running' : 'Paused',
      uptime: '24h 15m',
      trades: stats?.totalTrades || 0,
      pnl: stats?.netPnl || 0,
      lastAction: '2 minutes ago',
      description: 'Follows EMA trends for optimal entry and exit points',
    },
    {
      id: '2',
      name: 'MACD Crossover',
      status: statusMap['MACD Crossover'] === 'Running' ? 'Running' : 'Paused',
      uptime: '12h 30m',
      trades: 23,
      pnl: 156.30,
      lastAction: '1 hour ago',
      description: 'Uses MACD indicator crossovers to identify buy/sell signals',
    },
  ];

  if (isLoadingStats) return <div className="p-6"><Loader /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Algo Trading</h1>
          <p className="text-slate-500 mt-1">Automated trading bots and algorithms</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Deploy New Bot
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Active Bots</span>
            <Bot className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {algos.filter(a => a.status === 'Running').length}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {algos.length} total bots
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Total Trades</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {stats?.totalTrades || 0}
          </p>
          <p className="text-sm text-emerald-600 mt-1">
            Win Rate: {stats?.winRate || 0}%
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Combined P&L</span>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <p className={`text-3xl font-bold ${(stats?.netPnl || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${Number(stats?.netPnl || 0).toFixed(2)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {algos.map((algo) => (
          <Card key={algo.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  algo.status === 'Running' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-slate-50 text-slate-600'
                }`}>
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{algo.name}</h3>
                  <p className="text-sm text-slate-500">{algo.description}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                algo.status === 'Running' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : algo.status === 'Paused'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {algo.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Uptime</p>
                <p className="text-lg font-semibold text-slate-900">{algo.uptime}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Trades</p>
                <p className="text-lg font-semibold text-slate-900">{algo.trades}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-slate-500 mb-1">P&L</p>
                <p className={`text-2xl font-bold ${algo.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${Number(algo.pnl).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 mb-4">
              Last action: {algo.lastAction}
            </div>

            <div className="flex gap-2">
              {algo.status === 'Running' ? (
                <button 
                  onClick={() => toggleMutation.mutate({ name: algo.name, active: false })}
                  disabled={toggleMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50">
                  <Pause className="w-4 h-4" />
                  {toggleMutation.isPending ? 'Updating...' : 'Pause'}
                </button>
              ) : (
                <button 
                  onClick={() => toggleMutation.mutate({ name: algo.name, active: true })}
                  disabled={toggleMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50">
                  <Play className="w-4 h-4" />
                  {toggleMutation.isPending ? 'Updating...' : (algo.status === 'Paused' ? 'Resume' : 'Start')}
                </button>
              )}
              <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary-900 mb-1">Algo Trading Tips</h3>
            <p className="text-sm text-primary-700">
              Monitor your bots regularly and adjust parameters based on market conditions. 
              Backtesting is recommended before deploying any new algorithms.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900">Performance Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.winRate || 0}%</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalTrades || 0}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">Wins</p>
            <p className="text-2xl font-bold text-emerald-600">{stats?.wins || 0}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">Losses</p>
            <p className="text-2xl font-bold text-red-600">{stats?.losses || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
