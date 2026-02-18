import { prisma } from '@/lib/db'
import { readInboxFromFs } from '@/lib/fs-reader'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Mail, Briefcase, Twitter, MessageSquare, ActivitySquare, FolderOpen } from 'lucide-react'

const sourceIcon: Record<string, React.ReactNode> = {
  gmail: <Mail className="h-3.5 w-3.5" />,
  linkedin: <Briefcase className="h-3.5 w-3.5" />,
  twitter: <Twitter className="h-3.5 w-3.5" />,
  whatsapp: <MessageSquare className="h-3.5 w-3.5" />,
  odoo: <ActivitySquare className="h-3.5 w-3.5" />,
  filesystem: <FolderOpen className="h-3.5 w-3.5" />,
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'muted'> = {
  unread: 'warning',
  read: 'muted',
  actioned: 'success',
  archived: 'muted',
}

async function getInboxItems() {
  try {
    const dbItems = await prisma.inboxItem.findMany({
      orderBy: { receivedAt: 'desc' },
      take: 100,
    })
    if (dbItems.length > 0) return { items: dbItems, source: 'db' as const }
  } catch { /* DB not ready */ }

  // Fall back to FS
  const fsItems = readInboxFromFs()
  return { items: fsItems, source: 'fs' as const }
}

export default async function InboxPage() {
  const { items, source } = await getInboxItems()

  const unreadCount = items.filter((i) => i.status === 'unread').length
  const bySource = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.source] = (acc[i.source] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Inbox"
        subtitle={`${unreadCount} unread · ${items.length} total · source: ${source}`}
      />

      <div className="flex-1 overflow-y-auto bg-grid px-6 py-6">
        {/* Source filter summary */}
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(bySource).map(([src, count]) => (
            <div
              key={src}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400"
            >
              {sourceIcon[src] ?? <FolderOpen className="h-3 w-3" />}
              <span className="capitalize">{src}</span>
              <span className="font-mono text-zinc-600">{count}</span>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <EmptyState message="No inbox items found. Run a sync to populate from vault files." />
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <Card key={('id' in item ? item.id : undefined) ?? `item-${i}`} className="group cursor-pointer hover:border-white/[0.12]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-zinc-500">
                        {sourceIcon[item.source] ?? <FolderOpen className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium capitalize text-zinc-300">
                            {item.source}
                          </span>
                          <Badge variant={statusVariant[item.status] ?? 'muted'}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-2">
                          {item.excerpt}
                        </p>
                        {item.filePath && (
                          <p className="mt-1 font-mono text-[10px] text-zinc-700">{item.filePath}</p>
                        )}
                      </div>
                    </div>
                    <p className="flex-shrink-0 text-[10px] text-zinc-700">
                      {formatRelativeTime(item.receivedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Mail className="mb-3 h-8 w-8 text-zinc-700" />
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  )
}
