import { useQuery } from '@tanstack/react-query';
import { fetchSignals } from '../../../api/client';
import { useSocket } from '../../../context/SocketContext';
import { useEffect, useState } from 'react';
import type { SeriesMarker } from 'lightweight-charts';

export const useChartSignals = (symbol: string) => {
  const { socket } = useSocket();
  const [realtimeSignal, setRealtimeSignal] = useState<SeriesMarker<any> | null>(null);

  // 1. Fetch Historical Signals
  const { data: historicalSignals } = useQuery({
    queryKey: ['signals', symbol],
    queryFn: () => fetchSignals(50), // Fetch last 50 signals
    select: (data: any[]) => {
        // Filter by symbol and map to SeriesMarker
        return data
            .filter(s => s.symbol === symbol)
            .map(s => ({
                time: s.time || (new Date(s.createdAt).getTime() / 1000),
                position: s.side === 'BUY' ? 'belowBar' : 'aboveBar',
                color: s.side === 'BUY' ? '#22c55e' : '#ef4444',
                shape: s.side === 'BUY' ? 'arrowUp' : 'arrowDown',
                text: s.side,
            })) as SeriesMarker<any>[];
    },
    staleTime: 10000, 
  });

  // 2. Realtime Signals
  useEffect(() => {
    if (!socket) return;

    const handleSignal = (signal: any) => {
        if (signal.symbol !== symbol) return;

        const marker: SeriesMarker<any> = {
            time: signal.time || Math.floor(Date.now() / 1000),
            position: signal.side === 'BUY' ? 'belowBar' : 'aboveBar',
            color: signal.side === 'BUY' ? '#22c55e' : '#ef4444',
            shape: signal.side === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: signal.side,
        };
        setRealtimeSignal(marker);
    };

    socket.on('signal', handleSignal);
    return () => {
        socket.off('signal', handleSignal);
    };
  }, [socket, symbol]);

  return {
    signals: historicalSignals || [],
    realtimeSignal
  };
};
