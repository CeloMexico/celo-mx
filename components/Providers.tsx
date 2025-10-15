'use client';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/toast';
import { PrivyProvider } from '@privy-io/react-auth';
import { celoAlfajores } from 'viem/chains';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { wagmiConfig } from '@/lib/wagmi';
import { ZeroDevSmartAccountProvider } from '@/lib/contexts/ZeroDevSmartAccountContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // ZeroDev Project ID - for now using test project from Motus
  // TODO: Create dedicated Celo Academy ZeroDev project
  const zeroDevProjectId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || 'e46f4ac3-404e-42fc-a3d3-1c75846538a8';

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
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        defaultChain: celoAlfajores,
        supportedChains: [celoAlfajores],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <ZeroDevSmartAccountProvider zeroDevProjectId={zeroDevProjectId}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ZeroDevSmartAccountProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}


