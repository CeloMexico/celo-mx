import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-server'

// GET /api/courses/[slug]/reviews/me
// PATCH /api/courses/[slug]/reviews/me
// DELETE /api/courses/[slug]/reviews/me
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const auth = await getAuthenticatedUser(request)
    if (!auth.isAuthenticated || !auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    return NextResponse.json({ message: 'Scaffold: implement after CourseReview model' }, { status: 501 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    return NextResponse.json({ message: 'Scaffold: implement after CourseReview model' }, { status: 501 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    return NextResponse.json({ message: 'Scaffold: implement after CourseReview model' }, { status: 501 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
