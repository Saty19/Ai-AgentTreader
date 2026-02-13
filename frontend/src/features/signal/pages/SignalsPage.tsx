import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Card } from '../../../components/atoms/Card';

export const SignalsPage: React.FC = () => {
  const signals = [
    {
      id: 1,
      symbol: 'BTCUSDT',
      side: 'BUY',
      price: 43250.50,
      time: '2 minutes ago',
      reason: 'EMA crossover',
      ema5: 43245.20,
      ema26: 43100.30,
      ema150: 42800.50,
    },
    {
      id: 2,
      symbol: 'ETHUSDT',
      side: 'SELL',
      price: 2345.80,
      time: '15 minutes ago',
      reason: 'Bearish trend',
      ema5: 2340.50,
      ema26: 2350.20,
      ema150: 2360.00,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trading Signals</h1>
          <p className="text-slate-500 mt-1">Real-time trading signals and recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Total Signals</span>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">156</p>
          <p className="text-sm text-emerald-600 mt-1">+12 today</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Buy Signals</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">89</p>
          <p className="text-sm text-slate-500 mt-1">57% of total</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Sell Signals</span>
            <ArrowDownRight className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">67</p>
          <p className="text-sm text-slate-500 mt-1">43% of total</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Signals</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Symbol</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Price</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Indicators</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {signals.map((signal) => (
                <tr key={signal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-slate-600">{signal.time}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{signal.symbol}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      signal.side === 'BUY' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {signal.side === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {signal.side}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-slate-900">${signal.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{signal.reason}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    <div className="space-y-1">
                      <div>EMA5: {signal.ema5.toFixed(2)}</div>
                      <div>EMA26: {signal.ema26.toFixed(2)}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
