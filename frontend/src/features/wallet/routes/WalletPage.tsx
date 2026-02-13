import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { StatCard } from '../../../components/molecules/StatCard';
import { Card } from '../../../components/atoms/Card';
import { Button } from '../../../components/atoms/Button';
import { Wallet as WalletIcon, RefreshCw, PlusCircle, History } from 'lucide-react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { WalletTransaction } from '../types';

export const WalletPage: React.FC = () => {
  const { balance, equity, pnl, addFunds, resetFunds, transactions } = useWallet();

  const columnHelper = createColumnHelper<WalletTransaction>();
  
  const columns = [
      columnHelper.accessor('timestamp', {
          header: 'Date',
          cell: info => new Date(info.getValue()).toLocaleString()
      }),
      columnHelper.accessor('type', {
          header: 'Type',
      }),
      columnHelper.accessor('amount', {
          header: 'Amount',
          cell: info => `$${info.getValue().toFixed(2)}`
      }),
      columnHelper.accessor('description', {
          header: 'Description',
      }),
  ];

  const table = useReactTable({
      data: transactions,
      columns,
      getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
        <div className="space-x-2">
            <Button variant="secondary" size="sm" onClick={() => addFunds(1000)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add $1k
            </Button>
            <Button variant="danger" size="sm" onClick={resetFunds}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Account
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard label="Balance" value={`$${balance.toLocaleString()}`} icon={WalletIcon} />
         <StatCard label="Equity" value={`$${equity.toLocaleString()}`} />
         <StatCard 
            label="Total PnL" 
            value={`$${pnl.toLocaleString()}`} 
            trend={pnl >= 0 ? 'up' : 'down'} 
            trendValue={`${((pnl/100000)*100).toFixed(2)}%`}
         />
      </div>

      <Card>
         <div className="flex items-center mb-4">
            <History className="w-5 h-5 text-slate-500 mr-2" />
            <h3 className="text-lg font-semibold text-slate-900">Transaction History</h3>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 text-slate-500 text-sm">
                  {table.getHeaderGroups().map(headerGroup => (
                     <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                           <th key={header.id} className="p-3 font-medium">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                           </th>
                        ))}
                     </tr>
                  ))}
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                              <td key={cell.id} className="p-3 text-sm text-slate-700">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                          ))}
                      </tr>
                  ))}
                  {transactions.length === 0 && (
                      <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                              No transactions yet.
                          </td>
                      </tr>
                  )}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};
