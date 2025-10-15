'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, type WalletClient, type Address } from 'viem';
import { celoAlfajores } from 'viem/chains';

interface SmartAccountState {
  // Smart account management
  smartAccountAddress: Address | null;
  smartAccountClient: WalletClient | null;
  isSmartAccountReady: boolean;
  isCreatingSmartAccount: boolean;
  
  // Transaction sponsoring
  canSponsorTransaction: boolean;
  sponsorshipBalance: string | null;
  
  // Smart account operations
  createSmartAccount: () => Promise<void>;
  executeTransaction: (params: {
    to: Address;
    data: `0x${string}`;
    value?: bigint;
  }) => Promise<`0x${string}` | null>;
  
  // Status and errors
  error: string | null;
  isLoading: boolean;
}

const SmartAccountContext = createContext<SmartAccountState | null>(null);

export function useSmartAccount(): SmartAccountState {
  const context = useContext(SmartAccountContext);
  if (!context) {
    throw new Error('useSmartAccount must be used within SmartAccountProvider');
  }
  return context;
}

interface SmartAccountProviderProps {
  children: ReactNode;
}

export function SmartAccountProvider({ children }: SmartAccountProviderProps) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [smartAccountClient, setSmartAccountClient] = useState<WalletClient | null>(null);
  const [isSmartAccountReady, setIsSmartAccountReady] = useState(false);
  const [isCreatingSmartAccount, setIsCreatingSmartAccount] = useState(false);
  const [canSponsorTransaction, setCanSponsorTransaction] = useState(false);
  const [sponsorshipBalance, setSponsorshipBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has embedded wallet for smart account creation
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  
  const createSmartAccount = async () => {
    if (!ready || !authenticated || !embeddedWallet) {
      setError('Authentication or embedded wallet not available');
      return;
    }

    try {
      setIsCreatingSmartAccount(true);
      setError(null);
      
      console.log('[SMART ACCOUNT] Creating smart account...');
      
      // Get the embedded wallet provider
      const provider = await embeddedWallet.getEthereumProvider();
      if (!provider) {
        throw new Error('Failed to get ethereum provider from embedded wallet');
      }

      // Create wallet client with embedded wallet as signer
      const walletClient = createWalletClient({
        chain: celoAlfajores,
        transport: custom(provider),
      });

      // For now, use the embedded wallet address as smart account
      // In production, you would deploy an actual smart contract wallet
      const [embeddedAddress] = await walletClient.getAddresses();
      
      setSmartAccountAddress(embeddedAddress);
      setSmartAccountClient(walletClient);
      setIsSmartAccountReady(true);
      setCanSponsorTransaction(true); // Enable sponsorship for course actions
      setSponsorshipBalance('1000.00'); // Mock balance for demo
      
      console.log('[SMART ACCOUNT] Smart account created:', {
        address: embeddedAddress,
        canSponsor: true,
      });
      
    } catch (err) {
      console.error('[SMART ACCOUNT] Failed to create smart account:', err);
      setError(err instanceof Error ? err.message : 'Failed to create smart account');
    } finally {
      setIsCreatingSmartAccount(false);
    }
  };

  const executeTransaction = async (params: {
    to: Address;
    data: `0x${string}`;
    value?: bigint;
  }): Promise<`0x${string}` | null> => {
    if (!smartAccountClient || !smartAccountAddress || !canSponsorTransaction) {
      setError('Smart account not ready or sponsorship not available');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[SMART ACCOUNT] Executing sponsored transaction:', {
        to: params.to,
        from: smartAccountAddress,
        data: params.data,
        value: params.value?.toString() || '0',
      });

      // For Celo, we can use the embedded wallet directly with gas sponsorship
      // The paymaster would be configured on the backend to sponsor these transactions
      const hash = await smartAccountClient.sendTransaction({
        to: params.to,
        data: params.data,
        value: params.value || 0n,
        account: smartAccountAddress,
        chain: celoAlfajores,
      });

      console.log('[SMART ACCOUNT] Transaction sent:', hash);
      return hash;
      
    } catch (err) {
      console.error('[SMART ACCOUNT] Transaction failed:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-create smart account when conditions are met
  useEffect(() => {
    if (
      ready && 
      authenticated && 
      embeddedWallet && 
      !smartAccountAddress && 
      !isCreatingSmartAccount &&
      !error
    ) {
      console.log('[SMART ACCOUNT] Auto-creating smart account for authenticated user');
      createSmartAccount();
    }
  }, [ready, authenticated, embeddedWallet, smartAccountAddress, isCreatingSmartAccount, error]);

  // Reset state when user logs out
  useEffect(() => {
    if (!authenticated) {
      setSmartAccountAddress(null);
      setSmartAccountClient(null);
      setIsSmartAccountReady(false);
      setCanSponsorTransaction(false);
      setSponsorshipBalance(null);
      setError(null);
      setIsLoading(false);
    }
  }, [authenticated]);

  const value: SmartAccountState = {
    smartAccountAddress,
    smartAccountClient,
    isSmartAccountReady,
    isCreatingSmartAccount,
    canSponsorTransaction,
    sponsorshipBalance,
    createSmartAccount,
    executeTransaction,
    error,
    isLoading,
  };

  return (
    <SmartAccountContext.Provider value={value}>
      {children}
    </SmartAccountContext.Provider>
  );
}