'use client';

import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { encodeFunctionData, type Address } from 'viem';
import { useSmartAccount } from '@/lib/contexts/ZeroDevSmartWalletProvider';
import { getCourseTokenId } from '@/lib/courseToken';

// Optimized contract ABI for lower gas costs
const OPTIMIZED_BADGE_ABI = [
  {
    type: 'function',
    name: 'enroll',
    inputs: [
      { name: 'courseId', type: 'uint256' },
    ],
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
    name: 'adminMint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

interface ZeroDevTransactionState {
  isProcessing: boolean;
  transactionHash: `0x${string}` | null;
  error: string | null;
  success: boolean;
}

interface UseZeroDevEnrollmentProps {
  courseSlug: string;
  courseId: string;
}

const getContractAddress = (): Address => {
  // Use optimized contract for lower gas costs
  const address = process.env.NEXT_PUBLIC_OPTIMIZED_CONTRACT_ADDRESS_ALFAJORES || 
                 process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  if (!address || address === '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
    throw new Error('Contract address not configured');
  }
  
  const trimmedAddress = address.trim();
  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
    throw new Error(`Invalid contract address format: ${trimmedAddress}`);
  }
  
  return trimmedAddress as Address;
};

export function useZeroDevEnrollment({ courseSlug, courseId }: UseZeroDevEnrollmentProps) {
  const { authenticated, ready } = usePrivy();
  const {
    kernelClient,
    smartAccountAddress,
    isInitializing,
    canSponsorTransaction,
    executeTransaction,
    error: smartAccountError,
  } = useSmartAccount();

  const [enrollmentState, setEnrollmentState] = useState<ZeroDevTransactionState>({
    isProcessing: false,
    transactionHash: null,
    error: null,
    success: false,
  });

  const [moduleCompletionState, setModuleCompletionState] = useState<ZeroDevTransactionState>({
    isProcessing: false,
    transactionHash: null,
    error: null,
    success: false,
  });

  const [certificateState, setCertificateState] = useState<ZeroDevTransactionState>({
    isProcessing: false,
    transactionHash: null,
    error: null,
    success: false,
  });

  const enrollWithZeroDev = useCallback(async () => {
    if (!ready || !authenticated) {
      setEnrollmentState(prev => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    if (!canSponsorTransaction || !smartAccountAddress) {
      setEnrollmentState(prev => ({
        ...prev,
        error: 'Smart account not ready for sponsored transactions',
      }));
      return;
    }

    try {
      setEnrollmentState({
        isProcessing: true,
        transactionHash: null,
        error: null,
        success: false,
      });

      const tokenId = getCourseTokenId(courseSlug, courseId);
      const contractAddress = getContractAddress();

      console.log('[ZERODEV ENROLLMENT] Starting enrollment:', {
        courseSlug,
        courseId,
        tokenId: tokenId.toString(),
        smartAccountAddress,
        contractAddress,
      });

      // Encode the enroll function call (optimized contract)
      const data = encodeFunctionData({
        abi: OPTIMIZED_BADGE_ABI,
        functionName: 'enroll',
        args: [tokenId],
      });

      // Execute through ZeroDev with automatic gas sponsorship
      const hash = await executeTransaction({
        to: contractAddress,
        data,
        value: 0n,
      });

      if (hash) {
        console.log('[ZERODEV ENROLLMENT] Transaction sent:', hash);
        setEnrollmentState({
          isProcessing: false,
          transactionHash: hash,
          error: null,
          success: true,
        });
      } else {
        throw new Error('Transaction execution failed');
      }

    } catch (error) {
      console.error('[ZERODEV ENROLLMENT] Failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Enrollment failed';
      setEnrollmentState({
        isProcessing: false,
        transactionHash: null,
        error: errorMessage,
        success: false,
      });
    }
  }, [
    ready,
    authenticated,
    canSponsorTransaction,
    smartAccountAddress,
    courseSlug,
    courseId,
    executeTransaction,
  ]);

  const completeModuleWithZeroDev = useCallback(async (moduleIndex: number) => {
    if (!ready || !authenticated) {
      setModuleCompletionState(prev => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    if (!canSponsorTransaction || !smartAccountAddress) {
      setModuleCompletionState(prev => ({
        ...prev,
        error: 'Smart account not ready for sponsored transactions',
      }));
      return;
    }

    try {
      setModuleCompletionState({
        isProcessing: true,
        transactionHash: null,
        error: null,
        success: false,
      });

      const tokenId = getCourseTokenId(courseSlug, courseId);
      const contractAddress = getContractAddress();

      console.log('[ZERODEV MODULE] Starting module completion:', {
        courseSlug,
        courseId,
        moduleIndex,
        tokenId: tokenId.toString(),
        smartAccountAddress,
        contractAddress,
      });

      // Encode the completeModule function call
      const data = encodeFunctionData({
        abi: SIMPLE_BADGE_ABI,
        functionName: 'completeModule',
        args: [tokenId, BigInt(moduleIndex)],
      });

      // Execute through ZeroDev with automatic gas sponsorship
      const hash = await executeTransaction({
        to: contractAddress,
        data,
        value: 0n,
      });

      if (hash) {
        console.log('[ZERODEV MODULE] Transaction sent:', hash);
        setModuleCompletionState({
          isProcessing: false,
          transactionHash: hash,
          error: null,
          success: true,
        });
      } else {
        throw new Error('Transaction execution failed');
      }

    } catch (error) {
      console.error('[ZERODEV MODULE] Failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Module completion failed';
      setModuleCompletionState({
        isProcessing: false,
        transactionHash: null,
        error: errorMessage,
        success: false,
      });
    }
  }, [
    ready,
    authenticated,
    canSponsorTransaction,
    smartAccountAddress,
    courseSlug,
    courseId,
    executeTransaction,
  ]);

  const generateCertificateWithZeroDev = useCallback(async () => {
    if (!ready || !authenticated) {
      setCertificateState(prev => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    if (!canSponsorTransaction || !smartAccountAddress) {
      setCertificateState(prev => ({
        ...prev,
        error: 'Smart account not ready for sponsored transactions',
      }));
      return;
    }

    try {
      setCertificateState({
        isProcessing: true,
        transactionHash: null,
        error: null,
        success: false,
      });

      const tokenId = getCourseTokenId(courseSlug, courseId);
      const contractAddress = getContractAddress();

      console.log('[ZERODEV CERTIFICATE] Starting certificate generation:', {
        courseSlug,
        courseId,
        tokenId: tokenId.toString(),
        smartAccountAddress,
        contractAddress,
      });

      // Encode the adminMint function call for certificate
      // Use a different token ID for certificates (tokenId + 1000)
      const data = encodeFunctionData({
        abi: SIMPLE_BADGE_ABI,
        functionName: 'adminMint',
        args: [smartAccountAddress, tokenId + 1000n, 1n],
      });

      // Execute through ZeroDev with automatic gas sponsorship
      const hash = await executeTransaction({
        to: contractAddress,
        data,
        value: 0n,
      });

      if (hash) {
        console.log('[ZERODEV CERTIFICATE] Transaction sent:', hash);
        setCertificateState({
          isProcessing: false,
          transactionHash: hash,
          error: null,
          success: true,
        });
      } else {
        throw new Error('Transaction execution failed');
      }

    } catch (error) {
      console.error('[ZERODEV CERTIFICATE] Failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Certificate generation failed';
      setCertificateState({
        isProcessing: false,
        transactionHash: null,
        error: errorMessage,
        success: false,
      });
    }
  }, [
    ready,
    authenticated,
    canSponsorTransaction,
    smartAccountAddress,
    courseSlug,
    courseId,
    executeTransaction,
  ]);

  const resetStates = useCallback(() => {
    setEnrollmentState({
      isProcessing: false,
      transactionHash: null,
      error: null,
      success: false,
    });
    setModuleCompletionState({
      isProcessing: false,
      transactionHash: null,
      error: null,
      success: false,
    });
    setCertificateState({
      isProcessing: false,
      transactionHash: null,
      error: null,
      success: false,
    });
  }, []);

  // Combine errors from smart account and transaction states
  const combinedError = smartAccountError || 
                       enrollmentState.error || 
                       moduleCompletionState.error || 
                       certificateState.error;

  const isLoading = isInitializing || 
                   enrollmentState.isProcessing || 
                   moduleCompletionState.isProcessing || 
                   certificateState.isProcessing;

  return {
    // Smart account state
    smartAccountAddress,
    isSmartAccountReady: canSponsorTransaction,
    isInitializingSmartAccount: isInitializing,
    
    // Enrollment
    enrollWithZeroDev,
    enrollmentHash: enrollmentState.transactionHash,
    enrollmentSuccess: enrollmentState.success,
    isEnrolling: enrollmentState.isProcessing,
    
    // Module completion
    completeModuleWithZeroDev,
    moduleCompletionHash: moduleCompletionState.transactionHash,
    moduleCompletionSuccess: moduleCompletionState.success,
    isCompletingModule: moduleCompletionState.isProcessing,
    
    // Certificate generation
    generateCertificateWithZeroDev,
    certificateHash: certificateState.transactionHash,
    certificateSuccess: certificateState.success,
    isGeneratingCertificate: certificateState.isProcessing,
    
    // Combined state
    error: combinedError,
    isLoading,
    resetStates,
  };
}