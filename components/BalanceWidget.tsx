'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/wallet/viemClient';
import { formatEther } from 'viem';
import { Wallet, Coins } from 'lucide-react';
import PrivyLogin from './PrivyLogin';

interface BalanceWidgetProps {
  className?: string;
}

export default function BalanceWidget({ className = '' }: BalanceWidgetProps) {
  const { authenticated, user } = usePrivy();
  const [celoBalance, setCeloBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>('');

  // Extract address from Privy user
  useEffect(() => {
    if (authenticated && user) {
      const direct = (user as any)?.wallet?.address as string | undefined;
      const fromLinked = (user as any)?.linkedAccounts?.find((a: any) => a?.type === 'wallet' && a?.address)?.address as string | undefined;
      const userAddress = direct || fromLinked || '';
      setAddress(userAddress);
    } else {
      setAddress('');
      setCeloBalance('0');
    }
  }, [authenticated, user]);

  // Fetch CELO balance
  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const balance = await publicClient.getBalance({
          address: address as `0x${string}`,
        });
        const formattedBalance = formatEther(balance);
        setCeloBalance(parseFloat(formattedBalance).toFixed(4));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setCeloBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address]);

  const truncateAddress = (addr: string) => {
    return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
  };

  if (!authenticated) {
    return (
      <div className={`celo-card celo-border rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display celo-heading">Balance</h3>
          <Wallet className="w-5 h-5 celo-heading" />
        </div>
        <div className="text-center py-8">
          <p className="text-sm celo-text mb-4">Conecta tu wallet para ver tu balance</p>
          <PrivyLogin />
        </div>
      </div>
    );
  }

  return (
    <div className={`celo-card celo-border rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display celo-heading">Balance</h3>
        <Wallet className="w-5 h-5 celo-heading" />
      </div>
      
      <div className="space-y-4">
        {/* Address */}
        <div className="flex items-center justify-between p-3 celo-border border rounded-xl">
          <span className="text-sm celo-text">Dirección</span>
          <span className="font-mono text-sm celo-heading">{truncateAddress(address)}</span>
        </div>

        {/* CELO Balance */}
        <div className="flex items-center justify-between p-3 celo-border border rounded-xl">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 celo-heading" />
            <span className="text-sm celo-text">CELO</span>
          </div>
          <span className="font-semibold celo-heading">
            {loading ? '...' : `${celoBalance} CELO`}
          </span>
        </div>

        {/* cUSD Placeholder */}
        <div className="flex items-center justify-between p-3 celo-border border rounded-xl opacity-60">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 celo-text" />
            <span className="text-sm celo-text">cUSD</span>
          </div>
          <div className="text-right">
            <span className="font-semibold celo-text">-- cUSD</span>
            <p className="text-xs celo-text opacity-70">Sincroniza al conectar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

