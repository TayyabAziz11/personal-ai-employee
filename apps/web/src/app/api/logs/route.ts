import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readMcpActionsLog } from '@/lib/fs-reader'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const source = searchParams.get('source') ?? undefined
  const level = searchParams.get('level') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '50', 10))
  const liveFs = searchParams.get('live') === 'true'

  // If live=true, read directly from filesystem log (no DB needed)
  if (liveFs) {
    const logs = readMcpActionsLog(200)
    return NextResponse.json({ logs, source: 'filesystem' })
  }

  const where = {
    ...(source ? { source } : {}),
    ...(level ? { level } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.eventLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.eventLog.count({ where }),
  ])

  return NextResponse.json({
    logs,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    source: 'database',
  })
}
