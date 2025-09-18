import type { Metadata } from 'next'
import '../globals.css'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const Providers = dynamic(() => import('@/components/Providers'), { ssr: false })

export const metadata: Metadata = {
  title: 'Dashboard • CELO Mexico',
  description: 'Tu progreso on-chain',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`theme-yellow ${inter.variable} min-h-screen antialiased`} style={{ ['--font-display' as any]: 'GT Alpina Trial Fine, ui-serif, system-ui' }}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
