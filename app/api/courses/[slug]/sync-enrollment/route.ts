import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser, getUserWalletAddress } from '@/lib/auth-server'
import { isUserEnrolledInCourse } from '@/lib/enrollment-verification'
import type { Address } from 'viem'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    // Authenticate user
    const auth = await getAuthenticatedUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wallet = getUserWalletAddress(auth.user)
    if (!wallet) {
      return NextResponse.json({ error: 'No wallet address found' }, { status: 400 })
    }

    // Resolve course by slug
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify on-chain enrollment (force mainnet 42220)
    const check = await isUserEnrolledInCourse(wallet as Address, slug, course.id, 42220)
    if (!check.isEnrolled) {
      return NextResponse.json({ success: false, message: 'Not enrolled on-chain' }, { status: 200 })
    }

    // Upsert User by wallet address
    const user = await prisma.user.upsert({
      where: { walletAddress: wallet },
      update: { updatedAt: new Date() },
      create: { id: randomUUID(), walletAddress: wallet, updatedAt: new Date() }
    })

    // Upsert CourseEnrollment by unique(userId, courseId)
    await prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: {},
      create: { id: randomUUID(), userId: user.id, courseId: course.id }
    })

    // Return updated count for convenience
    const count = await prisma.courseEnrollment.count({ where: { courseId: course.id } })

    return NextResponse.json({ success: true, count }, { status: 200 })
  } catch (error) {
    console.error('[API] sync-enrollment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}