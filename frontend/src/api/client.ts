import { config } from '../config';
import type { ChartData } from '../features/chart/types';

export const API_URL = config.apiBaseUrl;

export async function fetchTrades() {
  const res = await fetch(`${API_URL}/trades`);
  if (!res.ok) throw new Error('Failed to fetch trades');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchSignals(limit = 20) {
  const res = await fetch(`${API_URL}/signals?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch signals');
  return res.json();
}

export async function toggleAlgoStrategy(name: string, active: boolean) {
    const res = await fetch(`${API_URL}/algo/strategy/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, active })
    });
    if (!res.ok) throw new Error('Failed to toggle strategy');
    return res.json();
}

export async function fetchAlgoStatus() {
    const res = await fetch(`${API_URL}/algo/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
}

export async function fetchCandles(symbol: string, interval: string, limit = 1000): Promise<ChartData[]> {
  // Check if we are in Mock/India mode or Crypto
  // For now, assume backend proxy or direct if CORS allows (unlikely for Binance direct)
  // Let's assume we implement a backend proxy at /api/market/candles
  const res = await fetch(`${API_URL}/market/candles?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!res.ok) {
      // Fallback to Mock if 404/Error (until backend is ready)
      console.warn("Backend candles fetch failed, returning mock data");
      return generateMockCandles(limit);
  }
  return res.json();
}

function generateMockCandles(limit: number): ChartData[] {
    const candles: ChartData[] = [];
    let time = Math.floor(Date.now() / 1000) - (limit * 60);
    let price = 50000;
    
    for (let i = 0; i < limit; i++) {
        const change = (Math.random() - 0.5) * 200;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 50;
        const low = Math.min(open, close) - Math.random() * 50;
        
        candles.push({
            time: time + (i * 60),
            open,
            high,
            low,
            close,
            volume: Math.random() * 100
        });
        price = close;
    }
    return candles;
}
