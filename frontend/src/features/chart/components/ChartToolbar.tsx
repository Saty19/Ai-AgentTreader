import React, { useState, useRef, useEffect } from 'react';
import { useChartStore } from '../store/ChartContext';
import type { Timeframe } from '../types';
import { ChevronDown, BarChart2, Maximize, Camera, Video, Settings, Layout, Check } from 'lucide-react';

interface ChartToolbarProps {
    chartRef: React.RefObject<any>;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({ chartRef }) => {
    const { state, dispatch } = useChartStore();
    const { timeframe, market, symbol, indicators } = state;
    const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const timeframes: Timeframe[] = ['1m', '3m', '5m', '15m', '1h', '4h', '1d'];

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsIndicatorMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const availableIndicators = [
        { id: 'ema', name: 'EMA Strategy' },
        { id: 'rsi', name: 'RSI (Relative Strength)' }
    ];

    const toggleIndicator = (id: string, name: string) => {
        const exists = indicators.find(i => i.id === id);
        if (exists) {
            dispatch({ type: 'REMOVE_INDICATOR', payload: id });
        } else {
            dispatch({ type: 'ADD_INDICATOR', payload: { id, name, type: 'overlay', calculate: () => [], draw: () => {} } });
        }
        setIsIndicatorMenuOpen(false);
    };

    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
            <div className="flex items-center space-x-4">
                {/* Market Selector */}
                <div className="flex items-center space-x-1 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                     <span className="font-bold text-slate-700">{symbol}</span>
                     <span className="text-xs text-slate-400 bg-slate-100 px-1 rounded border border-slate-200 uppercase">{market}</span>
                     <ChevronDown size={14} className="text-slate-400" />
                </div>
                
                <div className="h-6 w-px bg-slate-200 mx-2" />

                {/* Timeframes */}
                <div className="flex bg-slate-50 rounded p-0.5 border border-slate-200">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => dispatch({ type: 'SET_TIMEFRAME', payload: tf })}
                            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                                timeframe === tf 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
                
                <div className="h-6 w-px bg-slate-200 mx-2" />

                <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => setIsIndicatorMenuOpen(!isIndicatorMenuOpen)}
                      className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${isIndicatorMenuOpen ? 'bg-slate-100 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <BarChart2 size={16} />
                        <span>Indicators</span>
                        <ChevronDown size={14} />
                    </button>

                    {isIndicatorMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
                            <div className="p-2">
                                <span className="text-xs font-semibold text-slate-400 px-2 uppercase mb-2 block">Strategies</span>
                                {availableIndicators.map((ind) => {
                                    const isActive = indicators.some(i => i.id === ind.id);
                                    return (
                                        <button
                                            key={ind.id}
                                            onClick={() => toggleIndicator(ind.id, ind.name)}
                                            className="w-full flex items-center justify-between px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                                        >
                                            <span className={isActive ? 'font-medium text-blue-600' : ''}>{ind.name}</span>
                                            {isActive && <Check size={14} className="text-blue-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <button 
                    onClick={() => chartRef.current?.takeScreenshot()}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded flex items-center gap-1 text-xs font-medium transition-colors"
                    title="Take Screenshot"
                >
                    <Camera size={16} />
                    <span className="hidden sm:inline">Capture</span>
                </button>
                <button 
                    onClick={() => chartRef.current?.startRecording()}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded flex items-center gap-1 text-xs font-medium transition-colors"
                    title="Start Recording"
                >
                    <Video size={16} />
                    <span className="hidden sm:inline">Record</span>
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1" />
                <button 
                    onClick={() => chartRef.current?.toggleFullscreen()}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded flex items-center gap-1 text-xs font-medium transition-colors"
                    title="Toggle Fullscreen"
                >
                    <Maximize size={16} />
                    <span className="hidden sm:inline">Fullscreen</span>
                </button>
            </div>
        </div>
    );
};
