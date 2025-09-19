import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
        <style dangerouslySetInnerHTML={{
          __html: `
            .theme-yellow {
              --celo-bg: #F7FF58;
              --celo-text: #0A0A0A;
              --celo-heading: #0A0A0A;
              --celo-card: #FFFFFF;
              --celo-border: #ECECEC;
            }
            .celo-bg { background: var(--celo-bg) !important; }
            .celo-text { color: var(--celo-text) !important; }
            .celo-heading { color: var(--celo-heading) !important; }
          `
        }} />
      </head>
      <body className={`theme-yellow ${inter.variable} min-h-screen antialiased celo-bg celo-text`} style={{ ['--font-display' as any]: 'GT Alpina Trial Fine, ui-serif, system-ui' }}>        
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 overflow-x-hidden">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
