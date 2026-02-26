import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

function getRepoRoot() {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  return path.resolve(process.cwd(), '..', '..')
}

function tokenFileExists(provider: string): boolean {
  try {
    const root = getRepoRoot()
    const patterns = [
      path.join(root, '.secrets', `${provider}_token.json`),
      path.join(root, '.secrets', `${provider}_credentials.json`),
      path.join(root, '.secrets', `${provider}_oauth_token.json`),
      path.join(root, 'Logs', `${provider}_watcher_checkpoint.json`),
    ]
    return patterns.some((p) => fs.existsSync(p))
  } catch {
    return false
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id ?? ''

  // Load stored connections from DB
  const dbConnections = await prisma.userConnection.findMany({ where: { userId } }).catch(() => [])
  const dbMap = Object.fromEntries(dbConnections.map((c) => [c.provider, c]))

  const providers = ['linkedin', 'gmail', 'whatsapp', 'twitter', 'instagram', 'odoo']
  const statusMap: Record<string, {
    connected: boolean
    displayName?: string
    profileUrl?: string
    source: string
    metadata?: Record<string, unknown>
  }> = {}

  for (const provider of providers) {
    const db = dbMap[provider]
    if (db?.connected) {
      statusMap[provider] = {
        connected: true,
        displayName: db.displayName ?? undefined,
        profileUrl: db.profileUrl ?? undefined,
        source: 'db',
        metadata: (db.metadata as Record<string, unknown>) ?? undefined,
      }
    } else {
      // Fall back to checking token files (local dev)
      const hasToken = tokenFileExists(provider)
      if (hasToken) {
        // For gmail, use GMAIL_USER env var as the display name
        const displayName = provider === 'gmail'
          ? (process.env.GMAIL_USER ?? undefined)
          : undefined
        statusMap[provider] = {
          connected: true,
          displayName,
          source: 'token_file',
        }
      } else if (provider === 'gmail' && process.env.GMAIL_USER) {
        // Gmail configured via env var only (no token file yet)
        statusMap[provider] = {
          connected: false,
          displayName: process.env.GMAIL_USER,
          source: 'env',
        }
      } else {
        statusMap[provider] = {
          connected: false,
          source: 'none',
        }
      }
    }
  }

  // Instagram: always check credentials file directly — the generic tokenFileExists check
  // above may have marked it connected but doesn't populate displayName/username.
  try {
    const igCreds = path.join(getRepoRoot(), '.secrets', 'instagram_credentials.json')
    if (fs.existsSync(igCreds)) {
      const creds = JSON.parse(fs.readFileSync(igCreds, 'utf-8'))
      const hasToken = creds.access_token && !creds.access_token.startsWith('YOUR_')
      const hasUserId = creds.ig_user_id && !creds.ig_user_id.startsWith('YOUR_')
      statusMap['instagram'] = {
        connected: !!(hasToken && hasUserId),
        displayName: creds.username ? `@${creds.username}` : undefined,
        source: 'credentials_file',
      }
    }
  } catch { /* ignore */ }

  // Odoo: check credentials file directly for configured and real credentials.
  try {
    const odooCreds = path.join(getRepoRoot(), '.secrets', 'odoo_credentials.json')
    if (fs.existsSync(odooCreds)) {
      const creds = JSON.parse(fs.readFileSync(odooCreds, 'utf-8'))
      const hasUrl = creds.base_url && !creds.base_url.includes('localhost')
      const hasPassword = creds.password && !creds.password.startsWith('YOUR_')
      const hasDb = creds.database && creds.database !== 'my_company_db'
      statusMap['odoo'] = {
        connected: !!(hasUrl && hasPassword && hasDb),
        displayName: hasDb ? `Odoo: ${creds.database}` : 'Odoo (mock/local)',
        source: 'credentials_file',
      }
    }
  } catch { /* ignore */ }

  // WhatsApp uses a Playwright session meta file, not OAuth token files.
  // Override whatever the generic check returned above.
  if (!statusMap['whatsapp']?.connected) {
    try {
      const metaPath = path.join(getRepoRoot(), '.secrets', 'whatsapp_session_meta.json')
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        if (meta.status === 'connected') {
          statusMap['whatsapp'] = {
            connected: true,
            displayName: 'WhatsApp Web',
            source: 'session_meta',
          }
        }
      }
    } catch { /* ignore parse errors */ }
  }

  return NextResponse.json(statusMap)
}
