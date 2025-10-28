import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({} as any))
    const wallet = typeof body?.address === 'string' ? String(body.address).toLowerCase() : null
    if (!wallet) {
      return NextResponse.json({ error: 'Missing address in request body' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Require existing user; do not create users here
    const user = await prisma.user.findUnique({ where: { walletAddress: wallet } })
    if (!user) {
      return NextResponse.json({ error: 'User not found for wallet' }, { status: 404 })
    }

    // Upsert enrollment (id required by schema)
    await prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: {},
      create: { id: crypto.randomUUID(), userId: user.id, courseId: course.id }
    })

    const count = await prisma.courseEnrollment.count({ where: { courseId: course.id } })

    return NextResponse.json({ success: true, count }, { status: 200 })
  } catch (error) {
    console.error('[API] sync-enrollment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
