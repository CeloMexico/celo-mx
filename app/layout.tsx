import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { ContractDebug } from '@/components/debug/ContractDebug';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'CELO Mexico',
  description: 'Celo Mexico: el hub para builders y comunidad.',
  openGraph: {
    title: 'CELO Mexico',
    description: 'Celo Mexico: el hub para builders y comunidad.',
    type: 'website',
    url: 'https://celo-mexico.local',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CELO Mexico',
    description: 'Celo Mexico: el hub para builders y comunidad.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        
      </head>
      <body className={`${inter.variable} min-h-screen antialiased bg-celo-bg text-celo-fg font-sans`} style={{ ['--font-display' as any]: 'GT Alpina Trial Fine, ui-serif, system-ui' }}>
        <ThemeProvider>
          <Providers>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 overflow-x-hidden">{children}</main>
              <Footer />
            </div>
            <ContractDebug />
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
