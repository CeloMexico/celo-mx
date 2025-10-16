'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect } from 'wagmi';
import { type Address, encodeFunctionData } from 'viem';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { LEGACY_COURSE_TOKEN_IDS, generateTokenIdFromCourseId, getCourseTokenId } from '@/lib/courseToken';

// Optimized contract ABI - matches the deployed OptimizedSimpleBadge contract
const OPTIMIZED_BADGE_ABI = [
  {
    type: 'function',
    name: 'enroll',
    inputs: [{ name: 'courseId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'completeModule',
    inputs: [
      { name: 'courseId', type: 'uint256' },
      { name: 'moduleIndex', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isEnrolled',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isModuleCompleted',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
      { name: 'moduleIndex', type: 'uint8' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getModulesCompleted',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalModulesCompleted',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

// Get contract address - prioritize optimized contract for consistency
const getContractAddress = (): Address => {
  // CRITICAL: Use same contract for both read and write operations
  // Priority: optimized contract > legacy contract > hardcoded optimized
  const optimizedAddress = process.env.NEXT_PUBLIC_OPTIMIZED_CONTRACT_ADDRESS_ALFAJORES;
  const legacyAddress = process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  
  // Use optimized contract if available (same as write operations)
  if (optimizedAddress && optimizedAddress !== '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
    const trimmed = optimizedAddress.trim();
    if (trimmed.startsWith('0x') && trimmed.length === 42) {
      console.log('[SIMPLE BADGE] Using optimized contract for reads:', trimmed);
      return trimmed as Address;
    }
  }
  
  // TEMPORARY FALLBACK: Use hardcoded optimized contract (matches write operations)
  const hardcodedOptimized = '0x525D78C03f3AA67951EA1b3fa1aD93DefF134ed0';
  console.log('[SIMPLE BADGE] Using hardcoded optimized contract for reads:', hardcodedOptimized);
  return hardcodedOptimized as Address;
  
  // Legacy fallback disabled to maintain consistency
  // if (legacyAddress && legacyAddress !== '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
  //   const trimmed = legacyAddress.trim();
  //   if (trimmed.startsWith('0x') && trimmed.length === 42) {
  //     console.log('[SIMPLE BADGE] Using legacy contract:', trimmed);
  //     return trimmed as Address;
  //   }
  // }
};

// Hook to check if a user is enrolled in a course (optimized contract)
export function useHasBadge(userAddress?: Address, courseId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: OPTIMIZED_BADGE_ABI,
    functionName: 'isEnrolled',
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

// Hook to check if a user is enrolled (same as useHasBadge for compatibility)
export function useHasClaimed(userAddress?: Address, courseId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: OPTIMIZED_BADGE_ABI,
    functionName: 'isEnrolled',
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

// Hook to get user's completed modules count for a course
export function useBadgeBalance(userAddress?: Address, courseId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: OPTIMIZED_BADGE_ABI,
    functionName: 'getModulesCompleted',
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
          abi: OPTIMIZED_BADGE_ABI,
          functionName: 'enroll',
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
        abi: OPTIMIZED_BADGE_ABI,
        functionName: 'enroll',
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
    // Note: adminMint function may not exist in optimized contract
    // This is kept for legacy compatibility but may need updating
    return writeContract({
      address: getContractAddress(),
      abi: OPTIMIZED_BADGE_ABI,
      functionName: 'enroll', // Using enroll instead of adminMint for consistency
      args: [courseId], // Simplified args for optimized contract
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
