import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address } from 'viem';
import { moduleTokenId } from '@/lib/milestones';

// MilestoneBadge contract ABI - focused on the functions we need for modules
const MILESTONE_BADGE_ABI = [
  {
    type: 'function',
    name: 'claim',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
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

// Get contract address from environment
const getContractAddress = (): Address => {
  const address = process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  if (!address || address === '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
    throw new Error('MilestoneBadge contract address not configured');
  }
  
  const trimmedAddress = address.trim();
  
  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
    throw new Error(`Invalid contract address format: ${trimmedAddress}`);
  }
  
  return trimmedAddress as Address;
};

// Hook to check if a user has claimed a specific module badge
export function useHasModuleBadge(userAddress?: Address, tokenId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: MILESTONE_BADGE_ABI,
    functionName: 'balanceOf',
    args: userAddress && tokenId !== undefined ? [userAddress, tokenId] : undefined,
    query: {
      enabled: !!userAddress && tokenId !== undefined,
    },
  });
}

// Hook to check if a user has claimed a specific module
export function useHasClaimedModule(userAddress?: Address, tokenId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: MILESTONE_BADGE_ABI,
    functionName: 'claimed',
    args: userAddress && tokenId !== undefined ? [userAddress, tokenId] : undefined,
    query: {
      enabled: !!userAddress && tokenId !== undefined,
    },
  });
}

// Hook to claim a module completion badge
export function useClaimModuleBadge() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const claimModule = (tokenId: bigint) => {
    return writeContract({
      address: getContractAddress(),
      abi: MILESTONE_BADGE_ABI,
      functionName: 'claim',
      args: [tokenId],
    });
  };

  return {
    claimModule,
    hash,
    error,
    isPending,
  };
}

// Hook to wait for transaction confirmation
export function useModuleTransactionStatus(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });
}

// Combined hook for claiming module badges with status tracking
export function useClaimModuleBadgeWithStatus() {
  const { claimModule, hash, error, isPending } = useClaimModuleBadge();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useModuleTransactionStatus(hash);

  return {
    claimModule,
    hash,
    error: error || confirmError,
    isPending,
    isConfirming,
    isSuccess,
  };
}

// Hook specifically for module completion with all the data needed
export function useModuleCompletion(
  courseSlug: string, 
  moduleIndex: number, 
  userAddress?: Address
) {
  const tokenId = moduleTokenId(courseSlug, moduleIndex);
  const hasModuleBadge = useHasModuleBadge(userAddress, tokenId);
  const hasClaimed = useHasClaimedModule(userAddress, tokenId);
  const { claimModule, hash, error, isPending, isConfirming, isSuccess } = useClaimModuleBadgeWithStatus();

  const completeModule = () => {
    return claimModule(tokenId);
  };

  return {
    tokenId,
    hasModuleBadge: (hasModuleBadge.data ?? 0n) > 0n,
    hasClaimed: hasClaimed.data || false,
    isLoading: hasModuleBadge.isLoading || hasClaimed.isLoading,
    completeModule,
    completionHash: hash,
    completionError: error,
    isCompleting: isPending,
    isConfirmingCompletion: isConfirming,
    completionSuccess: isSuccess,
  };
}
