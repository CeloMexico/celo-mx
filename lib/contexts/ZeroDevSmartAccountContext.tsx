import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, http, custom } from "viem";
import {
  createZeroDevPaymasterClient,
  createKernelAccount,
  createKernelAccountClient,
} from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { celoAlfajores } from "viem/chains";

type SmartWalletContextType = {
  kernelClient: any; // ZeroDev Kernel client type
  smartAccountAddress: `0x${string}` | null;
  isInitializing: boolean;
  error: Error | null;
  canSponsorTransaction: boolean;
  executeTransaction: (params: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
  }) => Promise<`0x${string}` | null>;
};

const SmartWalletContext = createContext<SmartWalletContextType>({
  kernelClient: null,
  smartAccountAddress: null,
  isInitializing: false,
  error: null,
  canSponsorTransaction: false,
  executeTransaction: async () => null,
});

export const ZeroDevSmartAccountProvider = ({
  children,
  zeroDevProjectId,
}: {
  children: React.ReactNode;
  zeroDevProjectId: string;
}) => {
  const { wallets } = useWallets();
  const { authenticated } = usePrivy();
  const [kernelClient, setKernelClient] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<
    `0x${string}` | null
  >(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeTransaction = async (params: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
  }): Promise<`0x${string}` | null> => {
    if (!kernelClient || !smartAccountAddress) {
      console.error('[ZERODEV] No kernel client available for transaction');
      return null;
    }

    try {
      console.log('[ZERODEV] Executing sponsored transaction:', {
        to: params.to,
        from: smartAccountAddress,
        data: params.data.slice(0, 10),
        value: params.value?.toString() || '0',
      });

      // ZeroDev kernel client handles gas sponsorship automatically
      const hash = await kernelClient.sendTransaction({
        to: params.to,
        data: params.data,
        value: params.value || 0n,
      });

      console.log('[ZERODEV] Transaction sent:', hash);
      return hash;
    } catch (err) {
      console.error('[ZERODEV] Transaction failed:', err);
      throw err;
    }
  };

  useEffect(() => {
    const initializeSmartWallet = async () => {
      if (!authenticated || !wallets || wallets.length === 0) {
        setKernelClient(null);
        setSmartAccountAddress(null);
        setIsInitializing(false);
        return;
      }

      try {
        setIsInitializing(true);
        setError(null);
        console.log('🔄 [ZERODEV] Initializing smart wallet with wallets:', wallets);
        
        // Get EntryPoint v0.7 from ZeroDev SDK
        const entryPoint = getEntryPoint('0.7');
        
        // Look for either embedded wallet (email login) or connected wallet (MetaMask login)
        const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
        const connectedWallet = wallets.find((wallet) => wallet.walletClientType !== 'privy');
        
        const walletToUse = embeddedWallet || connectedWallet;
        if (!walletToUse) {
          console.log('⚠️ [ZERODEV] No wallet found for smart account creation');
          setIsInitializing(false);
          return;
        }
        
        console.log('🔧 [ZERODEV] Found wallet:', {
          address: walletToUse.address,
          type: walletToUse.walletClientType,
          isEmbedded: !!embeddedWallet,
          isConnected: !!connectedWallet
        });
        
        // Get the EIP1193 provider from the selected wallet
        const provider = await walletToUse.getEthereumProvider();
        if (!provider) {
          throw new Error('Failed to get Ethereum provider from wallet');
        }

        console.log('🔐 [ZERODEV] Creating ECDSA Kernel smart account...');
        
        // Create public client for blockchain interactions
        const publicClient = createPublicClient({
          chain: celoAlfajores,
          transport: http(),
        });
        
        // Create wallet client from the EIP-1193 provider
        const walletClient = createWalletClient({
          chain: celoAlfajores,
          transport: custom(provider),
        });
        
        console.log('🔐 [ZERODEV] Creating ECDSA validator...');
        
        // Create ECDSA validator using ZeroDev SDK
        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
          signer: walletClient as any, // Type assertion for compatibility
          entryPoint: entryPoint,
          kernelVersion: KERNEL_V3_1,
        });
        
        console.log('🔐 [ZERODEV] Creating Kernel account...');
        
        // Create Kernel account using ZeroDev SDK with proper version for EntryPoint v0.7
        const account = await createKernelAccount(publicClient, {
          plugins: {
            sudo: ecdsaValidator,
          },
          entryPoint: entryPoint,
          kernelVersion: KERNEL_V3_1,
        });

        console.log('🔧 [ZERODEV] Created smart account:', account.address);

        const bundlerUrl = `https://rpc.zerodev.app/api/v3/${zeroDevProjectId}/chain/${celoAlfajores.id}`;
        const paymasterUrl = `https://rpc.zerodev.app/api/v3/${zeroDevProjectId}/chain/${celoAlfajores.id}`;

        console.log('🔐 [ZERODEV] Creating paymaster client...');
        
        // Create paymaster client following ZeroDev docs pattern
        const paymasterClient = createZeroDevPaymasterClient({
          chain: celoAlfajores,
          transport: http(paymasterUrl),
        });
        
        console.log('🔐 [ZERODEV] Creating Kernel account client...');
        
        // Create Kernel client using ZeroDev SDK with paymaster
        const client = createKernelAccountClient({
          account,
          chain: celoAlfajores,
          bundlerTransport: http(bundlerUrl),
          paymaster: paymasterClient,
          client: publicClient,
        });
        
        console.log("✅ [ZERODEV] Smart account client created:", client.account.address);
        console.log("Chain ID:", await client.getChainId());

        setKernelClient(client);
        setSmartAccountAddress(account.address);
      } catch (err) {
        console.error("❌ [ZERODEV] Error initializing smart wallet:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeSmartWallet();
  }, [authenticated, wallets, zeroDevProjectId]);

  const canSponsorTransaction = !!(kernelClient && smartAccountAddress);

  return (
    <SmartWalletContext.Provider
      value={{ 
        kernelClient, 
        smartAccountAddress, 
        isInitializing, 
        error,
        canSponsorTransaction,
        executeTransaction,
      }}
    >
      {children}
    </SmartWalletContext.Provider>
  );
};

export const useZeroDevSmartAccount = () => {
  const context = useContext(SmartWalletContext);
  if (context === undefined) {
    throw new Error("useZeroDevSmartAccount must be used within a ZeroDevSmartAccountProvider");
  }
  return context;
};