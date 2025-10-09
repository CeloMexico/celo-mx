import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect } from 'wagmi';
import { type Address, encodeFunctionData } from 'viem';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// SimpleBadge contract ABI - focused on the functions we need
const SIMPLE_BADGE_ABI = [
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
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

// Get contract address from environment
const getContractAddress = (): Address => {
  const address = process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  if (!address || address === '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
    throw new Error('SimpleBadge contract address not configured');
  }
  
  // Trim whitespace and validate the address format
  const trimmedAddress = address.trim();
  
  // Basic validation: should start with 0x and be 42 characters long
  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
    throw new Error(`Invalid contract address format: ${trimmedAddress}`);
  }
  
  return trimmedAddress as Address;
};

// Hook to check if a user has claimed a specific badge
export function useHasBadge(userAddress?: Address, tokenId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: SIMPLE_BADGE_ABI,
    functionName: 'hasBadge',
    args: userAddress && tokenId !== undefined ? [userAddress, tokenId] : undefined,
    query: {
      enabled: !!userAddress && tokenId !== undefined,
    },
  });
}

// Hook to check if a user has claimed a specific token
export function useHasClaimed(userAddress?: Address, tokenId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: SIMPLE_BADGE_ABI,
    functionName: 'claimed',
    args: userAddress && tokenId !== undefined ? [userAddress, tokenId] : undefined,
    query: {
      enabled: !!userAddress && tokenId !== undefined,
    },
  });
}

// Hook to get user's badge balance for a specific token
export function useBadgeBalance(userAddress?: Address, tokenId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: SIMPLE_BADGE_ABI,
    functionName: 'balanceOf',
    args: userAddress && tokenId !== undefined ? [userAddress, tokenId] : undefined,
    query: {
      enabled: !!userAddress && tokenId !== undefined,
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

  const claimBadge = async (tokenId: bigint) => {
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
          abi: SIMPLE_BADGE_ABI,
          functionName: 'claim',
          args: [tokenId],
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
        abi: SIMPLE_BADGE_ABI,
        functionName: 'claim',
        args: [tokenId],
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

  const adminMint = (to: Address, tokenId: bigint, amount: bigint = 1n) => {
    return writeContract({
      address: getContractAddress(),
      abi: SIMPLE_BADGE_ABI,
      functionName: 'adminMint',
      args: [to, tokenId, amount],
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

// Legacy course mapping for backward compatibility
// These courses will keep their hardcoded token IDs
export const LEGACY_COURSE_TOKEN_IDS = {
  'desarrollo-dapps': 1n,
  'defi-fundamentals': 2n,
  'nft-development': 3n,
  'web3-security': 4n,
} as const;

/**
 * Generate a token ID from a course database ID
 * Converts string CUID to a numeric token ID for smart contract
 */
export function generateTokenIdFromCourseId(courseId: string): bigint {
  // Take the last 8 characters of the course ID and convert to number
  const suffix = courseId.slice(-8);
  let hash = 0;
  
  // Create a simple hash from the suffix
  for (let i = 0; i < suffix.length; i++) {
    const char = suffix.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive number and add offset to avoid conflicts with legacy IDs
  const tokenId = Math.abs(hash % 1000000) + 100; // Keep it reasonable for smart contracts
  return BigInt(tokenId);
}

/**
 * Get token ID for a course - checks legacy mapping first, then generates from course ID
 */
export function getCourseTokenId(courseSlug: string, courseId?: string): bigint {
  // Check legacy mapping first
  const legacyTokenId = LEGACY_COURSE_TOKEN_IDS[courseSlug as keyof typeof LEGACY_COURSE_TOKEN_IDS];
  if (legacyTokenId) {
    return legacyTokenId;
  }
  
  // Generate dynamic token ID from course database ID
  if (courseId) {
    return generateTokenIdFromCourseId(courseId);
  }
  
  // Fallback: generate from slug hash (less ideal but works)
  let hash = 0;
  for (let i = 0; i < courseSlug.length; i++) {
    const char = courseSlug.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const tokenId = Math.abs(hash % 1000000) + 1000; // Different offset for slug-based IDs
  return BigInt(tokenId);
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
