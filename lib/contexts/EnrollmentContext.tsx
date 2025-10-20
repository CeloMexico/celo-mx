"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCourseEnrollmentBadge } from '@/lib/hooks/useSimpleBadge';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { OPTIMIZED_CONTRACT_CONFIG } from '@/lib/contracts/optimized-badge-config';
import { getCourseTokenId } from '@/lib/courseToken';
import { usePrivy } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import type { Address } from 'viem';

interface EnrollmentState {
  hasBadge: boolean;
  hasClaimed: boolean;
  isLoading: boolean;
  enrollInCourse: () => Promise<void>;
  enrollmentHash?: `0x${string}`;
  enrollmentError?: Error | null;
  isEnrolling: boolean;
  isConfirmingEnrollment: boolean;
  enrollmentSuccess: boolean;
  serverHasAccess: boolean;
  isWalletConnected: boolean;
  userAddress?: Address;
}

const EnrollmentContext = createContext<EnrollmentState | null>(null);

interface EnrollmentProviderProps {
  children: ReactNode;
  courseSlug: string;
  courseId: string;
  serverHasAccess: boolean;
}

export function EnrollmentProvider({
  children,
  courseSlug,
  courseId,
  serverHasAccess,
}: EnrollmentProviderProps) {
  console.log('[ENROLLMENT CONTEXT] Initializing for course:', courseSlug);
  
  const { isAuthenticated, wallet } = useAuth();
  const { authenticated: privyAuthenticated } = usePrivy();
  const queryClient = useQueryClient();
  const userAddress = wallet?.address as Address | undefined;
  const isWalletConnected = isAuthenticated && !!userAddress;

  console.log('[ENROLLMENT CONTEXT] Wallet state:', {
    isAuthenticated,
    privyAuthenticated,
    hasWalletAddress: !!userAddress,
    isWalletConnected,
  });

  // Use optimized enrollment for read operations (badge/claim status)
  const optimizedEnrollment = useCourseEnrollmentBadge(courseSlug, courseId, userAddress);
  
  // DIRECT WAGMI WRITE CONTRACT - This will actually trigger wallet signing
  const { 
    writeContract, 
    data: hash,
    isPending: isEnrolling,
    error: enrollmentError 
  } = useWriteContract();
  
  const { isLoading: isConfirmingEnrollment } = useWaitForTransactionReceipt({
    hash,
  });

  console.log('[ENROLLMENT CONTEXT] Enrollment state:', {
    hasBadge: optimizedEnrollment.hasBadge,
    hasClaimed: optimizedEnrollment.hasClaimed,
    isLoading: optimizedEnrollment.isLoading,
    isEnrolling,
    isConfirmingEnrollment,
    hasWallet: isWalletConnected,
    serverHasAccess,
  });

  // DIRECT WAGMI ENROLLMENT - This will actually trigger wallet signing
  const enrollInCourse = async () => {
    console.log('[ENROLLMENT CONTEXT] Starting enrollment with wagmi writeContract');
    
    if (!isWalletConnected || !userAddress) {
      throw new Error('Wallet not connected');
    }
    
    const tokenId = getCourseTokenId(courseSlug, courseId);
    
    console.log('[ENROLLMENT CONTEXT] Calling writeContract:', {
      address: OPTIMIZED_CONTRACT_CONFIG.address,
      tokenId: tokenId.toString(),
      userAddress
    });
    
    // THIS WILL ACTUALLY PROMPT FOR WALLET SIGNING
    writeContract({
      address: OPTIMIZED_CONTRACT_CONFIG.address as `0x${string}`,
      abi: OPTIMIZED_CONTRACT_CONFIG.abi,
      functionName: 'enroll',
      args: [tokenId],
    });
    
    // Cache invalidation after successful transaction
    if (hash) {
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['readContract'] 
        });
        console.log('[ENROLLMENT CONTEXT] Cache invalidated after enrollment');
      }, 2000);
    }
  };

  const enrollmentState: EnrollmentState = {
    hasBadge: optimizedEnrollment.hasBadge,
    hasClaimed: optimizedEnrollment.hasClaimed,
    isLoading: optimizedEnrollment.isLoading,
    enrollInCourse,
    enrollmentHash: hash,
    enrollmentError: enrollmentError ? new Error(enrollmentError.message) : optimizedEnrollment.enrollmentError,
    isEnrolling,
    isConfirmingEnrollment,
    enrollmentSuccess: !!hash && !isConfirmingEnrollment,
    serverHasAccess,
    isWalletConnected,
    userAddress,
  };

  return (
    <EnrollmentContext.Provider value={enrollmentState}>
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollment() {
  const context = useContext(EnrollmentContext);
  if (!context) {
    throw new Error('useEnrollment must be used within an EnrollmentProvider');
  }
  return context;
}

/**
 * Utility hook to determine if user has access to course content
 */
export function useHasAccess() {
  const enrollment = useEnrollment();
  
  // Check access from multiple sources:
  // 1. Server-side access (already enrolled)
  // 2. Legacy badge/claim status (from SimpleBadge contract)
  // 3. Recent enrollment success (from sponsored or legacy enrollment)
  const hasAccess = enrollment.serverHasAccess || 
                   enrollment.hasBadge || 
                   enrollment.hasClaimed || 
                   enrollment.enrollmentSuccess;

  console.log('[ENROLLMENT ACCESS] Access check:', {
    serverHasAccess: enrollment.serverHasAccess,
    hasBadge: enrollment.hasBadge,
    hasClaimed: enrollment.hasClaimed,
    enrollmentSuccess: enrollment.enrollmentSuccess,
    finalHasAccess: hasAccess,
  });

  return hasAccess;
}
