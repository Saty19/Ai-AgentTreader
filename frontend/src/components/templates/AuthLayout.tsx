import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">EMA Strategy Bot</h1>
            <p className="text-slate-500">Sign in to your dashboard</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
