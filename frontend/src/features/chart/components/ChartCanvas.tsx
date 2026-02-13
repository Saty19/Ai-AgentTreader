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

    const { state, dispatch } = useChartStore();
    const { symbol, indicators, activeTrades = [], activeTool, drawings } = state;
    const { data: rawData, realtimeCandle } = useChartData();
    const { signals, realtimeSignal } = useChartSignals(symbol);

    const priceLineRefs = useRef<any[]>([]);
    const customDrawingRefs = useRef<any[]>([]);

    // ... (memoize)
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
                rightOffset: 12, // Add space for future candles
                barSpacing: 6,   // Better default spacing
            },
            rightPriceScale: {
                borderColor: '#e2e8f0',
                autoScale: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
            },
            handleScroll: {
                pressedMouseMove: true,
                vertTouchDrag: true,
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

    // Handle Map Interaction (Drawing)
    useEffect(() => {
        if (!chartRef.current || !candleSeriesRef.current) return;

        const handleChartClick = (param: any) => {
           if (!param.point || !candleSeriesRef.current) return;
           
           if (activeTool === 'horizontal') {
               const price = candleSeriesRef.current.coordinateToPrice(param.point.y);
               if (price) {
                   dispatch({ 
                       type: 'ADD_DRAWING', 
                       payload: { id: Date.now(), type: 'horizontal', price: price } 
                   });
                   // Reset tool to cursor? Or keep drawing? Keep drawing is standard.
               }
           } else if (activeTool === 'eraser') {
               // Simple "remove last" logic for now as hit testing is complex without overlay
               // Or we can assume the user wants to clear if they click with eraser
               // Better: Rely on Toolbar button for clear? 
               // For this interaction: Find nearest drawing? Too complex for 1-shot.
               // Let's implement Eraser as "Clear All Drawings" on click for MVP or just "Remove Last"
               // Actually, let's make the Eraser tool Click remove the LAST drawing.
               if (drawings.length > 0) {
                   dispatch({ type: 'REMOVE_DRAWING', payload: drawings[drawings.length - 1].id });
               }
           }
        };

        chartRef.current.subscribeClick(handleChartClick);
        return () => {
            if (chartRef.current) {
                // unsubscribeClick is not always available in all versions or called differently?
                // LW Charts 3.x/4.x supports subscribeClick.
                try {
                    chartRef.current.unsubscribeClick(handleChartClick);
                } catch(e) {}
            }
        };
    }, [activeTool, drawings, dispatch]);

    // Render Drawings
    useEffect(() => {
        if (!candleSeriesRef.current) return;

        // Clear old
        customDrawingRefs.current.forEach(line => {
            try {
                candleSeriesRef.current!.removePriceLine(line);
            } catch(e) {}
        });
        customDrawingRefs.current = [];

        // Add new
        drawings.forEach(d => {
            if (d.type === 'horizontal') {
                const line = candleSeriesRef.current!.createPriceLine({
                    price: d.price,
                    color: '#8b5cf6', // Violet
                    lineWidth: 2,
                    lineStyle: 0,
                    axisLabelVisible: true,
                    title: 'Line',
                });
                customDrawingRefs.current.push(line);
            }
        });

    }, [drawings]);

    // 3. Process Indicators (EMA & RSI)
    useEffect(() => {
        if (!chartRef.current || historicalData.length === 0) return;

        // Clear existing indicators
        const chart = chartRef.current;
        indicatorSeriesRefs.current.forEach(series => {
            try {
                if (series && chart) {
                    chart.removeSeries(series);
                }
            } catch (error) {
                console.warn('Error removing series:', error);
            }
        });
        indicatorSeriesRefs.current.clear();

        // Add active indicators
        // Use Set to prevent duplicate re-additions if state somehow has duplicates (though context safeguards this now)
        const processedIds = new Set<string>();

        indicators.forEach(ind => {
            if (processedIds.has(ind.id)) return;
            processedIds.add(ind.id);

            if (ind.id === 'ema') {
                // EMA 5 (Fast - Green)
                const ema5Series = chartRef.current!.addSeries(LineSeries, {
                    color: '#10b981', 
                    lineWidth: 1,
                    title: 'EMA 5',
                    crosshairMarkerVisible: false,
                });
                const ema5Data = calculateEMA(historicalData, 5);
                ema5Series.setData(ema5Data);
                indicatorSeriesRefs.current.set('ema5', ema5Series);

                // EMA 26 (Medium - Blue)
                const ema26Series = chartRef.current!.addSeries(LineSeries, {
                    color: '#3b82f6', 
                    lineWidth: 2,
                    title: 'EMA 26',
                    crosshairMarkerVisible: false,
                });
                const ema26Data = calculateEMA(historicalData, 26);
                ema26Series.setData(ema26Data);
                indicatorSeriesRefs.current.set('ema26', ema26Series);

                // EMA 150 (Slow - Orange)
                const ema150Series = chartRef.current!.addSeries(LineSeries, {
                    color: '#f97316', 
                    lineWidth: 2,
                    title: 'EMA 150',
                    crosshairMarkerVisible: false,
                });
                const ema150Data = calculateEMA(historicalData, 150);
                ema150Series.setData(ema150Data);
                indicatorSeriesRefs.current.set('ema150', ema150Series);
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

        // Cleanup function to prevent errors when component unmounts
        return () => {
            const chart = chartRef.current;
            if (chart) {
                indicatorSeriesRefs.current.forEach(series => {
                    try {
                        if (series) {
                            chart.removeSeries(series);
                        }
                    } catch (error) {
                        // Ignore errors during cleanup
                    }
                });
            }
            indicatorSeriesRefs.current.clear();
        };

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
        if (candleSeriesRef.current) {
            priceLineRefs.current.forEach(line => {
                if (line && candleSeriesRef.current) {
                    candleSeriesRef.current.removePriceLine(line);
                }
            });
        }
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
