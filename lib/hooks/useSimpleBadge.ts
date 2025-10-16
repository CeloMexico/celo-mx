'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect } from 'wagmi';
import { type Address, encodeFunctionData } from 'viem';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { LEGACY_COURSE_TOKEN_IDS, generateTokenIdFromCourseId, getCourseTokenId } from '@/lib/courseToken';

// Legacy SimpleBadge contract ABI (the one that actually exists)
const LEGACY_BADGE_ABI = [
  {
    type: 'function',
    name: 'claim',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'adminMint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasBadge',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'claimed',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// EMERGENCY FIX: Use legacy contract that actually exists
const getContractAddress = (): Address => {
  // CRITICAL: The hardcoded optimized address doesn't exist!
  // Reverting to legacy contract until we properly deploy optimized
  const legacyAddress = process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  
  if (legacyAddress && legacyAddress !== '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
    const trimmed = legacyAddress.trim();
    if (trimmed.startsWith('0x') && trimmed.length === 42) {
      console.log('[SIMPLE BADGE] Using LEGACY contract (optimized contract not deployed):', trimmed);
      return trimmed as Address;
    }
  }
  
  // Fallback to hardcoded legacy address
  const hardcodedLegacy = '0x7Ed5CC0cf0B0532b52024a0DDa8fAE24C6F66dc3';
  console.log('[SIMPLE BADGE] Using hardcoded LEGACY contract:', hardcodedLegacy);
  return hardcodedLegacy as Address;
};

// Hook to check if a user has a badge (legacy contract)
export function useHasBadge(userAddress?: Address, tokenId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: LEGACY_BADGE_ABI,
    functionName: 'hasBadge',
    args: userAddress && tokenId !== undefined ? [userAddress, tokenId] : undefined,
    query: {
      enabled: !!userAddress && tokenId !== undefined,
      // Cache for 30 seconds to reduce redundant calls
      staleTime: 30 * 1000,
      // Keep in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests
      retry: 2,
    },
  });
}

// Hook to check if a user is enrolled (using legacy contract claimed mapping)
export function useHasClaimed(userAddress?: Address, courseId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: LEGACY_BADGE_ABI,
    functionName: 'claimed',
    args: userAddress && courseId !== undefined ? [userAddress, courseId] : undefined,
    query: {
      enabled: !!userAddress && courseId !== undefined,
      // Cache for 30 seconds to reduce redundant calls
      staleTime: 30 * 1000,
      // Keep in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests
      retry: 2,
    },
  });
}

// Hook to get user's badge balance (using legacy balanceOf)
export function useBadgeBalance(userAddress?: Address, courseId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: LEGACY_BADGE_ABI,
    functionName: 'balanceOf',
    args: userAddress && courseId !== undefined ? [userAddress, courseId] : undefined,
    query: {
      enabled: !!userAddress && courseId !== undefined,
      // Cache for 30 seconds to reduce redundant calls
      staleTime: 30 * 1000,
      // Keep in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests
      retry: 2,
    },
  });
}

// Hook to claim a badge (user function)
export function useClaimBadge() {
  const { writeContract, data: wagmiHash, error: wagmiError, isPending } = useWriteContract();
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [fallbackHash, setFallbackHash] = useState<`0x${string}` | undefined>(undefined);
  const [fallbackError, setFallbackError] = useState<Error | null>(null);

  const claimBadge = async (courseId: bigint) => {
    // 1) Try wagmi connector path first
    try {
      if (!isConnected) {
        const readyConnectors = connectors.filter((c) => (c as any)?.ready);
        const injected = readyConnectors.find((c) => c.id === 'injected');
        const connector = injected || readyConnectors[0];
        if (connector) {
          await connectAsync({ connector });
        }
      }
      if (isConnected) {
        return await writeContract({
          address: getContractAddress(),
          abi: LEGACY_BADGE_ABI,
          functionName: 'claim',
          args: [courseId],
        });
      }
    } catch (_) {
      // fallthrough to Privy fallback
    }

    // 2) Privy embedded wallet fallback (mobile Safari without connectors)
    try {
      if (!ready || !authenticated || !wallets || wallets.length === 0) {
        throw new Error('No Privy wallet available. Please sign in to Privy.');
      }
      const primary = wallets[0] as any;
      if (typeof primary.getEthereumProvider !== 'function') {
        throw new Error('Privy provider unavailable in this environment.');
      }
      const provider = await primary.getEthereumProvider();

      // Ensure we're on Celo Alfajores before sending tx (chainId 44787 = 0xaef3)
      await ensureCeloAlfajores(provider);

      const data = encodeFunctionData({
        abi: LEGACY_BADGE_ABI,
        functionName: 'claim',
        args: [courseId],
      });
      const from = primary.address || (await provider.request({ method: 'eth_accounts' }))[0];
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from, to: getContractAddress(), data, value: '0x0' }],
      });
      setFallbackHash(txHash as `0x${string}`);
      return txHash;
    } catch (err: any) {
      setFallbackError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  // Ensure Privy provider is connected to Celo Alfajores (44787)
  async function ensureCeloAlfajores(provider: any) {
    try {
      const desiredHex = '0xaef3'; // 44787
      const current = await provider.request({ method: 'eth_chainId' });
      if (typeof current === 'string' && current.toLowerCase() === desiredHex) return;
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: desiredHex }],
        });
        return;
      } catch (switchErr: any) {
        // 4902: Unrecognized chain
        if (switchErr?.code === 4902 || /unrecognized|unknown chain/i.test(String(switchErr?.message))) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: desiredHex,
                chainName: 'Celo Alfajores',
                nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
                rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
                blockExplorerUrls: ['https://alfajores.celoscan.io'],
              }],
            });
            // Try switching again after adding
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: desiredHex }],
            });
            return;
          } catch (_) {
            // If add/switch fails, continue; the tx may still succeed if provider routes correctly
          }
        }
        // If other switch errors, proceed without hard fail
      }
    } catch (_) {
      // Ignore chain detection errors; best-effort only
    }
  }

  return {
    claimBadge,
    hash: (wagmiHash as `0x${string}` | undefined) || fallbackHash,
    error: wagmiError || fallbackError,
    isPending,
  };
}

// Hook to admin mint badges
export function useAdminMintBadge() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const adminMint = (to: Address, courseId: bigint, amount: bigint = 1n) => {
    // Using legacy adminMint function
    return writeContract({
      address: getContractAddress(),
      abi: LEGACY_BADGE_ABI,
      functionName: 'adminMint',
      args: [to, courseId, amount],
    });
  };

  return {
    adminMint,
    hash,
    error,
    isPending,
  };
}

// Hook to wait for transaction confirmation
export function useBadgeTransactionStatus(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });
}

// Combined hook for claiming badges with status tracking
export function useClaimBadgeWithStatus() {
  const { claimBadge, hash, error, isPending } = useClaimBadge();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useBadgeTransactionStatus(hash);

  return {
    claimBadge,
    hash,
    error: error || confirmError,
    isPending,
    isConfirming,
    isSuccess,
  };
}

// Hook specifically for course enrollment badges
export function useCourseEnrollmentBadge(courseSlug: string, courseId?: string, userAddress?: Address) {
  const tokenId = getCourseTokenId(courseSlug, courseId);
  const hasBadge = useHasBadge(userAddress, tokenId);
  const hasClaimed = useHasClaimed(userAddress, tokenId);
  const { claimBadge, hash, error, isPending, isConfirming, isSuccess } = useClaimBadgeWithStatus();

  const enrollInCourse = () => {
    // With dynamic generation, we should always have a token ID
    return claimBadge(tokenId);
  };

  return {
    tokenId,
    hasBadge: hasBadge.data || false,
    hasClaimed: hasClaimed.data || false,
    isLoading: hasBadge.isLoading || hasClaimed.isLoading,
    enrollInCourse,
    enrollmentHash: hash,
    enrollmentError: error,
    isEnrolling: isPending,
    isConfirmingEnrollment: isConfirming,
    enrollmentSuccess: isSuccess,
  };
}
