import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { walletAddress, lessonId, status, secondsSpent } = await req.json()
    if (!walletAddress || !lessonId) return NextResponse.json({ error:'missing walletAddress or lessonId' }, { status:400 })

    // Ensure user exists by wallet
    let user = await prisma.user.findUnique({ where:{ walletAddress } })
    if (!user) user = await prisma.user.create({ data:{ walletAddress } })

    const existing = await prisma.userLessonProgress.findUnique({ where:{ userId_lessonId:{ userId:user.id, lessonId } } }).catch(()=>null)
    if (!existing) {
      await prisma.userLessonProgress.create({ data:{ userId:user.id, lessonId, status: status ?? 'IN_PROGRESS', secondsSpent: secondsSpent ?? 0, lastVisitedAt: new Date() }})
    } else {
      await prisma.userLessonProgress.update({
        where:{ id: existing.id },
        data:{
          status: status ?? existing.status,
          secondsSpent: (existing.secondsSpent ?? 0) + (secondsSpent ?? 0),
          lastVisitedAt: new Date(),
          completedAt: (status==='COMPLETED') ? new Date() : existing.completedAt
        }
      })
    }
    return NextResponse.json({ ok:true })
  } catch (e:any) {
    console.error('progress error', e)
    return NextResponse.json({ error:'server' }, { status:500 })
  }
}

