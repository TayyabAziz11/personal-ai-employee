'use client'

import { useState } from 'react'
import { Mail, Briefcase, Twitter, MessageSquare, ActivitySquare, FolderOpen, Trash2, X, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelativeTime } from '@/lib/utils'

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

interface InboxItemData {
  id?: string
  source: string
  status: string
  excerpt: string
  filePath?: string | null
  receivedAt: string
}

export function InboxList({ items: initialItems }: { items: InboxItemData[] }) {
  const [items, setItems] = useState(initialItems)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const bySource = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.source] = (acc[i.source] ?? 0) + 1
    return acc
  }, {})

  async function handleDelete(id: string) {
    setDeleting(id)
    setConfirmId(null)
    try {
      const res = await fetch('/api/inbox/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
      }
    } finally {
      setDeleting(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Mail className="mb-3 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">No inbox items found. Run a sync to populate from vault files.</p>
      </div>
    )
  }

  return (
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

      <div className="space-y-2">
        {items.map((item, i) => (
          <Card key={item.id ?? `item-${i}`} className="group hover:border-white/[0.12]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-zinc-500">
                    {sourceIcon[item.source] ?? <FolderOpen className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium capitalize text-zinc-300">{item.source}</span>
                      <Badge variant={statusVariant[item.status] ?? 'muted'}>{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-2">{item.excerpt}</p>
                    {item.filePath && (
                      <p className="mt-1 font-mono text-[10px] text-zinc-700 truncate max-w-xs">{item.filePath}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <p className="text-[10px] text-zinc-700">{formatRelativeTime(item.receivedAt)}</p>

                  {/* Delete control — only show for items that have an id */}
                  {item.id && (
                    <>
                      {confirmId === item.id ? (
                        // Inline confirmation
                        <div className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1">
                          <span className="text-[10px] text-red-400 mr-1">Delete?</span>
                          <button
                            onClick={() => handleDelete(item.id!)}
                            disabled={deleting === item.id}
                            title="Confirm delete"
                            className="rounded p-0.5 text-red-400 hover:bg-red-500/20"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            title="Cancel"
                            className="rounded p-0.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(item.id!)}
                          disabled={deleting === item.id}
                          title="Delete"
                          className={cn(
                            'rounded-md p-1 text-zinc-700 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400',
                            deleting === item.id && 'opacity-100'
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
