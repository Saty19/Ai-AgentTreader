import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { useSocket } from '../../../context/SocketContext';
import { Card } from '../../../components/atoms/Card'; 

interface TradingChartProps {
  symbol: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema26SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema150SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const { socket } = useSocket();
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' }, 
        textColor: '#334155', 
      },
      grid: {
        vertLines: { color: '#f1f5f9' }, 
        horzLines: { color: '#f1f5f9' }, 
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#e2e8f0',
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const ema5Series = chart.addSeries(LineSeries, { color: '#2563eb', lineWidth: 2, title: 'EMA 5' });
    const ema26Series = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2, title: 'EMA 26' });
    const ema150Series = chart.addSeries(LineSeries, { color: '#db2777', lineWidth: 2, title: 'EMA 150' });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ema5SeriesRef.current = ema5Series;
    ema26SeriesRef.current = ema26Series;
    ema150SeriesRef.current = ema150Series;
    
    // Resize observer
    const handleResize = () => {
        if (chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
    };
    
    window.addEventListener('resize', handleResize);

    setInit(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!socket || !init) return;

    // Listen for real-time updates
    const handlePriceUpdate = (candle: any) => {
        if (candleSeriesRef.current) {
            candleSeriesRef.current.update(candle);
        }
    };

    const handleIndicatorUpdate = (indicators: any) => {
        const time = Date.now() / 1000 as any;
        if (indicators.ema5 && ema5SeriesRef.current) {
             ema5SeriesRef.current.update({ time, value: indicators.ema5 });
        }
        if (indicators.ema26 && ema26SeriesRef.current) {
             ema26SeriesRef.current.update({ time, value: indicators.ema26 });
        }
        if (indicators.ema150 && ema150SeriesRef.current) {
             ema150SeriesRef.current.update({ time, value: indicators.ema150 });
        }
    };
    
    socket.on('price_update', handlePriceUpdate);
    socket.on('indicator_update', handleIndicatorUpdate);

    return () => {
        socket.off('price_update', handlePriceUpdate);
        socket.off('indicator_update', handleIndicatorUpdate);
    };
  }, [socket, init]);

  return (
    <Card className="p-0 overflow-hidden h-[500px] relative">
      <div ref={chartContainerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-2 py-1 rounded shadow-sm border border-slate-200">
        <span className="text-slate-900 font-bold text-sm">{symbol}</span>
      </div>
    </Card>
  );
};
