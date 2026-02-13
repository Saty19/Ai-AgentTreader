import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { Badge } from '../../../components/atoms/Badge';
import { Card } from '../../../components/atoms/Card';
import type { Trade } from '../../../types'; 

interface TradesTableProps {
  data: Trade[];
}

const columnHelper = createColumnHelper<Trade>();

// Helper for safe number formatting
const formatNumber = (val: number | string | undefined | null, decimals = 2): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (num === undefined || num === null || isNaN(num as number)) return '-';
  return (num as number).toFixed(decimals);
};

export const TradesTable: React.FC<TradesTableProps> = ({ data }) => {
  const columns = useMemo<any[]>(() => [
    columnHelper.accessor('symbol', {
        header: 'Symbol',
        cell: info => <span className="font-semibold text-slate-900">{info.getValue()}</span>
    }),
    columnHelper.accessor('side', {
        header: 'Side',
        cell: info => (
            <Badge variant={info.getValue() === 'BUY' ? 'success' : 'danger'}>
                {info.getValue()}
            </Badge>
        )
    }),
    columnHelper.accessor('entryPrice', {
        header: 'Entry',
        cell: info => {
            const val = formatNumber(info.getValue());
            return val !== '-' ? `$${val}` : '-';
        }
    }),
    columnHelper.accessor('exitPrice', {
        header: 'Exit',
        cell: info => {
            const val = formatNumber(info.getValue());
            return val !== '-' ? `$${val}` : '-';
        }
    }),
    columnHelper.accessor('pnl', {
        header: 'PnL',
        cell: info => {
            const raw = info.getValue();
            const num = typeof raw === 'string' ? parseFloat(raw) : raw;
            
            if (num === undefined || num === null || isNaN(num as number)) return '-';
            
            const val = (num as number);
            return (
               <span className={val >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                  {val >= 0 ? '+' : ''}{val.toFixed(2)}
               </span>
            );
        }
    }),
    columnHelper.accessor('result', {
        header: 'Result',
        cell: info => {
            const val = info.getValue();
            let variant: 'success' | 'danger' | 'warning' = 'warning';
            if (val === 'WIN') variant = 'success';
            if (val === 'LOSS') variant = 'danger';
            return <Badge variant={variant}>{val || 'OPEN'}</Badge>;
        }
    }),
    columnHelper.accessor('entryTime', {
        header: 'Time',
        cell: info => new Date(info.getValue()).toLocaleTimeString()
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="overflow-x-auto p-0 border border-slate-200 shadow-sm rounded-lg">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="p-4 text-sm text-slate-700 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
              <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-slate-400">
                      No trades found.
                  </td>
              </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
};
