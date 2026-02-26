import { prisma } from '@/lib/db'
import { readInboxFromFs } from '@/lib/fs-reader'
import { Topbar } from '@/components/layout/topbar'
import { InboxList } from './inbox-list'

async function getInboxItems() {
  try {
    const dbItems = await prisma.inboxItem.findMany({
      orderBy: { receivedAt: 'desc' },
      take: 100,
    })
    if (dbItems.length > 0) return { items: dbItems, source: 'db' as const }
  } catch { /* DB not ready */ }

  const fsItems = readInboxFromFs()
  return { items: fsItems, source: 'fs' as const }
}

export default async function InboxPage() {
  const { items, source } = await getInboxItems()

  const serialized = items.map((item) => ({
    id: 'id' in item ? (item.id as string) : undefined,
    source: item.source,
    status: item.status,
    excerpt: item.excerpt,
    filePath: ('filePath' in item ? item.filePath : null) as string | null,
    receivedAt: item.receivedAt instanceof Date ? item.receivedAt.toISOString() : String(item.receivedAt),
  }))

  const unreadCount = items.filter((i) => i.status === 'unread').length

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar
        title="Inbox"
        subtitle={`${unreadCount} unread · ${items.length} total · source: ${source}`}
      />
      <InboxList items={serialized} />
    </div>
  )
}
