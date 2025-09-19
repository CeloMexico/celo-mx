'use client';
import Section from '@/components/Section';
import { useState } from 'react';

export default function DashboardPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [chainId] = useState(42220); // Mock Celo mainnet
  const addr = authenticated ? '0x1234...5678' : '—';

  const login = () => {
    setAuthenticated(true);
  };

  if (!authenticated) {
    return (
      <Section title="Dashboard protegido">
        <p className="mb-4">Inicia sesión para continuar.</p>
        <button className="px-4 py-2 rounded-lg bg-black text-white" onClick={login}>Conectar</button>
      </Section>
    );
  }

  return (
    <div className="space-y-10 pb-24">
      <Section title="Tu progreso on-chain" subtitle="Mock de retos y estado de cuenta">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="celo-card celo-border border rounded-2xl p-6">
            <div className="text-sm opacity-70">Chain ID</div>
            <div className="text-2xl font-display">{chainId ?? '—'}</div>
          </div>
          <div className="celo-card celo-border border rounded-2xl p-6">
            <div className="text-sm opacity-70">Wallet</div>
            <div className="text-2xl break-all font-display">{addr}</div>
          </div>
          <div className="celo-card celo-border border rounded-2xl p-6">
            <div className="text-sm opacity-70">Retos</div>
            <div className="text-2xl font-display">3/6</div>
          </div>
        </div>
      </Section>
    </div>
  );
}



