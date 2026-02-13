import { useQuery } from '@tanstack/react-query';
import { fetchStats, fetchTrades } from '../api/client';
import type { Trade, Stats } from '../../../types'; 

export const useStats = () => {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 60000,
  });
};

export const useTrades = () => {
  return useQuery<Trade[]>({
    queryKey: ['trades'],
    queryFn: fetchTrades,
  });
};
