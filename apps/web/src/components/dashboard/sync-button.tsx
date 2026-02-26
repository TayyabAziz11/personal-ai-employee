'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function SyncButton() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSync() {
    setStatus('syncing')
    setMessage(null)
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Sync failed')
      } else {
        setStatus('done')
        const { synced } = data
        setMessage(
          `Synced: ${synced.connections} connections, ${synced.plans} plans, ` +
            `${synced.inboxItems} inbox items, ${synced.eventLogs} logs`
        )
        router.refresh()
      }
    } catch (err) {
      setStatus('error')
      setMessage(String(err))
    }
    setTimeout(() => {
      setStatus('idle')
      setMessage(null)
    }, 6000)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={status === 'syncing'}
        loading={status === 'syncing'}
      >
        {status === 'done' ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <RefreshCw className={`h-3.5 w-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        )}
        {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
      </Button>
      {message && (
        <p
          className={`text-[10px] ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
