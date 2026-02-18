import { cn, statusDot, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatusCardProps {
  name: string
  displayName: string
  status: string
  lastRun: Date | string | null
  lastMessage?: string
  icon?: React.ReactNode
}

export function StatusCard({ name, displayName, status, lastRun, lastMessage, icon }: StatusCardProps) {
  return (
    <Card className="group relative overflow-hidden">
      {/* Subtle glow on healthy */}
      {status === 'healthy' && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-emerald-500/[0.03]" />
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400">
                {icon}
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-zinc-200">{displayName}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">{name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', statusDot(status))} />
            <span className="text-xs text-zinc-500 capitalize">{status}</span>
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
