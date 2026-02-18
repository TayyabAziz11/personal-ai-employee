import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const source = searchParams.get('source') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') ?? '20', 10))

  const where = {
    ...(source ? { source } : {}),
    ...(status ? { status } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.inboxItem.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inboxItem.count({ where }),
  ])

  // Summary counts by source
  const summary = await prisma.inboxItem.groupBy({
    by: ['source'],
    _count: { id: true },
    where: { status: 'unread' },
  })

  return NextResponse.json({
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    summary: Object.fromEntries(summary.map((s) => [s.source, s._count.id])),
  })
}
