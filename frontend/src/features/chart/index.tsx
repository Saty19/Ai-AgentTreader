import React, { useEffect } from 'react';
import { ChartProvider, useChartStore } from './store/ChartContext';
import { ChartCanvas } from './components/ChartCanvas';
import { ChartToolbar } from './components/ChartToolbar';
import { DrawingToolbar } from './components/DrawingToolbar';

interface AdvancedChartProps {
    activeTrades?: any[];
}

const ChartDataSynchronizer: React.FC<{ activeTrades?: any[] }> = ({ activeTrades }) => {
    const { dispatch } = useChartStore();

    useEffect(() => {
        if (activeTrades) {
            dispatch({ type: 'SET_TRADES', payload: activeTrades });
        }
    }, [activeTrades, dispatch]);

    return null;
};

export const ChartContent: React.FC<AdvancedChartProps> = ({ activeTrades }) => {
    const chartRef = React.useRef<any>(null);

    return (
        <>
            <ChartDataSynchronizer activeTrades={activeTrades} />
            <div className="flex flex-col h-[600px] border border-slate-200 bg-white shadow-sm rounded-lg overflow-hidden">
                {/* Top Toolbar */}
                <ChartToolbar chartRef={chartRef} />
                
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Toolbar */}
                    <DrawingToolbar />
                    
                    {/* Main Chart Area */}
                    <div className="flex-1 relative bg-white">
                        <ChartCanvas ref={chartRef} />
                    </div>
                </div>
            </div>
        </>
    );
};

export const AdvancedChart: React.FC<AdvancedChartProps> = (props) => {
    return (
        <ChartProvider>
            <ChartContent {...props} />
        </ChartProvider>
    );
};
