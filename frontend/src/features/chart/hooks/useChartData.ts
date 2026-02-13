import { useQuery } from '@tanstack/react-query';
import { fetchCandles } from '../../../api/client';
import { useChartStore } from '../store/ChartContext';
import { useSocket } from '../../../context/SocketContext';
import { useEffect, useState } from 'react';
import type { ChartData } from '../types';

export const useChartData = () => {
  const { state } = useChartStore();
  const { symbol, timeframe, market } = state;
  const { socket } = useSocket();
  const [realtimeCandle, setRealtimeCandle] = useState<ChartData | null>(null);

  // 1. Fetch Historical Data
  const { data: historicalData, isLoading, error, refetch } = useQuery({
    queryKey: ['candles', symbol, timeframe, market],
    queryFn: () => fetchCandles(symbol, timeframe),
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 min cache
  });

  // 2. Realtime Updates
  useEffect(() => {
    if (!socket || market !== 'crypto') return; 

    const handlePriceUpdate = (candle: any) => {
        // Only update if symbol matches
        if (candle.symbol && candle.symbol.toLowerCase() !== symbol.toLowerCase()) return;
        
        // Transform to ChartData if needed
        const newCandle: ChartData = {
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume
        };
        setRealtimeCandle(newCandle);
    };

    socket.on('price_update', handlePriceUpdate);
    return () => {
        socket.off('price_update', handlePriceUpdate);
    };
  }, [socket, symbol, market]);

  return {
    data: historicalData,
    realtimeCandle,
    isLoading,
    error,
    refetch
  };
};
