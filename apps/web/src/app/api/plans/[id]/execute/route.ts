import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { executeWebPlan } from '@/lib/linkedin-bridge'

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
  if (plan.status !== 'approved') {
    return NextResponse.json(
      { error: `Plan must be approved before execution. Current status: ${plan.status}`, status: plan.status },
      { status: 409 }
    )
  }

  // Race: wait up to 8s for sync result, otherwise return 202 (still running)
  const executionPromise = executeWebPlan(id)
  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))

  const result = await Promise.race([executionPromise, timeoutPromise])

  if (result === null) {
    // Still running in background — not an error
    return NextResponse.json({ message: 'Execution started in background', status: 'running' }, { status: 202 })
  }

  const { success, message } = result as { success: boolean; message: string }

  // Always return 200 — execution failure is a domain outcome, not a server error
  return NextResponse.json({
    success,
    message,
    status: success ? 'executed' : 'failed',
  })
}
