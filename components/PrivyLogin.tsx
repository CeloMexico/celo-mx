'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  LogOut, 
  User, 
  Wallet, 
  ExternalLink,
  ChevronDown,
  Globe
} from 'lucide-react';

export default function PrivyLogin() {
  const { authenticated, login, logout, user } = usePrivy();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const addr = useMemo(() => {
    const direct = (user as any)?.wallet?.address as string | undefined;
    if (direct) return direct;
    const fromLinked = (user as any)?.linkedAccounts?.find((a: any) => a?.type === 'wallet' && a?.address)?.address as string | undefined;
    return fromLinked ?? '';
  }, [user]);

  function truncate(a: string) {
    return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
  }

  const copyAddress = async () => {
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!authenticated) {
    return (
      <button 
        onClick={() => login()} 
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-celo-yellow to-celo-lime text-celo-black dark:text-celo-black rounded-xl text-xs sm:text-sm font-medium hover:from-celo-yellowAlt hover:to-celo-yellow transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
      >
        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden xs:inline">Conectar Wallet</span>
        <span className="xs:hidden">Conectar</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Wallet Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-xl bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/30 rounded-xl text-xs sm:text-sm hover:bg-white/40 dark:hover:bg-black/40 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-ping opacity-75" />
          </div>
          <span className="font-mono text-xs text-celo-black dark:text-celo-yellow">{truncate(addr)}</span>
        </div>
        <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform text-celo-black/70 dark:text-celo-yellow/70 ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Glassmorphism */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 backdrop-blur-3xl bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/30 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          
          <div className="relative p-4 sm:p-5 space-y-3 sm:space-y-4">
            {/* Wallet Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-celo-black dark:text-celo-yellow">
                <Wallet className="w-3 h-3" />
                <span>Wallet Conectada</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/25 dark:bg-black/25 border border-white/30 dark:border-white/25 backdrop-blur-md">
                <span className="font-mono text-sm text-celo-black dark:text-celo-yellow font-semibold">{truncate(addr)}</span>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/30 hover:bg-white/40 border border-white/40 rounded-lg transition-all duration-200 backdrop-blur-lg text-celo-black dark:text-celo-yellow font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 font-medium">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Network Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-celo-black dark:text-celo-yellow">
                <Globe className="w-3 h-3" />
                <span>Red</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/25 dark:bg-black/25 border border-white/30 dark:border-white/25 backdrop-blur-md">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-sm text-celo-black dark:text-celo-yellow font-semibold">Celo Mainnet</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2">
              {/* Account Button */}
              <button
                onClick={() => {
                  router.push('/dashboard');
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-celo-black dark:text-celo-yellow hover:bg-white/30 dark:hover:bg-black/30 rounded-xl transition-all duration-200 backdrop-blur-lg group font-medium"
              >
                <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Mi Cuenta</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Disconnect Button */}
              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/30 rounded-xl transition-all duration-200 backdrop-blur-lg group font-medium"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Desconectar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


