import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/templates/DashboardLayout';
import { Dashboard } from '../features/dashboard';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { WalletPage } from '../features/wallet/routes/WalletPage';
import { TradesPage } from '../features/trades/routes/TradesPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { StrategyBuilderPage } from '../features/strategy-builder/pages/StrategyBuilderPage';
import { ChartPage } from '../features/chart/pages/ChartPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { StrategiesPage } from '../features/strategies/pages/StrategiesPage';
import { StrategySettingsPage } from '../features/strategies/pages/StrategySettingsPage';
import { AlgoPage } from '../features/algo/pages/AlgoPage';
import { SignalsPage } from '../features/signal/pages/SignalsPage';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary><div className="p-8 text-center">An error occurred. Please try again.</div></ErrorBoundary>,
    children: [
      {
        path: '/',
        element: <DashboardLayout />,
        errorElement: <ErrorBoundary><div className="p-8 text-center">An error occurred loading the dashboard.</div></ErrorBoundary>,
        children: [
          { 
            index: true, 
            element: <ErrorBoundary><Dashboard /></ErrorBoundary> 
          },
          { 
            path: 'chart', 
            element: <ErrorBoundary><ChartPage /></ErrorBoundary> 
          },
          { 
            path: 'trades', 
            element: <ErrorBoundary><TradesPage /></ErrorBoundary> 
          },
          { 
            path: 'signals', 
            element: <ErrorBoundary><SignalsPage /></ErrorBoundary> 
          },
          { 
            path: 'strategies', 
            element: <ErrorBoundary><StrategiesPage /></ErrorBoundary> 
          },
          { 
            path: 'strategies/settings', 
            element: <ErrorBoundary><StrategySettingsPage /></ErrorBoundary> 
          },
          { 
            path: 'algo', 
            element: <ErrorBoundary><AlgoPage /></ErrorBoundary> 
          },
          { 
            path: 'wallet', 
            element: <ErrorBoundary><WalletPage /></ErrorBoundary> 
          },
          { 
            path: 'strategy-builder', 
            element: <ErrorBoundary><StrategyBuilderPage /></ErrorBoundary> 
          },
          { 
            path: 'strategy-builder/:id', 
            element: <ErrorBoundary><StrategyBuilderPage /></ErrorBoundary> 
          },
          { 
            path: 'settings', 
            element: <ErrorBoundary><SettingsPage /></ErrorBoundary> 
          },
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
