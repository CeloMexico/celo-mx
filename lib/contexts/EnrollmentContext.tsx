"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCourseEnrollmentBadge } from '@/lib/hooks/useSimpleBadge';
import { useSponsoredEnrollment } from '@/lib/hooks/useSponsoredEnrollment';
import { usePrivy } from '@privy-io/react-auth';
import { useSmartAccount } from '@/lib/contexts/ZeroDevSmartWalletProvider';
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

  // Use legacy enrollment for badge checking (read-only)
  const legacyEnrollment = useCourseEnrollmentBadge(courseSlug, courseId, userAddress);
  
  // Use sponsored enrollment for write operations (enrollment)
  const sponsoredEnrollment = useSponsoredEnrollment({ courseSlug, courseId });

  console.log('[ENROLLMENT CONTEXT] Enrollment state:', {
    hasBadge: legacyEnrollment.hasBadge,
    hasClaimed: legacyEnrollment.hasClaimed,
    isLoading: legacyEnrollment.isLoading,
    sponsoredEnrollmentSuccess: sponsoredEnrollment.enrollmentSuccess,
    canUseSponsored: canSponsorTransaction,
    serverHasAccess,
  });

  // Determine enrollment function to use
  const enrollInCourse = async () => {
    if (privyAuthenticated && canSponsorTransaction) {
      console.log('[ENROLLMENT CONTEXT] Using sponsored enrollment');
      await sponsoredEnrollment.enrollWithSponsorship();
    } else {
      console.log('[ENROLLMENT CONTEXT] Falling back to legacy enrollment');
      await legacyEnrollment.enrollInCourse();
    }
  };

  const enrollmentState: EnrollmentState = {
    hasBadge: legacyEnrollment.hasBadge,
    hasClaimed: legacyEnrollment.hasClaimed,
    isLoading: legacyEnrollment.isLoading || sponsoredEnrollment.isLoading,
    enrollInCourse,
    enrollmentHash: sponsoredEnrollment.enrollmentHash || legacyEnrollment.enrollmentHash,
    enrollmentError: sponsoredEnrollment.enrollmentError ? new Error(sponsoredEnrollment.enrollmentError) : legacyEnrollment.enrollmentError,
    isEnrolling: sponsoredEnrollment.isEnrolling || legacyEnrollment.isEnrolling,
    isConfirmingEnrollment: legacyEnrollment.isConfirmingEnrollment,
    enrollmentSuccess: sponsoredEnrollment.enrollmentSuccess || legacyEnrollment.enrollmentSuccess,
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
