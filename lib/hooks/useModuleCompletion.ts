'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect } from 'wagmi';
import { type Address } from 'viem';
import { getCourseTokenId } from '@/lib/courseToken';

// Optimized contract ABI (now properly deployed)
const OPTIMIZED_BADGE_ABI = [
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
    name: 'isEnrolled',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

// DEFINITIVE FIX: Use hardcoded optimized contract address
const getContractAddress = (): Address => {
  // HARDCODED: Use the ACTUAL deployed optimized contract
  const OPTIMIZED_CONTRACT_ADDRESS = '0x4193D2f9Bf93495d4665C485A3B8AadAF78CDf29';
  console.log('[MODULE COMPLETION] Using HARDCODED OPTIMIZED contract:', OPTIMIZED_CONTRACT_ADDRESS);
  return OPTIMIZED_CONTRACT_ADDRESS as Address;
};

// Hook to check if a user has completed a specific module
export function useHasCompletedModule(
  userAddress?: Address, 
  courseTokenId?: bigint,
  moduleIndex?: number
) {
  return useReadContract({
    address: getContractAddress(),
    abi: OPTIMIZED_BADGE_ABI,
    functionName: 'isModuleCompleted',
    args: userAddress && courseTokenId !== undefined && moduleIndex !== undefined 
      ? [userAddress, courseTokenId, moduleIndex + 1] // Convert to 1-based for contract
      : undefined,
    query: {
      enabled: !!userAddress && courseTokenId !== undefined && moduleIndex !== undefined,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  });
}

// Hook to get the total modules completed for a course
export function useModulesCompleted(userAddress?: Address, courseTokenId?: bigint) {
  return useReadContract({
    address: getContractAddress(),
    abi: OPTIMIZED_BADGE_ABI,
    functionName: 'getModulesCompleted',
    args: userAddress && courseTokenId !== undefined ? [userAddress, courseTokenId] : undefined,
    query: {
      enabled: !!userAddress && courseTokenId !== undefined,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  });
}

// Hook to complete a module (updates the NFT metadata state)
export function useCompleteModuleBadge() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();

  const completeModule = async (courseTokenId: bigint, moduleIndex: number) => {
    // Ensure connector is connected before write
    if (!isConnected) {
      const ready = connectors.filter((c) => (c as any)?.ready);
      const injectedConnector = ready.find((c) => c.id === 'injected');
      const connector = injectedConnector || ready[0];
      if (!connector) {
        throw new Error('No wallet connector available. On mobile, open the site in your wallet\'s in-app browser (e.g., MetaMask) or configure WalletConnect in environment.');
      }
      await connectAsync({ connector });
    }

    return writeContract({
      address: getContractAddress(),
      abi: OPTIMIZED_BADGE_ABI,
      functionName: 'completeModule',
      args: [courseTokenId, moduleIndex + 1], // Convert to 1-based for contract
    });
  };

  return {
    completeModule,
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

// Combined hook for completing modules with status tracking
export function useCompleteModuleWithStatus() {
  const { completeModule, hash, error, isPending } = useCompleteModuleBadge();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useModuleTransactionStatus(hash);

  return {
    completeModule,
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
  courseId: string,
  moduleIndex: number, 
  userAddress?: Address
) {
  // Use the course tokenId - all modules update the SAME NFT
  const courseTokenId = getCourseTokenId(courseSlug, courseId);
  
  const hasCompleted = useHasCompletedModule(userAddress, courseTokenId, moduleIndex);
  const modulesCompleted = useModulesCompleted(userAddress, courseTokenId);
  const { completeModule: completeModuleTx, hash, error, isPending, isConfirming, isSuccess } = useCompleteModuleWithStatus();

  const completeModule = () => {
    return completeModuleTx(courseTokenId, moduleIndex);
  };

  return {
    courseTokenId,
    moduleIndex,
    hasCompleted: hasCompleted.data || false,
    modulesCompleted: Number(modulesCompleted.data ?? 0n),
    isLoading: hasCompleted.isLoading || modulesCompleted.isLoading,
    completeModule,
    completionHash: hash,
    completionError: error,
    isCompleting: isPending,
    isConfirmingCompletion: isConfirming,
    completionSuccess: isSuccess,
  };
}
