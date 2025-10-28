import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { PublishStatus, LessonProgressStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

// GET /api/courses/[slug]/reviews
// POST /api/courses/[slug]/reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)))

    const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const skip = (page - 1) * limit
    const [agg, items] = await Promise.all([
      prisma.courseReview.aggregate({
        where: { courseId: course.id },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.courseReview.findMany({
        where: { courseId: course.id },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        select: { id: true, rating: true, comment: true, createdAt: true, userId: true }
      })
    ])

    return NextResponse.json({
      average: agg._avg.rating ?? null,
      count: agg._count,
      items,
      page, limit,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json().catch(() => null)
    const rating = body?.rating
    const comment = body?.comment ?? undefined

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating (1..5)' }, { status: 400 })
    }

    // Auth
    const auth = await getAuthenticatedUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Resolve user from wallet
    const wallet = (auth.user as any)?.wallet?.address?.toLowerCase?.() || null
    let user = wallet ? await prisma.user.findUnique({ where: { walletAddress: wallet } }) : null
    if (!user && wallet) {
      user = await prisma.user.create({ data: { id: randomUUID(), walletAddress: wallet, updatedAt: new Date() } as any })
    }
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Enrollment
    const enrolled = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { userId: true }
    })
    if (!enrolled) return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 })

    // Completion
    const publishedLessons = await prisma.lesson.findMany({
      where: { Module: { courseId: course.id }, status: PublishStatus.PUBLISHED },
      select: { id: true }
    })
    const publishedIds = publishedLessons.map(l => l.id)
    const completedCount = await prisma.userLessonProgress.count({
      where: { userId: user.id, lessonId: { in: publishedIds }, status: LessonProgressStatus.COMPLETED }
    })
    if (publishedIds.length === 0 || completedCount !== publishedIds.length) {
      return NextResponse.json({ error: 'NOT_COMPLETED' }, { status: 403 })
    }

    // Upsert review
    await prisma.courseReview.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: { rating, comment },
      create: { id: randomUUID(), userId: user.id, courseId: course.id, rating, comment },
    })

    // Aggregate and return
    const agg = await prisma.courseReview.aggregate({ where: { courseId: course.id }, _avg: { rating: true }, _count: true })

    try {
      revalidatePath('/academy')
      revalidatePath(`/academy/${slug}`)
    } catch {}

    return NextResponse.json({ average: agg._avg.rating ?? null, count: agg._count })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
