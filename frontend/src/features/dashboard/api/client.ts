import { config } from '../../../config';

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
