import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/templates/DashboardLayout';
import { Dashboard } from '../features/dashboard';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { WalletPage } from '../features/wallet/routes/WalletPage';
import { TradesPage } from '../features/trades/routes/TradesPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Placeholder Pages
const ChartPage = () => <div className="p-4 bg-white shadow rounded-lg">Chart Page Placeholder</div>;
const SettingsPage = () => <div className="p-4 bg-white shadow rounded-lg">Settings Page Placeholder</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'chart', element: <ChartPage /> },
          { path: 'trades', element: <TradesPage /> },
          { path: 'wallet', element: <WalletPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
