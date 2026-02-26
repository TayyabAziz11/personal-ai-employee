import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/layout/topbar'
import { PlansList, type SerializedWebPlan } from '@/components/plans/plans-list'
import Link from 'next/link'
import { Cpu, Clock, CheckCircle2, Zap, XCircle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

async function getWebPlans(userId: string) {
  return prisma.webPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

function serialize(plans: Awaited<ReturnType<typeof getWebPlans>>): SerializedWebPlan[] {
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

const statusLinks = [
  { status: 'all', label: 'All', href: '/app/plans', icon: FileText, color: 'text-zinc-400' },
  { status: 'pending_approval', label: 'Pending', href: '/app/approvals', icon: Clock, color: 'text-amber-400' },
  { status: 'approved', label: 'Approved', href: '/app/approved', icon: CheckCircle2, color: 'text-teal-400' },
  { status: 'executed', label: 'Executed', href: '/app/executed', icon: Zap, color: 'text-emerald-400' },
  { status: 'rejected', label: 'Rejected', href: '/app/rejected', icon: XCircle, color: 'text-zinc-500' },
]

export default async function PlansPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ''
  const plans = await getWebPlans(userId).catch(() => [])
  const serialized = serialize(plans)

  const counts: Record<string, number> = {}
  for (const p of serialized) {
    counts[p.status] = (counts[p.status] ?? 0) + 1
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="All Plans"
        subtitle={`${serialized.length} total web plans`}
        actions={
          <Link
            href="/app/command-center"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200"
          >
            <Cpu className="h-3.5 w-3.5" />
            Create
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {/* Quick nav to status pages */}
        <div className="mb-6 flex flex-wrap gap-2">
          {statusLinks.map(({ label, href, icon: Icon, color, status }) => {
            const count = status === 'all' ? serialized.length : counts[status] ?? 0
            return (
              <Link
                key={status}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs transition-all hover:bg-white/[0.06]',
                  color
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                <span className="ml-1 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
                  {count}
                </span>
              </Link>
            )
          })}
        </div>

        <PlansList
          plans={serialized}
          showApprove
          showReject
          showExecute
          emptyMessage="No plans yet. Create your first action in the Command Center."
        />
      </div>
    </div>
  )
}
