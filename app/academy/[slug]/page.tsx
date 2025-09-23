import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import RenderMdx from '@/components/mdx/RenderMdx'
import LessonLayout from '@/components/academy/LessonLayout'
import { getCourseBySlug } from '@/data/academy'

export const runtime = 'nodejs'
export const dynamicParams = false

export async function generateStaticParams() {
  // Use static data for now
  const { COURSES } = await import('@/data/academy')
  return COURSES.map((course) => ({ slug: course.slug }))
}

export default async function CoursePage(props: any) {
  const { params, searchParams } = props as { params:{ slug:string }, searchParams?:{ m?:string; s?:string } }
  const awaitedParams = await params
  const awaitedSearchParams = await searchParams
  const m = Number.isInteger(Number(awaitedSearchParams?.m)) ? Math.max(1, parseInt(String(awaitedSearchParams!.m),10)) : 1
  const s = Number.isInteger(Number(awaitedSearchParams?.s)) ? Math.max(1, parseInt(String(awaitedSearchParams!.s),10)) : 1

  // Use static data for now
  const course = getCourseBySlug(awaitedParams.slug)
  if (!course) return notFound()
  
  // Convert static data to match the expected format
  const courseWithRels = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    modules: course.modules.map(module => ({
      id: `module-${module.index}`,
      index: module.index,
      title: module.title,
      summary: module.summary,
      lessons: module.submodules.map(submodule => ({
        id: `lesson-${module.index}-${submodule.index}`,
        index: submodule.index,
        title: submodule.title,
        contentMdx: submodule.content || '',
        status: 'PUBLISHED',
        visibility: 'PUBLIC'
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
