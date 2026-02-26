import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import fs from 'fs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id ?? ''
  const plan = await prisma.webPlan.findUnique({ where: { id: params.id } }).catch(() => null)

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (plan.status === 'executing') {
    return NextResponse.json({ error: 'Cannot delete a plan that is currently executing' }, { status: 409 })
  }

  // Delete the markdown file if it exists
  if (plan.filePath) {
    try { fs.unlinkSync(plan.filePath) } catch { /* ignore */ }
  }

  await prisma.webPlan.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
