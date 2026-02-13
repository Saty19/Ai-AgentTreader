import React from 'react';
import { TrendingUp, Activity, Target, Zap } from 'lucide-react';
import { Card } from '../../../components/atoms/Card';

export const StrategiesPage: React.FC = () => {
  const strategies = [
    {
      id: 1,
      name: 'EMA Trend Follower',
      status: 'Active',
      winRate: 65.4,
      trades: 156,
      pnl: 2340.50,
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      id: 2,
      name: 'MACD Crossover',
      status: 'Inactive',
      winRate: 58.2,
      trades: 89,
      pnl: 1120.30,
      icon: Activity,
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Strategies</h1>
          <p className="text-slate-500 mt-1">Manage and monitor your trading strategies</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Create Strategy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-slate-50 ${strategy.color}`}>
                <strategy.icon className="w-6 h-6" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                strategy.status === 'Active' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {strategy.status}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{strategy.name}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Win Rate:</span>
                <span className="font-semibold text-slate-900">{strategy.winRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Trades:</span>
                <span className="font-semibold text-slate-900">{strategy.trades}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">P&L:</span>
                <span className={`font-semibold ${strategy.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${strategy.pnl.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                Edit
              </button>
              <button className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                View Details
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900">Strategy Performance</h2>
        </div>
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <p className="text-slate-500">Performance charts and analytics will be displayed here</p>
        </div>
      </Card>
    </div>
  );
};
