import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { renderPlanMarkdown, writePlanToFs } from '@/lib/plan-storage'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 })

  let body: {
    channel: string
    actionType: string
    title: string
    payload: Record<string, unknown>
    scheduledAt?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { channel, actionType, title, payload, scheduledAt } = body

  if (!channel || !actionType || !title) {
    return NextResponse.json({ error: 'channel, actionType, and title are required' }, { status: 400 })
  }

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null
  const status = scheduledDate && scheduledDate > new Date() ? 'scheduled' : 'pending_approval'

  // Create the WebPlan in DB
  const plan = await prisma.webPlan.create({
    data: {
      userId,
      title,
      channel,
      actionType,
      payload: (payload ?? {}) as never,
      status,
      scheduledAt: scheduledDate,
    },
  })

  // Write markdown to Pending_Approval/ (local dev only; no-op on Vercel)
  const markdown = renderPlanMarkdown({
    id: plan.id,
    title: plan.title,
    channel: plan.channel,
    actionType: plan.actionType,
    payload: (plan.payload as Record<string, unknown>) ?? {},
    status: plan.status,
    scheduledAt: plan.scheduledAt,
    userId: plan.userId,
    createdAt: plan.createdAt,
  })

  const filePath = await writePlanToFs(plan.id, plan.title, markdown)

  // Store file path if written
  if (filePath) {
    await prisma.webPlan.update({
      where: { id: plan.id },
      data: { filePath },
    })
  }

  return NextResponse.json({ plan: { ...plan, filePath } }, { status: 201 })
}
