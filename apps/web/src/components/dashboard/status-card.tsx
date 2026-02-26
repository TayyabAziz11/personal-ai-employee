import { cn, statusDot, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatusCardProps {
  name: string
  displayName: string
  status: string
  lastRun: Date | string | null
  lastMessage?: string
  icon?: React.ReactNode
  brand?: 'linkedin' | 'gmail' | 'whatsapp' | 'instagram' | 'twitter' | 'odoo' | 'default'
  actionCount?: number
}

const brandStyles: Record<string, { icon: string; glow: string; badge: string }> = {
  linkedin: {
    icon: 'bg-[#0a66c2]/15 text-[#0a66c2]',
    glow: 'bg-[#0a66c2]/[0.04]',
    badge: 'bg-[#0a66c2]/10 text-[#4da3ff]',
  },
  gmail: {
    icon: 'bg-red-500/15 text-red-400',
    glow: 'bg-red-500/[0.03]',
    badge: 'bg-red-500/10 text-red-400',
  },
  whatsapp: {
    icon: 'bg-emerald-500/15 text-emerald-400',
    glow: 'bg-emerald-500/[0.03]',
    badge: 'bg-emerald-500/10 text-emerald-400',
  },
  instagram: {
    icon: 'bg-pink-500/15 text-pink-400',
    glow: 'bg-pink-500/[0.03]',
    badge: 'bg-pink-500/10 text-pink-400',
  },
  twitter: {
    icon: 'bg-sky-500/15 text-sky-400',
    glow: 'bg-sky-500/[0.03]',
    badge: 'bg-sky-500/10 text-sky-400',
  },
  odoo: {
    icon: 'bg-amber-500/15 text-amber-400',
    glow: 'bg-amber-500/[0.03]',
    badge: 'bg-amber-500/10 text-amber-400',
  },
  default: {
    icon: 'bg-white/[0.04] text-zinc-400',
    glow: '',
    badge: 'bg-zinc-700/40 text-zinc-400',
  },
}

export function StatusCard({
  name,
  displayName,
  status,
  lastRun,
  lastMessage,
  icon,
  brand = 'default',
  actionCount,
}: StatusCardProps) {
  const b = brandStyles[brand] ?? brandStyles.default

  return (
    <Card className="group relative overflow-hidden">
      {status === 'healthy' && b.glow && (
        <div className={cn('pointer-events-none absolute inset-0 rounded-xl', b.glow)} />
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', b.icon)}>
                {icon}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-zinc-200">{displayName}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">{name}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', statusDot(status))} />
              <span className="text-[10px] text-zinc-500 capitalize">{status}</span>
            </div>
            {actionCount !== undefined && actionCount > 0 && (
              <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold', b.badge)}>
                {actionCount} actions
              </span>
            )}
          </div>
        </div>

        {lastMessage && (
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-600 line-clamp-2">
            {lastMessage}
          </p>
        )}

        <p className="mt-2 text-[10px] text-zinc-700">
          {lastRun ? `Last run ${formatRelativeTime(lastRun)}` : 'Never run'}
        </p>
      </CardContent>
    </Card>
  )
}
