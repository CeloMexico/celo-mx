"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCourseEnrollmentBadge } from '@/lib/hooks/useSimpleBadge';
import { useSponsoredEnrollment } from '@/lib/hooks/useSponsoredEnrollment';
import { usePrivy } from '@privy-io/react-auth';
import { useSmartAccount } from '@/lib/contexts/ZeroDevSmartWalletProvider';
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
  const { isSmartAccountReady, canSponsorTransaction } = useSmartAccount();
  const queryClient = useQueryClient();
  const userAddress = wallet?.address as Address | undefined;
  const isWalletConnected = isAuthenticated && !!userAddress;

  console.log('[ENROLLMENT CONTEXT] Wallet state:', {
    isAuthenticated,
    privyAuthenticated,
    hasWalletAddress: !!userAddress,
    isWalletConnected,
    isSmartAccountReady,
    canSponsorTransaction,
  });

  // Use optimized enrollment for both read and write operations (CRITICAL FIX)
  const optimizedEnrollment = useCourseEnrollmentBadge(courseSlug, courseId, userAddress);
  
  // Use sponsored enrollment for write operations (enrollment)
  const sponsoredEnrollment = useSponsoredEnrollment({ courseSlug, courseId });

  console.log('[ENROLLMENT CONTEXT] Enrollment state:', {
    hasBadge: optimizedEnrollment.hasBadge,
    hasClaimed: optimizedEnrollment.hasClaimed,
    isLoading: optimizedEnrollment.isLoading,
    sponsoredEnrollmentSuccess: sponsoredEnrollment.enrollmentSuccess,
    canUseSponsored: canSponsorTransaction,
    serverHasAccess,
    readContract: 'optimized (should match write contract)',
  });

  // CRITICAL: Invalidate cache after successful sponsored enrollment
  useEffect(() => {
    if (sponsoredEnrollment.enrollmentSuccess) {
      console.log('[ENROLLMENT CONTEXT] 🔄 Invalidating cache after successful sponsored enrollment');
      // Invalidate all read contract queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      
      // Small delay to ensure transaction is indexed
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
      }, 2000);
    }
  }, [sponsoredEnrollment.enrollmentSuccess, queryClient]);

  // Determine enrollment function to use
  const enrollInCourse = async () => {
    console.log('[ENROLLMENT CONTEXT] Enrollment decision:', {
      privyAuthenticated,
      canSponsorTransaction,
      isSmartAccountReady,
      willUseSponsored: privyAuthenticated && canSponsorTransaction
    });
    
    if (privyAuthenticated && canSponsorTransaction) {
      console.log('[ENROLLMENT CONTEXT] ✅ Using sponsored enrollment (gas-free)');
      await sponsoredEnrollment.enrollWithSponsorship();
    } else {
      console.log('[ENROLLMENT CONTEXT] ⚠️ Falling back to legacy enrollment (requires gas)', {
        reason: !privyAuthenticated ? 'Not authenticated with Privy' : 'Cannot sponsor transactions'
      });
      await optimizedEnrollment.enrollInCourse();
    }
  };

  const enrollmentState: EnrollmentState = {
    hasBadge: optimizedEnrollment.hasBadge,
    hasClaimed: optimizedEnrollment.hasClaimed,
    isLoading: optimizedEnrollment.isLoading || sponsoredEnrollment.isLoading,
    enrollInCourse,
    enrollmentHash: sponsoredEnrollment.enrollmentHash || optimizedEnrollment.enrollmentHash,
    enrollmentError: sponsoredEnrollment.enrollmentError ? new Error(sponsoredEnrollment.enrollmentError) : optimizedEnrollment.enrollmentError,
    isEnrolling: sponsoredEnrollment.isEnrolling || optimizedEnrollment.isEnrolling,
    isConfirmingEnrollment: optimizedEnrollment.isConfirmingEnrollment,
    enrollmentSuccess: sponsoredEnrollment.enrollmentSuccess || optimizedEnrollment.enrollmentSuccess,
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
