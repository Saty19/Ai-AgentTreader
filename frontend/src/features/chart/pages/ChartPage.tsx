import React, { useState } from 'react';
import { Card } from '../../../components/atoms/Card';
import { ChartContent } from '..';
import { ChartProvider } from '../store/ChartContext';
import { TrendingUp, Activity, DollarSign, LayoutGrid, Square } from 'lucide-react';
import { useChartData } from '../hooks/useChartData';

// Wrapper to provide context for a single chart instance
const SingleChartInstance = () => {
    return (
        <ChartProvider>
            <div className="h-[600px] bg-white rounded-lg border border-slate-200 overflow-hidden">
                <ChartContent />
            </div>
        </ChartProvider>
    )
}

const ChartStats: React.FC = () => {
  const { data: chartData, realtimeCandle } = useChartData();

  // Get current price from latest data
  const currentPrice = Number(realtimeCandle?.close || chartData?.[chartData.length - 1]?.close || 0);
  
  // Calculate 24h stats from chart data
  const last24h = chartData?.slice(-24) || [];
  const high24h = last24h.length > 0 ? Math.max(...last24h.map(d => Number(d.high))) : 0;
  const firstPrice = Number(last24h[0]?.close || 0);
  const priceChange = currentPrice && firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
  const volume24h = last24h.reduce((sum, d) => sum + Number(d.volume || 0), 0);

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Current Price</span>
            <DollarSign className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ${currentPrice?.toFixed(2) || '0.00'}
          </p>
          <p className={`text-sm mt-1 ${priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (24h)
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">24h High</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ${high24h.toFixed(2)}
          </p>
          <p className="text-sm text-emerald-600 mt-1">
            24h High
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">24h Volume</span>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {volume24h > 1000000 
              ? `${(volume24h / 1000000).toFixed(1)}M` 
              : volume24h > 1000 
                ? `${(volume24h / 1000).toFixed(1)}K` 
                : volume24h.toFixed(0)}
          </p>
        </Card>
      </div>
  );
}

export const ChartPage: React.FC = () => {
    const [chartCount, setChartCount] = useState(1);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold text-slate-900">Live Chart</h1>
                <p className="text-slate-500 mt-1">Real-time price chart with indicators</p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button 
                        onClick={() => setChartCount(1)}
                        className={`p-2 rounded ${chartCount === 1 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Single View"
                    >
                        <Square size={20} />
                    </button>
                    <button 
                        onClick={() => setChartCount(2)}
                        className={`p-2 rounded ${chartCount === 2 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Split View"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button 
                        onClick={() => setChartCount(4)}
                        className={`p-2 rounded ${chartCount === 4 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Quad View"
                    >
                        <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Global stats from the first chart context (wrapped securely) */}
            <ChartProvider>
                <ChartStats />
            </ChartProvider>

            <div className={`grid gap-6 ${
                chartCount === 1 ? 'grid-cols-1' :
                chartCount === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2'
            }`}>
                {Array.from({ length: chartCount }).map((_, i) => (
                    <SingleChartInstance key={i} />
                ))}
            </div>
        </div>
    );
};
