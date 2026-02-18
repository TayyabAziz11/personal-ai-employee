import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncFromFilesystem } from '@/lib/sync'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncFromFilesystem()
    return NextResponse.json({
      ok: true,
      synced: result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[sync] error:', err)
    return NextResponse.json(
      { error: 'Sync failed', detail: String(err) },
      { status: 500 }
    )
  }
}
