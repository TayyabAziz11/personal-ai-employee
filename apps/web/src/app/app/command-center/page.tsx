import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/layout/topbar'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import {
  Briefcase,
  Mail,
  MessageSquare,
  Twitter,
  Instagram,
  ChevronRight,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ActivitySquare,
} from 'lucide-react'

interface ChannelDef {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
  glow: string
  actions: string[]
  live: boolean
}

const channels: ChannelDef[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Create posts, share announcements, build thought leadership.',
    icon: Briefcase,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    glow: 'shadow-[0_0_20px_rgba(14,165,233,0.15)]',
    actions: ['Create Post (Text)', 'Create Post (Image)', 'View Recent Posts'],
    live: true,
  },
  {
    id: 'gmail',
    label: 'Gmail',
    description: 'Draft emails, search your inbox, send with approval gate.',
    icon: Mail,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    actions: ['Draft Email', 'Search Inbox', 'Send Email'],
    live: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Business messaging with approval gates. Send messages via WhatsApp Web.',
    icon: MessageSquare,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
    actions: ['Send Message', 'View Recent'],
    live: true,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Publish image posts with AI-generated captions via Graph API approval gate.',
    icon: Instagram,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
    glow: 'shadow-[0_0_20px_rgba(217,70,239,0.15)]',
    actions: ['Create Post (Image)', 'View Recent Media', 'Check Comments'],
    live: true,
  },
  {
    id: 'odoo',
    label: 'Odoo Accounting',
    description: 'Query invoices, AR aging, revenue summaries and create invoices with approval gate.',
    icon: ActivitySquare,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
    actions: ['Query Invoices', 'Revenue Summary', 'AR Aging Report', 'Create Invoice (Approval)'],
    live: true,
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    description: 'Compose tweets and threads with human approval. Coming soon.',
    icon: Twitter,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    glow: '',
    actions: ['Post Tweet', 'View Timeline'],
    live: false,
  },
]

type ChannelStats = Record<string, { pending: number; executed: number; failed: number }>
type ConnectionMap = Record<string, { connected: boolean; displayName?: string | null }>

async function getIntegrationStats(userId: string): Promise<ChannelStats> {
  const plans = await prisma.webPlan.groupBy({
    by: ['channel', 'status'],
    where: { userId },
    _count: { id: true },
  })

  const stats: ChannelStats = {}
  for (const row of plans) {
    if (!stats[row.channel]) stats[row.channel] = { pending: 0, executed: 0, failed: 0 }
    if (row.status === 'pending_approval') stats[row.channel].pending += row._count.id
    else if (row.status === 'executed') stats[row.channel].executed += row._count.id
    else if (row.status === 'failed') stats[row.channel].failed += row._count.id
  }
  return stats
}

function tokenFileExists(provider: string): boolean {
  try {
    const root = process.env.REPO_ROOT ?? path.resolve(process.cwd(), '..', '..')
    const patterns = [
      path.join(root, '.secrets', `${provider}_token.json`),
      path.join(root, '.secrets', `${provider}_credentials.json`),
    ]
    return patterns.some((p) => fs.existsSync(p))
  } catch { return false }
}

async function getUserConnections(userId: string): Promise<ConnectionMap> {
  const connections = await prisma.userConnection.findMany({ where: { userId } }).catch(() => [])
  const dbMap = Object.fromEntries(connections.map((c) => [c.provider, { connected: c.connected, displayName: c.displayName }]))

  // Merge with token-file fallback for providers not in DB
  for (const provider of ['linkedin', 'gmail', 'instagram']) {
    if (!dbMap[provider]?.connected) {
      if (tokenFileExists(provider)) {
        const displayName = provider === 'gmail' ? (process.env.GMAIL_USER ?? undefined) : undefined
        dbMap[provider] = { connected: true, displayName: displayName ?? null }
      }
    }
  }

  // WhatsApp uses session meta file (not OAuth token files)
  if (!dbMap['whatsapp']?.connected) {
    try {
      const root = process.env.REPO_ROOT ?? path.resolve(process.cwd(), '..', '..')
      const metaPath = path.join(root, '.secrets', 'whatsapp_session_meta.json')
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        if (meta.status === 'connected') {
          dbMap['whatsapp'] = { connected: true, displayName: 'WhatsApp Web' }
        }
      }
    } catch { /* ignore */ }
  }

  // Odoo: connected when credentials file has real base_url + non-placeholder password
  if (!dbMap['odoo']?.connected) {
    try {
      const root = process.env.REPO_ROOT ?? path.resolve(process.cwd(), '..', '..')
      const credsPath = path.join(root, '.secrets', 'odoo_credentials.json')
      if (fs.existsSync(credsPath)) {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'))
        const hasRealUrl = creds.base_url && !creds.base_url.includes('localhost')
        const hasRealPass = creds.password && !String(creds.password).startsWith('YOUR_')
        const hasRealDb = creds.database && creds.database !== 'my_company_db'
        if (hasRealUrl && hasRealPass && hasRealDb) {
          dbMap['odoo'] = { connected: true, displayName: `Odoo: ${creds.database}` }
        } else {
          // Credentials exist but mock mode — show as "mock" connected
          dbMap['odoo'] = { connected: false, displayName: 'Odoo (mock mode)' }
        }
      }
    } catch { /* ignore */ }
  }

  return dbMap
}

export default async function CommandCenterPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ''

  const [stats, connections] = await Promise.all([
    getIntegrationStats(userId).catch((): ChannelStats => ({})),
    getUserConnections(userId).catch((): ConnectionMap => ({})),
  ])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Command Center"
        subtitle="Select a channel to create plans and execute actions"
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Integration Channels</h2>
          </div>
          <p className="text-xs text-zinc-600">
            Each channel follows the Perception → Plan → Approval → Action loop. No action executes without your explicit approval.
          </p>
        </div>

        {/* Channel cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((ch) => {
            const s = stats[ch.id] ?? { pending: 0, executed: 0, failed: 0 }
            const conn = connections[ch.id]
            const isConnected = conn?.connected ?? false

            return (
              <Link
                key={ch.id}
                href={`/app/command-center/${ch.id}`}
                className={`group relative flex flex-col rounded-2xl border ${ch.border} ${ch.bg} p-6 transition-all duration-200 hover:scale-[1.01] ${ch.glow} ${!ch.live ? 'opacity-60 pointer-events-none' : 'cursor-pointer hover:brightness-110'}`}
              >
                {/* Live / coming soon badge */}
                <div className="absolute right-4 top-4">
                  {ch.live ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-400">
                      <span className="h-1 w-1 rounded-full bg-teal-400 animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-500">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Icon + name */}
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${ch.border} ${ch.bg}`}>
                    <ch.icon className={`h-5 w-5 ${ch.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{ch.label}</h3>
                    <p className="text-[10px] text-zinc-500">
                      {isConnected ? (
                        <span className="flex items-center gap-1 text-teal-400">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-zinc-500">
                          <AlertTriangle className="h-3 w-3" /> Not connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <p className="mb-4 text-xs text-zinc-500">{ch.description}</p>

                {/* Actions list */}
                <ul className="mb-4 space-y-1">
                  {ch.actions.map((a) => (
                    <li key={a} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className={`h-1 w-1 rounded-full ${ch.color.replace('text-', 'bg-')}`} />
                      {a}
                    </li>
                  ))}
                </ul>

                {/* Stats row */}
                <div className="mt-auto flex items-center gap-4 border-t border-white/[0.06] pt-4">
                  <Stat icon={<Clock className="h-3 w-3 text-amber-400" />} label="Pending" value={s.pending} />
                  <Stat icon={<CheckCircle2 className="h-3 w-3 text-teal-400" />} label="Executed" value={s.executed} />
                  <Stat icon={<XCircle className="h-3 w-3 text-red-400" />} label="Failed" value={s.failed} />
                  <div className="ml-auto">
                    <ChevronRight className={`h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 ${ch.color}`} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Architecture note */}
        <div className="mt-8 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            <span className="text-zinc-400 font-medium">Safety architecture: </span>
            Actions created here follow the <span className="text-zinc-400">Perception → Plan → Approval → Action → Logging</span> pipeline.
            Plans are stored as markdown files in <code className="text-teal-400/70">Pending_Approval/</code> and only execute after explicit approval.
            Executed actions are logged to <code className="text-teal-400/70">Logs/mcp_actions.log</code> and <code className="text-teal-400/70">system_log.md</code>.
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <div>
        <p className="text-xs font-bold text-zinc-200">{value}</p>
        <p className="text-[9px] text-zinc-600">{label}</p>
      </div>
    </div>
  )
}
