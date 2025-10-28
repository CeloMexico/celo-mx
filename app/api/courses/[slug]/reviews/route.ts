import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-server'

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

    // NOTE: Requires CourseReview model; returning 501 until migration lands
    return NextResponse.json({
      average: null,
      count: 0,
      items: [],
      page,
      limit,
      note: 'Reviews API scaffold. Add CourseReview model and implement queries.'
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

    // TODO: Enforce enrollment + completion eligibility
    // TODO: Upsert into CourseReview

    return NextResponse.json({
      message: 'Reviews API scaffold. Implement persistence after adding CourseReview model.',
    }, { status: 501 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
