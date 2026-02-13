import React from 'react';
import { useAllTrades } from '../hooks/useAllTrades';
import { TradesDataTable } from '../components/TradesDataTable';
import { Badge } from '../../../components/atoms/Badge';
import { Loader } from '../../../components/atoms/Loader';

export const TradesPage: React.FC = () => {
  const { data: trades, isLoading } = useAllTrades();

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Trade History</h1>
           <p className="text-sm text-slate-500">Identify patterns and review your performance</p>
        </div>
        <Badge variant="neutral">{trades?.length || 0} Total Trades</Badge>
      </div>

      <TradesDataTable data={trades || []} />
    </div>
  );
};
