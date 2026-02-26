import { exec } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout } = await execAsync('pm2 jlist', { timeout: 5000 })
    const processes = JSON.parse(stdout) as Record<string, unknown>[]
    const services = processes.map((p) => {
      const env   = p.pm2_env as Record<string, unknown> | undefined
      const monit = p.monit  as Record<string, unknown> | undefined
      return {
        name:           p.name as string,
        status:         (env?.status as string) ?? 'unknown',
        uptime_seconds: env?.status === 'online'
          ? Math.floor((Date.now() - (env.pm_uptime as number)) / 1000)
          : 0,
        restarts:   (env?.restart_time  as number) ?? 0,
        memory_mb:  Math.round(((monit?.memory as number) ?? 0) / 1024 / 1024),
      }
    })
    return NextResponse.json({ services })
  } catch {
    return NextResponse.json({ services: [], status: 'unavailable' })
  }
}
