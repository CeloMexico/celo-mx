import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import RenderMdx from '@/components/mdx/RenderMdx'
import LessonLayout from '@/components/academy/LessonLayout'
import { getCourseBySlug, COURSES } from '@/data/academy'

export const runtime = 'nodejs'
export const dynamicParams = false

export async function generateStaticParams() {
  // Use static data for now
  return COURSES.map((course) => ({ slug: course.slug }))
}

export default async function CoursePage(props: any) {
  const { params, searchParams } = props as { params:{ slug:string }, searchParams?:{ m?:string; s?:string } }
  const awaitedParams = await params
  const awaitedSearchParams = await searchParams
  const m = Number.isInteger(Number(awaitedSearchParams?.m)) ? Math.max(1, parseInt(String(awaitedSearchParams!.m),10)) : 1
  const s = Number.isInteger(Number(awaitedSearchParams?.s)) ? Math.max(1, parseInt(String(awaitedSearchParams!.s),10)) : 1

  // Get course from database
  const course = await prisma.course.findUnique({
    where: { slug: awaitedParams.slug },
    include: {
      modules: {
        include: {
          lessons: true
        },
        orderBy: { index: 'asc' }
      }
    }
  })
  
  if (!course) return notFound()
  
  const courseWithRels = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    status: course.status,
    visibility: course.visibility,
    modules: course.modules.map(module => ({
      id: module.id,
      index: module.index,
      title: module.title,
      summary: module.summary,
      lessons: module.lessons.map(lesson => ({
        id: lesson.id,
        index: lesson.index,
        title: lesson.title,
        contentMdx: lesson.contentMdx || '',
        status: lesson.status,
        visibility: lesson.visibility
      }))
    }))
  }

  const mod = courseWithRels.modules.find((mm: any) => mm.index === m)
  const lesson = mod?.lessons.find((ll: any) => ll.index === s)
  if (!mod || !lesson || lesson.status !== 'PUBLISHED') return notFound()

  return (
    <LessonLayout 
      course={courseWithRels} 
      current={{ moduleIndex: m, subIndex: s }}
    >
      <RenderMdx source={lesson.contentMdx ?? ''} />
    </LessonLayout>
  )
}