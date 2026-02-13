import React, { createContext, useContext, useState, useEffect } from 'react';
import type { WalletState, WalletTransaction } from '../types';

interface WalletContextType extends WalletState {
  addFunds: (amount: number) => void;
  resetFunds: () => void;
  transactions: WalletTransaction[];
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WalletState>(() => {
    const saved = localStorage.getItem('wallet_state');
    return saved ? JSON.parse(saved) : {
      balance: 100000,
      equity: 100000,
      pnl: 0,
      currency: 'USD'
    };
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    localStorage.setItem('wallet_state', JSON.stringify(state));
  }, [state]);

  const addFunds = (amount: number) => {
    setState(prev => ({
      ...prev,
      balance: prev.balance + amount,
      equity: prev.equity + amount,
    }));
    
    setTransactions(prev => [{
       id: Date.now().toString(),
       type: 'DEPOSIT',
       amount,
       timestamp: Date.now(),
       description: 'Manual Deposit'
    }, ...prev]);
  };

  const resetFunds = () => {
     setState({
        balance: 100000,
        equity: 100000,
        pnl: 0,
        currency: 'USD'
     });
     setTransactions([]);
  };

  return (
    <WalletContext.Provider value={{ ...state, addFunds, resetFunds, transactions }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
