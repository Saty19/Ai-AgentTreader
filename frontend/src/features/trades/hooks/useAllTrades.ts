import { useQuery } from '@tanstack/react-query';
import { fetchTrades } from '../../dashboard/api/client';
import type { Trade } from '../../../types';

export const useAllTrades = () => {
    return useQuery<Trade[]>({
        queryKey: ['trades', 'all'],
        queryFn: fetchTrades,
    });
};
