'use client'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type ServiceInfo = {
  name: string
  status: string
  uptime_seconds: number
  restarts: number
  memory_mb: number
}

function fmtUptime(s: number): string {
  if (s <= 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function SystemStatusCard() {
  const [services, setServices]       = useState<ServiceInfo[]>([])
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const poll = () =>
      fetch('/api/system-status')
        .then((r) => r.json())
        .then((d: { status?: string; services?: ServiceInfo[] }) => {
          if (d.status === 'unavailable' || !d.services) {
            setUnavailable(true)
          } else {
            setServices(d.services)
            setUnavailable(false)
          }
        })
        .catch(() => setUnavailable(true))

    poll()
    const t = setInterval(poll, 10_000)
    return () => clearInterval(t)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>PM2 Services</CardTitle>
      </CardHeader>
      <CardContent>
        {unavailable ? (
          <p className="text-xs text-zinc-600">Status unavailable — PM2 may not be running.</p>
        ) : services.length === 0 ? (
          <p className="text-xs text-zinc-600">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-zinc-600">
                  <th className="pb-2 pr-3 font-medium">Service</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Uptime</th>
                  <th className="pb-2 pr-3 font-medium">Restarts</th>
                  <th className="pb-2 font-medium">Mem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {services.map((svc) => (
                  <tr key={svc.name}>
                    <td className="py-1.5 pr-3 font-mono text-zinc-300">{svc.name}</td>
                    <td className="py-1.5 pr-3">
                      <span className="flex items-center gap-1">
                        <span className={svc.status === 'online' ? 'text-teal-400' : 'text-red-400'}>
                          {svc.status === 'online' ? '●' : '●'}
                        </span>
                        <span className={svc.status === 'online' ? 'text-teal-400' : 'text-red-400'}>
                          {svc.status}
                        </span>
                      </span>
                    </td>
                    <td className="py-1.5 pr-3 text-zinc-400">{fmtUptime(svc.uptime_seconds)}</td>
                    <td className="py-1.5 pr-3 text-zinc-400">{svc.restarts}</td>
                    <td className="py-1.5 text-zinc-400">{svc.memory_mb} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
