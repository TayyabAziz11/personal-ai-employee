'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Inbox,
  FileText,
  ScrollText,
  Settings,
  LogOut,
  Bot,
  Zap,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
  Newspaper,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  badge?: number
}

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  pendingApprovals?: number
}

export function Sidebar({ user, pendingApprovals = 0 }: SidebarProps) {
  const pathname = usePathname()

  const nav: NavItem[] = [
    { href: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/app/command-center', label: 'Command Center', icon: Cpu },
    { href: '/app/approvals', label: 'Approvals', icon: Clock, badge: pendingApprovals > 0 ? pendingApprovals : undefined },
    { href: '/app/approved', label: 'Approved', icon: CheckCircle2 },
    { href: '/app/executed', label: 'Executed', icon: Zap },
    { href: '/app/rejected', label: 'Rejected', icon: XCircle },
    { href: '/app/inbox', label: 'Inbox', icon: Inbox },
    { href: '/app/plans', label: 'All Plans', icon: FileText },
    { href: '/app/briefings', label: 'CEO Briefings', icon: Newspaper },
    { href: '/app/logs', label: 'Audit & Logs', icon: ShieldCheck },
    { href: '/app/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-white/[0.06] bg-[#080810]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/30">
          <Bot className="h-4 w-4 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-zinc-100">PersonalAI</p>
          <p className="text-[10px] text-zinc-600">Employee</p>
        </div>
        <Link
          href="/"
          title="Back to homepage"
          className="flex-shrink-0 rounded-md p-1 text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {/* Main group */}
        <div className="mb-4 space-y-0.5">
          {nav.slice(0, 2).map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-accent' : '')} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Plans group */}
        <p className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-widest text-zinc-700">
          Plans
        </p>
        <div className="mb-4 space-y-0.5">
          {nav.slice(2, 6).map(({ href, label, icon: Icon, exact, badge }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-accent' : '')} />
                <span className="flex-1">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Other group */}
        <p className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-widest text-zinc-700">
          Data
        </p>
        <div className="space-y-0.5">
          {nav.slice(6).map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-accent' : '')} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Status indicator */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-xs text-zinc-500">Agent Active</p>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* User */}
      <div className="border-t border-white/[0.06] px-2 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? ''} className="h-7 w-7 rounded-full ring-1 ring-white/10" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
              {(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-300">{user.name ?? 'User'}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-zinc-600 transition-colors hover:text-zinc-300"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
