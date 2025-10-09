import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect } from 'wagmi';
import { type Address, parseEther } from 'viem';

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
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();

  const claimBadge = async (tokenId: bigint) => {
    // Ensure a connector is connected before writing
    if (!isConnected) {
      // Use only connectors that are ready
      const ready = connectors.filter((c) => (c as any)?.ready);
      // Prefer injected if available
      const injectedConnector = ready.find((c) => c.id === 'injected');
      const connector = injectedConnector || ready[0];
      if (!connector) {
        throw new Error('No wallet connector available. On mobile, open the site in your wallet\'s in-app browser (e.g., MetaMask) or configure WalletConnect in environment.');
      }
      await connectAsync({ connector });
    }

    return writeContract({
      address: getContractAddress(),
      abi: SIMPLE_BADGE_ABI,
      functionName: 'claim',
      args: [tokenId],
    });
  };

  return {
    claimBadge,
    hash,
    error,
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
