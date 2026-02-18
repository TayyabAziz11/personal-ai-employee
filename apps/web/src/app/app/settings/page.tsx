import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readWatcherStatuses } from '@/lib/fs-reader'
import { Topbar } from '@/components/layout/topbar'
import { SyncButton } from '@/components/dashboard/sync-button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, statusDot } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'

const ENV_VARS = [
  { key: 'DATABASE_URL', label: 'Neon Postgres', required: true },
  { key: 'NEXTAUTH_SECRET', label: 'NextAuth Secret', required: true },
  { key: 'GITHUB_CLIENT_ID', label: 'GitHub OAuth ID', required: true },
  { key: 'GITHUB_CLIENT_SECRET', label: 'GitHub OAuth Secret', required: true },
  { key: 'REPO_ROOT', label: 'Repo Root Path (local sync)', required: false },
  { key: 'OPENAI_API_KEY', label: 'OpenAI Key (content gen)', required: false },
]

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const watchers = readWatcherStatuses()

  const envStatus = ENV_VARS.map((e) => ({
    ...e,
    set: !!process.env[e.key],
  }))

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar title="Settings" subtitle="Environment readiness + connection status" />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6 space-y-6">
        {/* User info */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ''}
                  className="h-10 w-10 rounded-full ring-2 ring-white/10"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-400">
                  {session?.user?.name?.charAt(0) ?? 'U'}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-zinc-200">{session?.user?.name}</p>
                <p className="text-xs text-zinc-500">{session?.user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Watcher Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {watchers.map((w) => (
                <div key={w.name} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{w.displayName}</p>
                    <p className="text-xs text-zinc-600 font-mono truncate max-w-[300px]">{w.lastMessage}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', statusDot(w.status))} />
                    <span className="text-xs text-zinc-500 capitalize">{w.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <SyncButton />
            </div>
          </CardContent>
        </Card>

        {/* Env readiness */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {envStatus.map((e) => (
                <div key={e.key} className="flex items-center justify-between rounded-lg border border-white/[0.05] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {e.set ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : e.required ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-zinc-600" />
                    )}
                    <div>
                      <p className="font-mono text-xs text-zinc-300">{e.key}</p>
                      <p className="text-[10px] text-zinc-600">{e.label}</p>
                    </div>
                  </div>
                  <Badge variant={e.set ? 'success' : e.required ? 'error' : 'muted'}>
                    {e.set ? 'Set' : e.required ? 'Required' : 'Optional'}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              Note: Env var values are never shown for security. Only presence is checked.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
