import type { IIndicator, ChartData } from '../../types';

export const EMAIndicator: IIndicator = {
    id: 'ema',
    name: 'Exponential Moving Average',
    type: 'overlay',
    calculate: (data: ChartData[]) => {
        const period = 20; // Default
        const k = 2 / (period + 1);
        let ema = data[0].close;
        return data.map((d, i) => {
            if (i === 0) return { time: d.time, value: ema };
            ema = d.close * k + ema * (1 - k);
            return { time: d.time, value: ema };
        });
    },
    draw: (_chart: any, _seriesRef: any, _data: any[]) => {
        // This logic might be handled by the Canvas, but if we need custom drawing:
        // For LW charts, we usually just addSeries and setData.
        // So 'draw' here might just return config or handle the series creation?
        // Let's assume the Canvas handles series creation based on 'type' and we just return config.
        // Actually, the requirement said "Implement: EMA, RSI...".
        // Let's refine the IIndicator interface later if needed. 
        // For now, I'll calculate in the Canvas using this logic.
    }
};

// Helper for generic EMA
export const calculateEMA = (data: ChartData[], period: number) => {
    const k = 2 / (period + 1);
    let ema = data[0].close;
    return data.map((d, i) => {
        if (i === 0) return { time: d.time as any, value: ema };
        ema = d.close * k + ema * (1 - k);
        return { time: d.time as any, value: ema };
    });
};
