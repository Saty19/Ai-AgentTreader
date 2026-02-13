import type { IIndicator, ChartData } from '../../types';

export const RSIIndicator: IIndicator = {
    id: 'rsi',
    name: 'Relative Strength Index',
    type: 'oscillator', // Renders in a separate pane below
    calculate: (_data: ChartData[]) => {
        // Calculation handled by helper below, invoked by Canvas
        return [];
    },
    draw: (_chart: any, _seriesRef: any, _data: any[]) => {
        // Drawing handled by Canvas
    }
};

export const calculateRSI = (data: ChartData[], period: number = 14) => {
    const rsiData: { time: any; value: number }[] = [];
    
    if (data.length < period + 1) return [];

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change >= 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // First RSI
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    
    rsiData.push({ time: data[period].time, value: rsi });

    // Subsequent RSI
    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        let gain = 0;
        let loss = 0;
        
        if (change >= 0) gain = change;
        else loss = -change;

        // Smoothed averages
        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;

        rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));

        rsiData.push({ time: data[i].time, value: rsi });
    }

    return rsiData;
};
