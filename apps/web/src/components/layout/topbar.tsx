import { RefreshCw } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface TopbarProps {
  title: string
  subtitle?: string
  lastSync?: Date | null
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, lastSync, actions }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#080810]/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {lastSync && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <RefreshCw className="h-3 w-3" />
            <span>Synced {formatRelativeTime(lastSync)}</span>
          </div>
        )}
        {actions}
      </div>
    </header>
  )
}
