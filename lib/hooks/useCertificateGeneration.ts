'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address } from 'viem';
import { getCourseTokenId } from '@/lib/courseToken';

// Certificate contract ABI (would be a separate ERC721 contract for certificates)
const CERTIFICATE_ABI = [
  {
    type: 'function',
    name: 'mintCertificate',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'courseTokenId', type: 'uint256' },
      { name: 'completionData', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// For now, we'll use the same contract address
// In production, you'd have a separate certificate contract
const getCertificateContractAddress = (): Address => {
  const address = process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  if (!address || address === '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
    throw new Error('Certificate contract address not configured');
  }
  
  const trimmedAddress = address.trim();
  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
    throw new Error(`Invalid certificate contract address format: ${trimmedAddress}`);
  }
  
  return trimmedAddress as Address;
};

/**
 * Hook to generate course completion certificate
 */
export function useCertificateGeneration() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });
  
  const [certificateData, setCertificateData] = useState<{
    courseSlug?: string;
    courseTitle?: string;
    completedModules?: number;
    completionDate?: string;
  } | null>(null);

  const generateCertificate = async (
    courseSlug: string,
    courseId: string,
    courseTitle: string,
    completedModules: number,
    userAddress: Address
  ) => {
    const tokenId = getCourseTokenId(courseSlug, courseId);
    const completionDate = new Date().toISOString();
    
    // Store certificate data for UI display
    setCertificateData({
      courseSlug,
      courseTitle,
      completedModules,
      completionDate,
    });
    
    console.log('[CERTIFICATE] Generating certificate:', {
      courseSlug,
      courseTitle,
      completedModules,
      tokenId: tokenId.toString(),
      userAddress,
    });

    // Encode completion data
    const completionData = new TextEncoder().encode(JSON.stringify({
      courseSlug,
      courseTitle,
      completedModules,
      completionDate,
      userAddress,
    }));

    // For now, we'll use the adminMint function from SimpleBadge
    // In production, you'd use a separate certificate contract
    try {
      return writeContract({
        address: getCertificateContractAddress(),
        abi: [
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
        ],
        functionName: 'adminMint',
        args: [userAddress, tokenId + 1000n, 1n], // Different token ID for certificate
      });
    } catch (err) {
      console.error('[CERTIFICATE] Error generating certificate:', err);
      throw err;
    }
  };

  const resetCertificateData = () => {
    setCertificateData(null);
  };

  return {
    generateCertificate,
    certificateHash: hash,
    certificateError: error || confirmError,
    isGenerating: isPending,
    isConfirmingCertificate: isConfirming,
    certificateSuccess: isSuccess,
    certificateData,
    resetCertificateData,
  };
}

/**
 * Hook to check if user has certificate for a course
 */
export function useHasCertificate(userAddress?: Address, courseSlug?: string, courseId?: string) {
  // This would check if the user has a certificate NFT
  // For now, we'll assume no certificates exist yet
  return {
    hasCertificate: false,
    isLoading: false,
    certificateTokenId: null,
  };
}