"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCourseEnrollmentBadge } from '@/lib/hooks/useSimpleBadge';
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
  const userAddress = wallet?.address as Address | undefined;
  const isWalletConnected = isAuthenticated && !!userAddress;

  console.log('[ENROLLMENT CONTEXT] Wallet state:', {
    isAuthenticated,
    hasWalletAddress: !!userAddress,
    isWalletConnected,
  });

  const enrollment = useCourseEnrollmentBadge(courseSlug, courseId, userAddress);

  console.log('[ENROLLMENT CONTEXT] Enrollment state:', {
    hasBadge: enrollment.hasBadge,
    hasClaimed: enrollment.hasClaimed,
    isLoading: enrollment.isLoading,
    enrollmentSuccess: enrollment.enrollmentSuccess,
    serverHasAccess,
  });

  const enrollmentState: EnrollmentState = {
    hasBadge: enrollment.hasBadge,
    hasClaimed: enrollment.hasClaimed,
    isLoading: enrollment.isLoading,
    enrollInCourse: enrollment.enrollInCourse,
    enrollmentHash: enrollment.enrollmentHash,
    enrollmentError: enrollment.enrollmentError,
    isEnrolling: enrollment.isEnrolling,
    isConfirmingEnrollment: enrollment.isConfirmingEnrollment,
    enrollmentSuccess: enrollment.enrollmentSuccess,
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