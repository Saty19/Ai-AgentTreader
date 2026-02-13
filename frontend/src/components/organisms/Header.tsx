import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useWallet } from '../../features/wallet/hooks/useWallet';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { balance } = useWallet();

  return (
    <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
         <div className="flex flex-col items-end mr-4 hidden sm:block">
            <span className="text-sm font-medium text-slate-700">{user?.email || 'Guest'}</span>
            <span className="text-xs text-primary-600 font-bold">${balance?.toFixed(2) || '0.00'}</span>
         </div>

         <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
         </button>

         <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
            {user ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
         </div>
      </div>
    </header>
  );
};
