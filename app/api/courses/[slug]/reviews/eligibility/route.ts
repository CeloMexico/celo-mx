import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-server'

// GET /api/courses/[slug]/reviews/eligibility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const auth = await getAuthenticatedUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ canReview: false, reason: 'NOT_AUTHENTICATED' })
    }

    const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } })
    if (!course) return NextResponse.json({ canReview: false, reason: 'COURSE_NOT_FOUND' })

    // TODO: Implement real checks: enrollment + completion
    return NextResponse.json({ canReview: false, reason: 'NOT_IMPLEMENTED' })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
