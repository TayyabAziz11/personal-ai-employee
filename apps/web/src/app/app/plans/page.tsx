import { prisma } from '@/lib/db'
import { readPlansFromFs } from '@/lib/fs-reader'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import { FileText } from 'lucide-react'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'muted'> = {
  approved: 'success',
  completed: 'success',
  pending_approval: 'warning',
  draft: 'muted',
  failed: 'error',
}

async function getPlans() {
  try {
    const dbPlans = await prisma.plan.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    if (dbPlans.length > 0) return { plans: dbPlans, source: 'db' as const }
  } catch { /* DB not ready */ }

  const fsPlans = readPlansFromFs()
  return { plans: fsPlans, source: 'fs' as const }
}

export default async function PlansPage() {
  const { plans, source } = await getPlans()

  const statusCounts = plans.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar title="Plans" subtitle={`${plans.length} total · source: ${source}`} />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {/* Status summary */}
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400"
            >
              <span className="capitalize">{status.replace(/_/g, ' ')}</span>
              <span className="font-mono text-zinc-600">{count}</span>
            </div>
          ))}
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText className="mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">No plans found. Run a sync to load from Plans/ folder.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan, i) => (
              <Card key={('id' in plan ? plan.id : undefined) ?? `plan-${i}`} className="hover:border-white/[0.12]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-zinc-200">{plan.title}</h3>
                          <Badge variant={statusVariant[plan.status] ?? 'muted'}>
                            {plan.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        {plan.filePath && (
                          <p className="mt-1 font-mono text-[10px] text-zinc-700">{plan.filePath}</p>
                        )}
                      </div>
                    </div>
                    <p className="flex-shrink-0 text-[10px] text-zinc-700">
                      {formatRelativeTime(plan.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
