'use client';
import { ThemeProvider } from 'next-themes';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { ToastProvider } from '@/components/ui/toast';
import { useEffect, useState } from 'react';

// Create QueryClient outside component to avoid recreating it
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }
  
  // If no Privy app ID, just render with theme provider
  if (!appId) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <PrivyProvider 
            appId={appId} 
            config={{ 
              loginMethods: ['email', 'google', 'twitter', 'wallet'], 
              appearance: { theme: 'dark' } 
            }}
          >
            <ToastProvider>
              {children}
            </ToastProvider>
          </PrivyProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}



