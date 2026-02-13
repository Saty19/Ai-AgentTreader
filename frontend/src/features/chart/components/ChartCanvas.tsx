import { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { createChart, ColorType, CandlestickSeries, CrosshairMode, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useChartStore } from '../store/ChartContext';
import { useChartData } from '../hooks/useChartData';
import { useChartSignals } from '../hooks/useChartSignals';
import { calculateEMA } from '../plugins/indicators/EMA';
import { calculateRSI } from '../plugins/indicators/RSI';

export interface ChartCanvasRef {
    chart: IChartApi | null;
}

export const ChartCanvas = forwardRef<ChartCanvasRef, {}>((_props, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const indicatorSeriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

    const { state } = useChartStore();
    const { symbol, indicators, activeTrades = [] } = state;
    const { data: rawData, realtimeCandle } = useChartData();
    const { signals, realtimeSignal } = useChartSignals(symbol);

    const priceLineRefs = useRef<any[]>([]);

    // Memoize and sanitize data to ensure strict number types for ChartData compatibility
    const historicalData = useMemo(() => {
        if (!rawData || !Array.isArray(rawData)) return [];
        return [...rawData]
            .map(d => ({
                ...d,
                open: Number(d.open),
                high: Number(d.high),
                low: Number(d.low),
                close: Number(d.close),
                // Ensure time is a number (seconds), supporting both string/number inputs
                time: Number(d.time) as any 
            }))
            .sort((a, b) => a.time - b.time)
            .filter((v, i, a) => i === 0 || v.time !== a[i - 1].time) as any[]; // Cast to any to bypass strict LW/ChartData matching for now, handled by runtime numbers
    }, [rawData]);

    // 1. Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#ffffff' },
                textColor: '#1e293b', // Slate-800
                fontFamily: "'Inter', sans-serif",
            },
            grid: {
                vertLines: { color: '#f1f5f9' },
                horzLines: { color: '#f1f5f9' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            crosshair: {
                mode: CrosshairMode.Normal,
            },
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
            upColor: '#10b981', // Emerald-500
            downColor: '#ef4444', // Red-500
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;

        // Resize observer
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, []);

    // 2. Load Historical Data & Signals
    useEffect(() => {
        if (!candleSeriesRef.current || historicalData.length === 0) return;

        try {
            candleSeriesRef.current.setData(historicalData);
        } catch (err) {
            console.error("Failed to set chart data", err);
        }
        
        // Load Signals
        if (signals && Array.isArray(signals) && signals.length > 0) {
            // Ensure markers are sorted by time
            const sortedSignals = [...signals].sort((a, b) => (a.time as number) - (b.time as number));
            // @ts-ignore
            candleSeriesRef.current.setMarkers(sortedSignals);
        }

        chartRef.current?.timeScale().fitContent();

    }, [historicalData, signals]);

    // 3. Process Indicators (EMA & RSI)
    useEffect(() => {
        if (!chartRef.current || historicalData.length === 0) return;

        // Clear existing indicators
        indicatorSeriesRefs.current.forEach(series => chartRef.current?.removeSeries(series));
        indicatorSeriesRefs.current.clear();

        // Add active indicators
        indicators.forEach(ind => {
            if (ind.id === 'ema') {
                const lineSeries = chartRef.current!.addSeries(LineSeries, {
                    color: '#3b82f6', // Blue-500
                    lineWidth: 2,
                    title: 'EMA 20',
                });
                const emaData = calculateEMA(historicalData, 20);
                lineSeries.setData(emaData);
                indicatorSeriesRefs.current.set(ind.id, lineSeries);
            }
            else if (ind.id === 'rsi') {
                const rsiSeries = chartRef.current!.addSeries(LineSeries, {
                    color: '#8b5cf6', // Violet-500
                    lineWidth: 2,
                    title: 'RSI 14',
                    priceScaleId: 'rsi-scale', // Separate scale
                });
                
                chartRef.current!.priceScale('rsi-scale').applyOptions({
                    scaleMargins: {
                        top: 0.7, // Place at bottom 30%
                        bottom: 0,
                    },
                });

                const rsiData = calculateRSI(historicalData, 14);
                rsiSeries.setData(rsiData);
                indicatorSeriesRefs.current.set(ind.id, rsiSeries);
            }
        });

    }, [indicators, historicalData]);

    // 4. Update Realtime (Price & Signals)
    useEffect(() => {
        if (!candleSeriesRef.current) return;
        
        if (realtimeCandle) {
            candleSeriesRef.current.update({ ...realtimeCandle, time: realtimeCandle.time as Time });
            
            // Update EMA if active
            const emaSeries = indicatorSeriesRefs.current.get('ema');
            if (emaSeries && historicalData) {
                 // Simple realtime update for EMA (simplified) - skipped for now
            }
        }

        if (realtimeSignal) {
             const currentMarkers = (candleSeriesRef.current as any).markers();
             (candleSeriesRef.current as any).setMarkers([...currentMarkers, realtimeSignal].sort((a: any, b: any) => (a.time as number) - (b.time as number)));
        }

    }, [realtimeCandle, realtimeSignal]);

    // 5. Visualize Active Trades (Entry, SL, TP)
    useEffect(() => {
        if (!candleSeriesRef.current || !activeTrades) return;

        // Clear existing lines
        priceLineRefs.current.forEach(line => candleSeriesRef.current?.removePriceLine(line));
        priceLineRefs.current = [];

        activeTrades.forEach(trade => {
            if (trade.status !== 'OPEN') return;

            const entryPrice = typeof trade.entryPrice === 'string' ? parseFloat(trade.entryPrice) : trade.entryPrice;
            const stopLoss = typeof trade.stopLoss === 'string' ? parseFloat(trade.stopLoss) : trade.stopLoss;
            const takeProfit = typeof trade.takeProfit === 'string' ? parseFloat(trade.takeProfit) : trade.takeProfit;

            // Entry Line
            const entryLine = candleSeriesRef.current!.createPriceLine({
                price: entryPrice,
                color: '#3b82f6',
                lineWidth: 2,
                lineStyle: 2, // Dashed
                axisLabelVisible: true,
                title: `ENTRY #${trade.id}`,
            });
            priceLineRefs.current.push(entryLine);

            // SL Line
            if (stopLoss) {
                const slLine = candleSeriesRef.current!.createPriceLine({
                    price: stopLoss,
                    color: '#ef4444',
                    lineWidth: 2,
                    lineStyle: 0, // Solid
                    axisLabelVisible: true,
                    title: `SL #${trade.id}`,
                });
                priceLineRefs.current.push(slLine);
            }

            // TP Line
            if (takeProfit) {
                const tpLine = candleSeriesRef.current!.createPriceLine({
                    price: takeProfit,
                    color: '#10b981',
                    lineWidth: 2,
                    lineStyle: 0, // Solid
                    axisLabelVisible: true,
                    title: `TP #${trade.id}`,
                });
                priceLineRefs.current.push(tpLine);
            }
        });

    }, [activeTrades]);

    // 6. Media Capture & Fullscreen Helpers
    const toggleFullscreen = () => {
        if (!chartContainerRef.current) return;
        if (!document.fullscreenElement) {
            chartContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const takeScreenshot = () => {
        if (!chartRef.current) return;
        const screenshot = chartRef.current.takeScreenshot();
        screenshot.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chart-${symbol}-${new Date().getTime()}.png`;
            link.click();
            URL.revokeObjectURL(url);
        });
    };

    const startRecording = () => {
        // Basic screen record logic can be complex, for now we will alert that it is coming or provide a basic stub
        alert("Screen recording feature is initializing... (Requires MediaRecorder API integration)");
        // In a real app we'd use navigator.mediaDevices.getDisplayMedia or capture chart canvas
    };

    // Expose helpers
    useImperativeHandle(ref, () => ({
        chart: chartRef.current,
        toggleFullscreen,
        takeScreenshot,
        startRecording
    }));

    return (
        <div className="relative w-full h-[500px] border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div ref={chartContainerRef} className="w-full h-full" />
            
            {/* Overlay Info */}
            <div className="absolute top-4 left-4 z-10 pointers-events-none">
                 <div className="flex items-center space-x-2">
                     <span className="text-slate-900 font-bold text-lg">{symbol}</span>
                     <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Crypto</span>
                 </div>
            </div>
        </div>
    );
});
