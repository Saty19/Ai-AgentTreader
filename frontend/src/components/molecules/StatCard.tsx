import React from 'react';
import { Card } from '../atoms/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon?: React.ElementType;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, trendValue, icon: Icon }) => {
  return (
    <Card className="flex items-start justify-between p-5 hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        
        {(trend) && (
             <div className="flex items-center mt-2">
                {trend === 'up' ? (
                   <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                ) : (
                   <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={clsx(
                   "text-sm font-medium",
                   trend === 'up' ? "text-emerald-600" : "text-red-600"
                )}>
                   {trendValue}
                </span>
                <span className="text-xs text-slate-400 ml-1">vs last month</span>
             </div>
        )}
      </div>
      
      {Icon && (
         <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
            <Icon className="w-6 h-6" />
         </div>
      )}
    </Card>
  );
};
