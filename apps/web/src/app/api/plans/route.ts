import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') ?? '20', 10))

  const where = status ? { status } : {}

  const [plans, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.plan.count({ where }),
  ])

  const statusCounts = await prisma.plan.groupBy({
    by: ['status'],
    _count: { id: true },
  })

  return NextResponse.json({
    plans,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id])),
  })
}
