import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext.tsx';
import { AuthProvider } from './features/auth/hooks/useAuth.tsx';
import { WalletProvider } from './features/wallet/hooks/useWallet.tsx';
import { router } from './routes/index.tsx';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <AuthProvider>
          <WalletProvider>
            <RouterProvider router={router} />
          </WalletProvider>
        </AuthProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
