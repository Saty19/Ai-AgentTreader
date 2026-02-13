import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LineChart, 
  Wallet, 
  Settings, 
  LogOut, 
  BarChart2, 
  Zap, 
  Bot, 
  Radio, 
  Layers 
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: LineChart, label: 'Chart', path: '/chart' },
  { icon: BarChart2, label: 'Trades', path: '/trades' },
  { icon: Radio, label: 'Signals', path: '/signals' },
  { icon: Zap, label: 'Strategies', path: '/strategies' },
  { icon: Layers, label: 'Strategy Builder', path: '/strategy-builder' },
  { icon: Bot, label: 'Algo Trading', path: '/algo' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user, logout } = useAuth();
  return (
    <aside className={clsx(
      "bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0",
      isOpen ? "w-64" : "w-20"
    )}>
      <div className="h-16 flex items-center justify-center border-b border-slate-200">
        <h1 className={clsx("font-bold text-xl text-primary-600", !isOpen && "hidden")}>TradeBot</h1>
        {!isOpen && <span className="font-bold text-xl text-primary-600">TB</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => clsx(
                  "flex items-center px-3 py-2.5 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={clsx("w-5 h-5 flex-shrink-0", isOpen ? "mr-3" : "mx-auto")} />
                {isOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-200">
        {isOpen && user && (
            <div className="px-3 py-2 mb-2 bg-slate-50 rounded-lg overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
                <p className="text-sm font-medium text-slate-700 truncate">{user.email}</p>
            </div>
        )}
        <button 
          onClick={logout}
          className={clsx(
            "flex items-center w-full px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors",
            !isOpen && "justify-center"
          )}
        >
          <LogOut className={clsx("w-5 h-5 flex-shrink-0", isOpen && "mr-3")} />
          {isOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
