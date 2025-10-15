'use client';

import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { encodeFunctionData, type Address } from 'viem';
import { useSmartAccount } from '@/lib/contexts/ZeroDevSmartWalletProvider';
import { getCourseTokenId } from '@/lib/courseToken';

// SimpleBadge contract ABI for enrollment
const SIMPLE_BADGE_ABI = [
  {
    type: 'function',
    name: 'claimBadge',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

interface SponsoredEnrollmentState {
  isEnrolling: boolean;
  enrollmentHash: `0x${string}` | null;
  enrollmentError: string | null;
  enrollmentSuccess: boolean;
}

interface UseSponsoredEnrollmentProps {
  courseSlug: string;
  courseId: string;
}

const getContractAddress = (): Address => {
  const address = process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  if (!address || address === '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
    throw new Error('Contract address not configured');
  }
  
  const trimmedAddress = address.trim();
  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
    throw new Error(`Invalid contract address format: ${trimmedAddress}`);
  }
  
  return trimmedAddress as Address;
};

export function useSponsoredEnrollment({ courseSlug, courseId }: UseSponsoredEnrollmentProps) {
  const { authenticated, ready } = usePrivy();
  const {
    smartAccountAddress,
    isSmartAccountReady,
    canSponsorTransaction,
    executeTransaction,
    error: smartAccountError,
    isLoading: smartAccountLoading,
  } = useSmartAccount();

  const [state, setState] = useState<SponsoredEnrollmentState>({
    isEnrolling: false,
    enrollmentHash: null,
    enrollmentError: null,
    enrollmentSuccess: false,
  });

  const enrollWithSponsorship = useCallback(async () => {
    if (!ready || !authenticated) {
      setState(prev => ({
        ...prev,
        enrollmentError: 'User not authenticated',
      }));
      return;
    }

    if (!isSmartAccountReady || !smartAccountAddress || !canSponsorTransaction) {
      setState(prev => ({
        ...prev,
        enrollmentError: 'Smart account not ready for sponsored transactions',
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isEnrolling: true,
        enrollmentError: null,
        enrollmentHash: null,
        enrollmentSuccess: false,
      }));

      const tokenId = getCourseTokenId(courseSlug, courseId);
      const contractAddress = getContractAddress();

      console.log('[SPONSORED ENROLLMENT] Starting sponsored enrollment:', {
        courseSlug,
        courseId,
        tokenId: tokenId.toString(),
        smartAccountAddress,
        contractAddress,
      });

      // Encode the claimBadge function call
      const data = encodeFunctionData({
        abi: SIMPLE_BADGE_ABI,
        functionName: 'claimBadge',
        args: [tokenId, smartAccountAddress],
      });

      // Execute sponsored transaction through smart account
      const hash = await executeTransaction({
        to: contractAddress,
        data,
        value: 0n,
      });

      if (hash) {
        console.log('[SPONSORED ENROLLMENT] Enrollment transaction sent:', hash);
        setState(prev => ({
          ...prev,
          enrollmentHash: hash,
          enrollmentSuccess: true,
        }));
      } else {
        throw new Error('Transaction execution failed');
      }

    } catch (error) {
      console.error('[SPONSORED ENROLLMENT] Enrollment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Enrollment failed';
      setState(prev => ({
        ...prev,
        enrollmentError: errorMessage,
      }));
    } finally {
      setState(prev => ({
        ...prev,
        isEnrolling: false,
      }));
    }
  }, [
    ready,
    authenticated,
    isSmartAccountReady,
    smartAccountAddress,
    canSponsorTransaction,
    courseSlug,
    courseId,
    executeTransaction,
  ]);

  const resetEnrollment = useCallback(() => {
    setState({
      isEnrolling: false,
      enrollmentHash: null,
      enrollmentError: null,
      enrollmentSuccess: false,
    });
  }, []);

  // Combine smart account and enrollment errors
  const combinedError = state.enrollmentError || smartAccountError;
  const isLoading = state.isEnrolling || smartAccountLoading;

  return {
    // Enrollment state
    isEnrolling: state.isEnrolling,
    enrollmentHash: state.enrollmentHash,
    enrollmentError: combinedError,
    enrollmentSuccess: state.enrollmentSuccess,
    
    // Smart account state
    isSmartAccountReady,
    smartAccountAddress,
    canSponsorTransaction,
    
    // Actions
    enrollWithSponsorship,
    resetEnrollment,
    
    // Combined loading state
    isLoading,
  };
}

/**
 * Hook for sponsored module completion
 */
interface UseSponsoredModuleCompletionProps {
  courseSlug: string;
  courseId: string;
}

export function useSponsoredModuleCompletion({ 
  courseSlug, 
  courseId 
}: UseSponsoredModuleCompletionProps) {
  const { authenticated, ready } = usePrivy();
  const {
    smartAccountAddress,
    isSmartAccountReady,
    canSponsorTransaction,
    executeTransaction,
    error: smartAccountError,
    isLoading: smartAccountLoading,
  } = useSmartAccount();

  const [state, setState] = useState({
    isCompleting: false,
    completionHash: null as `0x${string}` | null,
    completionError: null as string | null,
    completionSuccess: false,
  });

  const completeModuleWithSponsorship = useCallback(async (moduleIndex: number) => {
    if (!ready || !authenticated) {
      setState(prev => ({
        ...prev,
        completionError: 'User not authenticated',
      }));
      return;
    }

    if (!isSmartAccountReady || !smartAccountAddress || !canSponsorTransaction) {
      setState(prev => ({
        ...prev,
        completionError: 'Smart account not ready for sponsored transactions',
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isCompleting: true,
        completionError: null,
        completionHash: null,
        completionSuccess: false,
      }));

      const tokenId = getCourseTokenId(courseSlug, courseId);
      const contractAddress = getContractAddress();

      console.log('[SPONSORED MODULE COMPLETION] Starting sponsored module completion:', {
        courseSlug,
        courseId,
        moduleIndex,
        tokenId: tokenId.toString(),
        smartAccountAddress,
        contractAddress,
      });

      // Encode the completeModule function call
      const data = encodeFunctionData({
        abi: [
          {
            type: 'function',
            name: 'completeModule',
            inputs: [
              { name: 'tokenId', type: 'uint256' },
              { name: 'moduleIndex', type: 'uint256' },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        functionName: 'completeModule',
        args: [tokenId, BigInt(moduleIndex)],
      });

      // Execute sponsored transaction through smart account
      const hash = await executeTransaction({
        to: contractAddress,
        data,
        value: 0n,
      });

      if (hash) {
        console.log('[SPONSORED MODULE COMPLETION] Module completion transaction sent:', hash);
        setState(prev => ({
          ...prev,
          completionHash: hash,
          completionSuccess: true,
        }));
      } else {
        throw new Error('Transaction execution failed');
      }

    } catch (error) {
      console.error('[SPONSORED MODULE COMPLETION] Module completion failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Module completion failed';
      setState(prev => ({
        ...prev,
        completionError: errorMessage,
      }));
    } finally {
      setState(prev => ({
        ...prev,
        isCompleting: false,
      }));
    }
  }, [
    ready,
    authenticated,
    isSmartAccountReady,
    smartAccountAddress,
    canSponsorTransaction,
    courseSlug,
    courseId,
    executeTransaction,
  ]);

  const resetCompletion = useCallback(() => {
    setState({
      isCompleting: false,
      completionHash: null,
      completionError: null,
      completionSuccess: false,
    });
  }, []);

  const combinedError = state.completionError || smartAccountError;
  const isLoading = state.isCompleting || smartAccountLoading;

  return {
    // Module completion state
    isCompleting: state.isCompleting,
    completionHash: state.completionHash,
    completionError: combinedError,
    completionSuccess: state.completionSuccess,
    
    // Smart account state
    isSmartAccountReady,
    smartAccountAddress,
    canSponsorTransaction,
    
    // Actions
    completeModuleWithSponsorship,
    resetCompletion,
    
    // Combined loading state
    isLoading,
  };
}