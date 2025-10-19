"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCourseEnrollmentBadge } from '@/lib/hooks/useSimpleBadge';
import { useUnifiedEnrollment } from '@/lib/hooks/useUnifiedEnrollment';
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
  
  // Use UNIFIED enrollment for write operations (handles both sponsored and wallet)
  const unifiedEnrollment = useUnifiedEnrollment({ courseSlug, courseId });

  console.log('[ENROLLMENT CONTEXT] Enrollment state:', {
    hasBadge: optimizedEnrollment.hasBadge,
    hasClaimed: optimizedEnrollment.hasClaimed,
    isLoading: optimizedEnrollment.isLoading,
    unifiedEnrollmentSuccess: unifiedEnrollment.enrollmentSuccess,
    prefersSponsoredMethod: unifiedEnrollment.prefersSponsoredMethod,
    transactionMethod: unifiedEnrollment.transactionMethod,
    serverHasAccess,
    contractAddress: unifiedEnrollment.contractAddress,
  });

  // CRITICAL: Invalidate cache after successful enrollment (unified approach)
  useEffect(() => {
    const shouldInvalidate = unifiedEnrollment.enrollmentSuccess || optimizedEnrollment.enrollmentSuccess;
    
    if (shouldInvalidate) {
      console.log('[ENROLLMENT CONTEXT] 🔄 Invalidating cache after successful enrollment:', {
        unifiedSuccess: unifiedEnrollment.enrollmentSuccess,
        transactionMethod: unifiedEnrollment.transactionMethod,
        legacySuccess: optimizedEnrollment.enrollmentSuccess,
      });
      
      // Aggressive cache invalidation for enrollment-related queries
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      queryClient.refetchQueries({ queryKey: ['readContract'] });
      
      // Multiple invalidation attempts to ensure cache refresh
      const intervals = [500, 1000, 2000, 3000];
      intervals.forEach(delay => {
        setTimeout(() => {
          console.log('[ENROLLMENT CONTEXT] 🔄 Cache invalidation attempt at', delay, 'ms');
          queryClient.invalidateQueries({ queryKey: ['readContract'] });
          queryClient.refetchQueries({ queryKey: ['readContract'] });
        }, delay);
      });
    }
  }, [unifiedEnrollment.enrollmentSuccess, optimizedEnrollment.enrollmentSuccess, queryClient]);

  // Use unified enrollment function (handles both sponsored and wallet automatically)
  const enrollInCourse = async () => {
    console.log('[ENROLLMENT CONTEXT] Using unified enrollment:', {
      privyAuthenticated,
      prefersSponsoredMethod: unifiedEnrollment.prefersSponsoredMethod,
      canEnroll: unifiedEnrollment.canEnroll,
    });
    
    // The unified hook automatically chooses the best method
    await unifiedEnrollment.enroll();
  };

  const enrollmentState: EnrollmentState = {
    hasBadge: optimizedEnrollment.hasBadge,
    hasClaimed: optimizedEnrollment.hasClaimed,
    isLoading: optimizedEnrollment.isLoading || unifiedEnrollment.isLoading,
    enrollInCourse,
    enrollmentHash: unifiedEnrollment.enrollmentHash || optimizedEnrollment.enrollmentHash,
    enrollmentError: unifiedEnrollment.enrollmentError ? new Error(unifiedEnrollment.enrollmentError) : optimizedEnrollment.enrollmentError,
    isEnrolling: unifiedEnrollment.isEnrolling || optimizedEnrollment.isEnrolling,
    isConfirmingEnrollment: false, // Unified hook manages this internally
    enrollmentSuccess: unifiedEnrollment.enrollmentSuccess || optimizedEnrollment.enrollmentSuccess,
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
