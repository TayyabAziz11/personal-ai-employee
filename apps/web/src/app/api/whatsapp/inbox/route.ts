import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const REPO_ROOT = process.cwd().replace(/\/apps\/web$/, '')

// ── Session meta helper ──────────────────────────────────────────────────────

function readSessionMeta(): { connected: boolean; lastStatus: string; updatedAt: string | null } {
  const metaPath = path.join(REPO_ROOT, '.secrets', 'whatsapp_session_meta.json')
  if (!fs.existsSync(metaPath)) return { connected: false, lastStatus: 'unknown', updatedAt: null }
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    return {
      connected: meta.status === 'connected',
      lastStatus: meta.status ?? 'unknown',
      updatedAt: meta.updated_at ?? null,
    }
  } catch {
    return { connected: false, lastStatus: 'unknown', updatedAt: null }
  }
}

// ── Live chats via Python helper ─────────────────────────────────────────────

async function fetchLiveChats(): Promise<{
  id: string
  sender: string
  received_at: string
  excerpt: string
  status: string
  unread_count: number
}[]> {
  const script = path.join(REPO_ROOT, 'scripts', 'wa_live_chats.py')
  try {
    const { stdout } = await execAsync(`python3 "${script}"`, {
      cwd: REPO_ROOT,
      timeout: 90_000,
    })
    const parsed = JSON.parse(stdout.trim())
    if (parsed.error && parsed.error !== 'null') {
      console.error('[wa_live_chats] error:', parsed.error)
      return []
    }
    // Map WhatsAppWebClient list_chats() output → frontend message format
    return (parsed.chats ?? []).map((chat: {
      chat_id: string
      name: string
      unread_count: number
      last_msg_preview: string
      timestamp: string
    }) => ({
      id: chat.chat_id,
      sender: chat.name,
      // WhatsApp gives relative timestamps ("Yesterday", "10:30") — keep as-is
      received_at: chat.timestamp,
      excerpt: chat.last_msg_preview,
      status: chat.unread_count > 0 ? 'unread' : 'read',
      unread_count: chat.unread_count,
    }))
  } catch (e) {
    console.error('[wa_live_chats] spawn error:', e)
    return []
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connected, lastStatus, updatedAt } = readSessionMeta()

  let messages: {
    id: string
    sender: string
    received_at: string
    excerpt: string
    status: string
    unread_count: number
  }[] = []

  let source = 'none'

  if (connected) {
    // Session is live — fetch real chats directly from WhatsApp Web
    messages = await fetchLiveChats()
    source = messages.length > 0 ? 'live' : 'live_empty'
  }
  // No fallback to wrapper files — stale/mock data must never appear here

  return NextResponse.json({ connected, lastStatus, updatedAt, messages, source })
}
