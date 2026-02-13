import React from 'react';
import { Bot, Play, Pause, Settings as SettingsIcon, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/atoms/Card';

export const AlgoPage: React.FC = () => {
  const algos = [
    {
      id: 1,
      name: 'Scalping Bot',
      status: 'Running',
      uptime: '24h 15m',
      trades: 45,
      pnl: 234.50,
      lastAction: '2 minutes ago',
    },
    {
      id: 2,
      name: 'Grid Trading Bot',
      status: 'Paused',
      uptime: '12h 30m',
      trades: 23,
      pnl: 156.30,
      lastAction: '1 hour ago',
    },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {algos.map((algo) => (
          <Card key={algo.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{algo.name}</h3>
                  <p className="text-sm text-slate-500">Last action: {algo.lastAction}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                algo.status === 'Running' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
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
                <p className="text-xs text-slate-500 mb-1">Trades Today</p>
                <p className="text-lg font-semibold text-slate-900">{algo.trades}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-slate-500 mb-1">P&L Today</p>
                <p className={`text-2xl font-bold ${algo.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${algo.pnl.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {algo.status === 'Running' ? (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors">
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900">Performance Overview</h2>
        </div>
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <p className="text-slate-500">Algo performance metrics and charts will be displayed here</p>
        </div>
      </Card>
    </div>
  );
};
