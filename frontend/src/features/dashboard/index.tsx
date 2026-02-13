import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStats, useTrades } from './hooks/useDashboardData';
import { useSocket } from '../../context/SocketContext';
import { useWallet } from '../wallet/hooks/useWallet';
// import { TradingChart } from './components/TradingChart'; // Replaced by AdvancedChart
import { TradesTable } from './components/TradesTable';
import { StatCard } from '../../components/molecules/StatCard';
import { Badge } from '../../components/atoms/Badge';
import { Activity, TrendingUp, DollarSign, BarChart2 } from 'lucide-react';
import type { Stats, Trade } from '../../types';
import { StrategyPanel } from '../strategies/components/StrategyPanel';
import { AlgoControl } from '../algo/components/AlgoControl';
import { AdvancedChart } from '../chart';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { balance } = useWallet();
  const [lastSignal, setLastSignal] = useState<any>(null);

  const { data: stats } = useStats();
  const { data: trades } = useTrades();

  useEffect(() => {
    if (!socket) return;

    socket.on('stats_update', (newStats: Stats) => {
        queryClient.setQueryData(['stats'], newStats);
    });

    socket.on('trade_open', (trade: Trade) => {
        queryClient.setQueryData(['trades'], (old: Trade[] | undefined) => [trade, ...(old || [])]);
        queryClient.invalidateQueries({ queryKey: ['stats'] }); // Refresh stats too
    });

    socket.on('trade_close', (trade: Trade) => {
        queryClient.setQueryData(['trades'], (old: Trade[] | undefined) => 
            (old || []).map((t: Trade) => t.id === trade.id ? trade : t)
        );
        queryClient.invalidateQueries({ queryKey: ['stats'] });
    });

    socket.on('signal', (signal: any) => {
        setLastSignal(signal);
        setTimeout(() => setLastSignal(null), 5000); // Clear after 5s
    });

    return () => {
        socket.off('stats_update');
        socket.off('trade_open');
        socket.off('trade_close');
        socket.off('signal');
    };
  }, [socket, queryClient]);

  const winRate = stats?.winRate ?? 0;
  const netPnl = stats?.netPnl ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
           <p className="text-sm text-slate-500">Live trading performance</p>
        </div>
        <div className="flex items-center gap-3">
           <Badge variant={socket?.connected ? 'success' : 'danger'}>
              {socket?.connected ? 'Connected' : 'Disconnected'}
           </Badge>
           <Badge variant="primary">BTCUSDT</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            label="Balance" 
            value={`$${balance.toLocaleString()}`} 
            icon={DollarSign} 
        />
        <StatCard 
            label="Net PnL" 
            value={`$${netPnl.toLocaleString()}`} 
            trend={netPnl >= 0 ? 'up' : 'down'} 
            icon={TrendingUp}
        />
        <StatCard 
            label="Win Rate" 
            value={`${winRate}%`} 
            trend={winRate > 50 ? 'up' : 'down'} 
            icon={Activity}
        />
        <StatCard 
            label="Total Trades" 
            value={stats?.totalTrades ?? 0} 
            icon={BarChart2}
        />
      </div>

      {/* Main Content: Chart + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Chart Section */}
        <div className="lg:col-span-2 relative">
             {lastSignal && (
              <div className={`absolute top-4 right-4 z-20 px-4 py-3 rounded-lg shadow-lg text-white animate-pulse ${
                  lastSignal.side === 'BUY' ? 'bg-emerald-500' : 'bg-red-500'
              }`}>
                  <div className="font-bold text-lg">{lastSignal.side} SIGNAL</div>
                  <div className="text-sm opacity-90">{lastSignal.reason}</div>
                  <div className="text-xs mt-1 font-mono">@{lastSignal.price}</div>
              </div>
           )}


           <AdvancedChart activeTrades={trades} />
        </div>

        {/* Strategy Controls / Info */}
        <div className="space-y-6">
            <AlgoControl />
            <StrategyPanel />
        </div>
      </div>

      {/* Trades Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Trades</h3>
            <Badge variant="neutral">{trades?.length || 0} Trades</Badge>
        </div>
        <TradesTable data={trades || []} />
      </div>
    </div>
  );
};
