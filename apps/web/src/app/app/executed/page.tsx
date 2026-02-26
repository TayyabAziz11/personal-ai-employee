import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/layout/topbar'
import { PlansList, type SerializedWebPlan } from '@/components/plans/plans-list'

async function getPlans(userId: string) {
  return prisma.webPlan.findMany({
    where: { userId, status: { in: ['executed', 'failed'] } },
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

export default async function ExecutedPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ''
  const plans = await getPlans(userId).catch(() => [])
  const serialized = serialize(plans)

  const executed = serialized.filter((p) => p.status === 'executed').length
  const failed = serialized.filter((p) => p.status === 'failed').length

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Execution History"
        subtitle={`${executed} executed · ${failed} failed`}
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        <PlansList
          plans={serialized}
          emptyMessage="No executed plans yet. Approve and execute plans from the Approvals section."
        />
      </div>
    </div>
  )
}
