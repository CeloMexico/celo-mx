'use client';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/toast';
import { PrivyProvider } from '@privy-io/react-auth';
import { celoAlfajores } from 'viem/chains';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { wagmiConfig } from '@/lib/wagmi';
import { SmartAccountProvider } from '@/lib/contexts/SmartAccountContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        loginMethods: ['wallet', 'email'],
        appearance: {
          theme: 'light',
          accentColor: '#FCFF52',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: celoAlfajores,
        supportedChains: [celoAlfajores],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <SmartAccountProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SmartAccountProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}


