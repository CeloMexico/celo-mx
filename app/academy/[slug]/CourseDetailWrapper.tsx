"use client";

import { useAccount } from "wagmi";
import { useCourseEnrollmentBadge } from "@/lib/hooks/useSimpleBadge";
import { CoursePaywall } from "@/components/academy/CoursePaywall";
import { useEffect, useState } from "react";
import { CourseDetailClient as CourseDetailClientOriginal } from "./CourseDetailClientOriginal";
import { Course } from "@/components/academy/types";

interface CourseDetailWrapperProps {
  course: Course;
}

export function CourseDetailWrapper({ course }: CourseDetailWrapperProps) {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  const {
    hasBadge,
    hasClaimed,
    isLoading,
    enrollInCourse,
    isEnrolling,
    isConfirmingEnrollment,
    enrollmentSuccess,
  } = useCourseEnrollmentBadge(course.slug, course.id, address);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnroll = async () => {
    try {
      await enrollInCourse();
    } catch (error) {
      console.error("Enrollment error:", error);
    }
  };

  // While hydrating, show loading state
  if (!mounted) {
    return (
      <CoursePaywall
        courseTitle={course.title}
        courseSlug={course.slug}
        reason="LOADING"
      />
    );
  }

  // If wallet is not connected
  if (!isConnected || !address) {
    return (
      <CoursePaywall
        courseTitle={course.title}
        courseSlug={course.slug}
        reason="WALLET_NOT_CONNECTED"
        isWalletConnected={false}
      />
    );
  }

  // If checking enrollment status
  if (isLoading) {
    return (
      <CoursePaywall
        courseTitle={course.title}
        courseSlug={course.slug}
        reason="LOADING"
      />
    );
  }

  // Check if user has access
  const hasAccess = hasBadge || hasClaimed || enrollmentSuccess;

  if (!hasAccess) {
    return (
      <CoursePaywall
        courseTitle={course.title}
        courseSlug={course.slug}
        reason="NOT_ENROLLED"
        isWalletConnected={true}
        onEnroll={handleEnroll}
        isEnrolling={isEnrolling || isConfirmingEnrollment}
      />
    );
  }

  // User has access, show the full course content
  return <CourseDetailClientOriginal course={course} />;
}
