import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/data/academy";
import { CourseDetailClient } from "./CourseDetailClient";

export const runtime = 'nodejs';
export const dynamicParams = false;
export function generateStaticParams() { 
  const { COURSES } = require('@/data/academy'); 
  return COURSES.map((c:any)=>({slug:c.slug})); 
}

interface CourseDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    m?: string;
    s?: string;
  }>;
}

export default async function CourseDetailPage({ params, searchParams }: CourseDetailPageProps) {
  try {
    // Resolve async params in server component
    const { slug } = await params;
    const { m, s } = await searchParams;

    // Parse and validate m and s parameters, default to 0, clamp >= 0
    const moduleIndex = Math.max(0, parseInt(m || '0', 10) || 0);
    const submoduleIndex = Math.max(0, parseInt(s || '0', 10) || 0);

    // Find course by slug
    const course = getCourseBySlug(slug);
    
    // Show 404 if course not found
    if (!course) {
      notFound();
    }

    // Get module at index m
    const courseModule = course.modules[moduleIndex];
    if (!courseModule) {
      notFound();
    }

    // Get submodule at index s within the module
    const submodule = courseModule.submodules[submoduleIndex];
    if (!submodule) {
      notFound();
    }

    // Pass resolved data to client component
    return <CourseDetailClient course={course} />;
  } catch (error) {
    console.error('Error in CourseDetailPage:', error);
    notFound();
  }
}