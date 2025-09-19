import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/data/academy";
import { CourseDetailClient } from "./CourseDetailClient";

interface CourseDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  try {
    // Resolve async params in server component
    const { slug } = await params;

    // Find course by slug
    const course = getCourseBySlug(slug);
    
    // Show 404 if course not found
    if (!course) {
      notFound();
    }

    // Pass resolved data to client component
    return <CourseDetailClient course={course} />;
  } catch (error) {
    console.error('Error in CourseDetailPage:', error);
    notFound();
  }
}