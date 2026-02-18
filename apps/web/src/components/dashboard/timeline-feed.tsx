import { cn, levelColor, formatDate, truncate } from '@/lib/utils'

interface EventLogEntry {
  id: string
  timestamp: Date | string
  level: string
  source: string
  message: string
  metadata?: unknown
}

interface TimelineFeedProps {
  events: EventLogEntry[]
  maxItems?: number
}

export function TimelineFeed({ events, maxItems = 20 }: TimelineFeedProps) {
  const displayed = events.slice(0, maxItems)

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-zinc-600">No events yet.</p>
        <p className="mt-1 text-xs text-zinc-700">Run a sync or daily cycle to populate the timeline.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[15px] top-0 h-full w-px bg-white/[0.05]" />

      <div className="space-y-1">
        {displayed.map((event) => (
          <div key={event.id} className="group relative flex items-start gap-3 py-1.5 pl-8 pr-2">
            {/* Dot */}
            <div
              className={cn(
                'absolute left-[11px] top-3 h-2 w-2 rounded-full ring-2 ring-[#07070f]',
                event.level === 'success' ? 'bg-emerald-400' :
                event.level === 'error' ? 'bg-red-400' :
                event.level === 'warning' ? 'bg-amber-400' :
                'bg-teal-500'
              )}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={cn('text-xs font-medium', levelColor(event.level))}>
                  [{event.source}]
                </span>
                <span className="text-[11px] text-zinc-400 leading-relaxed">
                  {truncate(event.message, 180)}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-700 font-mono">
                {formatDate(event.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
