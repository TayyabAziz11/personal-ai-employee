import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/layout/topbar'
import { PlansList, type SerializedWebPlan } from '@/components/plans/plans-list'
import Link from 'next/link'
import { Cpu, Clock } from 'lucide-react'

async function getPlans(userId: string) {
  return prisma.webPlan.findMany({
    where: { userId, status: 'pending_approval' },
    orderBy: { createdAt: 'desc' },
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

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ''
  const plans = await getPlans(userId).catch(() => [])
  const serialized = serialize(plans)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Pending Approvals"
        subtitle={`${serialized.length} plan${serialized.length !== 1 ? 's' : ''} waiting for your review`}
        actions={
          <Link
            href="/app/command-center"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200"
          >
            <Cpu className="h-3.5 w-3.5" />
            Create New
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {serialized.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-400">
              Review each plan carefully before approving. Once approved, plans can be executed immediately or on schedule.
            </p>
          </div>
        )}
        <PlansList
          plans={serialized}
          showApprove
          showReject
          emptyMessage="No plans pending approval. Create an action in the Command Center to get started."
        />
      </div>
    </div>
  )
}
