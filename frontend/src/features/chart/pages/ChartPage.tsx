import React from 'react';
import { Card } from '../../../components/atoms/Card';
import { ChartCanvas } from '../../chart/components/ChartCanvas';
import { TrendingUp, Activity, DollarSign } from 'lucide-react';

export const ChartPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Live Chart</h1>
          <p className="text-slate-500 mt-1">Real-time price chart with indicators</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Current Price</span>
            <DollarSign className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">$43,250.50</p>
          <p className="text-sm text-emerald-600 mt-1">+2.5% (24h)</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">24h High</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">$44,120.30</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">24h Volume</span>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">2.4B</p>
        </Card>
      </div>

      <Card className="p-6">
        <ChartCanvas />
      </Card>
    </div>
  );
};
