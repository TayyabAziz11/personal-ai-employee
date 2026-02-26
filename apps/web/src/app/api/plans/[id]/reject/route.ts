import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { movePlanToRejected } from '@/lib/plan-storage'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id
  const { id } = params

  const plan = await prisma.webPlan.findUnique({ where: { id } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (['executed', 'rejected'].includes(plan.status)) {
    return NextResponse.json({ error: `Cannot reject a plan in status: ${plan.status}` }, { status: 409 })
  }

  const newFilePath = await movePlanToRejected(plan.filePath)

  const updated = await prisma.webPlan.update({
    where: { id },
    data: {
      status: 'rejected',
      filePath: newFilePath ?? plan.filePath,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ plan: updated })
}
