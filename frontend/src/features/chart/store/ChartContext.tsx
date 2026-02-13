import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { ChartState, Timeframe, IIndicator, IStrategyPlugin } from '../types';

type Action =
  | { type: 'SET_SYMBOL'; payload: string }
  | { type: 'SET_TIMEFRAME'; payload: Timeframe }
  | { type: 'SET_MARKET'; payload: 'crypto' | 'india' }
  | { type: 'ADD_INDICATOR'; payload: IIndicator }
  | { type: 'REMOVE_INDICATOR'; payload: string }
  | { type: 'SET_STRATEGY'; payload: IStrategyPlugin | null }
  | { type: 'SET_TRADES'; payload: any[] };

const initialState: ChartState = {
  symbol: 'BTCUSDT',
  timeframe: '1m',
  market: 'crypto',
  indicators: [],
  activeStrategy: null,
  drawings: [],
  activeTrades: [],
};

const chartReducer = (state: ChartState, action: Action): ChartState => {
  switch (action.type) {
    case 'SET_SYMBOL': return { ...state, symbol: action.payload };
    case 'SET_TIMEFRAME': return { ...state, timeframe: action.payload };
    case 'SET_MARKET': return { ...state, market: action.payload };
    case 'ADD_INDICATOR': return { ...state, indicators: [...state.indicators, action.payload] };
    case 'REMOVE_INDICATOR': return { ...state, indicators: state.indicators.filter(i => i.id !== action.payload) };
    case 'SET_STRATEGY': return { ...state, activeStrategy: action.payload };
    case 'SET_TRADES': return { ...state, activeTrades: action.payload };
    default: return state;
  }
};

const ChartContext = createContext<{ state: ChartState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

// Helper to load from storage
const loadState = (): ChartState => {
  try {
    const saved = localStorage.getItem('chart_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load chart state', e);
  }
  return initialState;
};

export const ChartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chartReducer, initialState, loadState);

  // Persist state changes
  React.useEffect(() => {
    try {
      const toSave = {
        symbol: state.symbol,
        timeframe: state.timeframe,
        indicators: state.indicators,
        market: state.market
      };
      localStorage.setItem('chart_state', JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save chart state', e);
    }
  }, [state.symbol, state.timeframe, state.indicators, state.market]);

  return (
    <ChartContext.Provider value={{ state, dispatch }}>
      {children}
    </ChartContext.Provider>
  );
};

export const useChartStore = () => {
  const context = useContext(ChartContext);
  if (!context) throw new Error('useChartStore must be used within ChartProvider');
  return context;
};
