import React, { useMemo, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel,
  flexRender, 
  createColumnHelper,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import { Badge } from '../../../components/atoms/Badge';
import { Card } from '../../../components/atoms/Card';
import { Input } from '../../../components/atoms/Input';
import { Button } from '../../../components/atoms/Button';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import type { Trade } from '../../../types';

interface TradesDataTableProps {
  data: Trade[];
}

const formatNumber = (val: number | string | undefined | null, decimals = 2): string => {
  if (val === undefined || val === null) return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num as number)) return '-';
  return (num as number).toFixed(decimals);
};

const columnHelper = createColumnHelper<Trade>();

export const TradesDataTable: React.FC<TradesDataTableProps> = ({ data }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(() => [
    columnHelper.accessor('id', {
        header: 'ID',
        cell: info => <span className="text-slate-500">#{info.getValue()}</span>
    }),
    columnHelper.accessor('symbol', {
        header: 'Symbol',
        cell: info => <span className="font-bold text-slate-800">{info.getValue()}</span>
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
        header: 'Entry Price',
        cell: info => `$${formatNumber(info.getValue())}`
    }),
    columnHelper.accessor('exitPrice', {
        header: 'Exit Price',
        cell: info => {
            const val = formatNumber(info.getValue());
            return val !== '-' ? `$${val}` : '-';
        }
    }),
    columnHelper.accessor('pnl', {
        header: 'PnL',
        cell: info => {
            const raw = info.getValue();
            const val = typeof raw === 'string' ? parseFloat(raw) : raw;
            const formatted = formatNumber(raw);
            if (formatted === '-') return '-';
            
            return (
               <span className={(val ?? 0) >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                  {(val ?? 0) >= 0 ? '+' : ''}{formatted}
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
            return <Badge variant={variant}>{val}</Badge>;
        }
    }),
    columnHelper.accessor('entryTime', {
        header: 'Date & Time',
        cell: info => new Date(info.getValue()).toLocaleString()
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card className="p-0 overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
         <Input 
            placeholder="Search trades..." 
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className="w-full sm:w-64"
         />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ArrowUpDown className="w-3 h-3 text-slate-400 rotate-180" />,
                          desc: <ArrowUpDown className="w-3 h-3 text-slate-400" />,
                        }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                    </div>
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
                        No trades found matching your criteria.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                  <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                  <ChevronRight className="w-4 h-4" />
              </Button>
          </div>
      </div>
    </Card>
  );
};
