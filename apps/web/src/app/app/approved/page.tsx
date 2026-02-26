import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/layout/topbar'
import { PlansList, type SerializedWebPlan } from '@/components/plans/plans-list'
import { CheckCircle2 } from 'lucide-react'

async function getPlans(userId: string) {
  return prisma.webPlan.findMany({
    where: { userId, status: { in: ['approved', 'scheduled'] } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })
}

function serialize(plans: Awaited<ReturnType<typeof getPlans>>): SerializedWebPlan[] {
  return plans.map((p) => ({
    id: p.id,
    title: p.title,
    channel: p.channel,
    actionType: p.actionType,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    payload: (p.payload as Record<string, unknown>) ?? {},
    filePath: p.filePath,
  }))
}

export default async function ApprovedPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ''
  const plans = await getPlans(userId).catch(() => [])
  const serialized = serialize(plans)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Approved Plans"
        subtitle={`${serialized.length} plan${serialized.length !== 1 ? 's' : ''} approved — ready to execute`}
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {serialized.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-teal-400 flex-shrink-0" />
            <p className="text-xs text-teal-400">
              These plans are approved. Click Execute to run them now, or they will execute at their scheduled time.
            </p>
          </div>
        )}
        <PlansList
          plans={serialized}
          showExecute
          showReject
          emptyMessage="No approved plans. Approve plans from the Approvals section."
        />
      </div>
    </div>
  )
}
