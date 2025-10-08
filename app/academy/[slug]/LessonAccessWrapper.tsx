"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCourseEnrollmentBadge } from "@/lib/hooks/useSimpleBadge";
import { CoursePaywall } from "@/components/academy/CoursePaywall";
import { useEffect, useState } from "react";

interface LessonAccessWrapperProps {
  children: React.ReactNode;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  serverHasAccess: boolean;
}

export function LessonAccessWrapper({
  children,
  courseId,
  courseSlug,
  courseTitle,
  serverHasAccess,
}: LessonAccessWrapperProps) {
  const { isAuthenticated, isLoading: authLoading, wallet } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Use Privy's wallet info instead of Wagmi
  const address = wallet.address;
  const isConnected = isAuthenticated && !!address;

  const {
    hasBadge,
    hasClaimed,
    isLoading,
    enrollInCourse,
    isEnrolling,
    isConfirmingEnrollment,
    enrollmentSuccess,
  } = useCourseEnrollmentBadge(courseSlug, courseId, address);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // While hydrating or auth loading, show loading state
  if (!mounted || authLoading) {
    return (
      <CoursePaywall
        courseTitle={courseTitle}
        courseSlug={courseSlug}
        reason="LOADING"
      />
    );
  }

  // If wallet is not connected
  if (!isConnected || !address) {
    return (
      <CoursePaywall
        courseTitle={courseTitle}
        courseSlug={courseSlug}
        reason="WALLET_NOT_CONNECTED"
        isWalletConnected={false}
      />
    );
  }

  // If checking enrollment status
  if (isLoading) {
    return (
      <CoursePaywall
        courseTitle={courseTitle}
        courseSlug={courseSlug}
        reason="LOADING"
      />
    );
  }

  // Check if user has access (either from server verification or client check)
  const hasAccess = serverHasAccess || hasBadge || hasClaimed || enrollmentSuccess;

  if (!hasAccess) {
    const handleEnroll = async () => {
      try {
        await enrollInCourse();
      } catch (error) {
        console.error("Enrollment error:", error);
      }
    };

    return (
      <CoursePaywall
        courseTitle={courseTitle}
        courseSlug={courseSlug}
        reason="NOT_ENROLLED"
        isWalletConnected={true}
        onEnroll={handleEnroll}
        isEnrolling={isEnrolling || isConfirmingEnrollment}
      />
    );
  }

  // User has access, show the lesson content
  return <>{children}</>;
}
