/**
 * Gmail client for Next.js — reads token from .secrets/gmail_token.json,
 * auto-refreshes when expired, then calls Gmail REST API directly.
 */
import fs from 'fs'
import path from 'path'

interface GmailToken {
  token?: string
  access_token?: string
  refresh_token: string
  token_uri: string
  client_id: string
  client_secret: string
  expiry?: string
}

interface GmailHeader { name: string; value: string }
interface GmailPart { mimeType: string; body: { data?: string }; parts?: GmailPart[] }
interface GmailPayload { headers: GmailHeader[]; body?: { data?: string }; parts?: GmailPart[] }
interface GmailMessageRaw { id: string; threadId: string; snippet: string; payload: GmailPayload; internalDate: string; labelIds?: string[] }

export interface EmailSummary {
  id: string
  threadId: string
  from: string
  subject: string
  snippet: string
  date: string
  unread: boolean
}

function getRepoRoot(): string {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  return path.resolve(process.cwd(), '..', '..')
}

function loadTokenData(): GmailToken | null {
  try {
    const root = getRepoRoot()
    const tokenPath = path.join(root, '.secrets', 'gmail_token.json')
    if (fs.existsSync(tokenPath)) {
      return JSON.parse(fs.readFileSync(tokenPath, 'utf-8')) as GmailToken
    }
  } catch { /* skip */ }
  return null
}

function saveTokenData(data: GmailToken): void {
  try {
    const root = getRepoRoot()
    const tokenPath = path.join(root, '.secrets', 'gmail_token.json')
    fs.writeFileSync(tokenPath, JSON.stringify(data, null, 2))
  } catch { /* non-fatal */ }
}

export async function getGmailAccessToken(): Promise<string> {
  const tokenData = loadTokenData()
  if (!tokenData?.refresh_token) {
    throw new Error('Gmail token not found. Check .secrets/gmail_token.json')
  }

  const accessToken = tokenData.token ?? tokenData.access_token
  const expiry = tokenData.expiry ? new Date(tokenData.expiry) : null
  const isValid = accessToken && expiry && expiry > new Date(Date.now() + 60_000)

  if (isValid) return accessToken!

  // Refresh
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
      client_id: tokenData.client_id,
      client_secret: tokenData.client_secret,
    }).toString(),
  })

  if (!res.ok) {
    throw new Error(`Gmail token refresh failed: ${await res.text()}`)
  }

  const refreshed = await res.json() as { access_token: string; expires_in: number }
  const updated: GmailToken = {
    ...tokenData,
    token: refreshed.access_token,
    access_token: refreshed.access_token,
    expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
  }
  saveTokenData(updated)
  return refreshed.access_token
}

export async function listGmailMessages(query = 'is:inbox', maxResults = 15): Promise<EmailSummary[]> {
  const token = await getGmailAccessToken()

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status} ${await listRes.text()}`)

  const listData = await listRes.json() as { messages?: { id: string; threadId: string }[] }
  if (!listData.messages?.length) return []

  const details = await Promise.all(
    listData.messages.map(async (msg) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!r.ok) return null
      return await r.json() as GmailMessageRaw
    })
  )

  return details.filter((d): d is GmailMessageRaw => d !== null).map((d) => {
    const h = (name: string) =>
      (d.payload.headers ?? []).find((x) => x.name.toLowerCase() === name.toLowerCase())?.value ?? ''
    return {
      id: d.id,
      threadId: d.threadId,
      from: h('From'),
      subject: h('Subject') || '(no subject)',
      snippet: d.snippet ?? '',
      date: h('Date'),
      unread: (d.labelIds ?? []).includes('UNREAD'),
    }
  })
}

function extractBody(payload: GmailPayload): string {
  const decode = (data?: string) => (data ? Buffer.from(data, 'base64url').toString('utf-8') : '')
  if (payload.body?.data) return decode(payload.body.data)
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) return decode(part.body.data)
    }
    // Recurse into multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody({ headers: [], parts: part.parts })
        if (nested) return nested
      }
    }
  }
  return ''
}

export async function getGmailMessageBody(messageId: string): Promise<string> {
  const token = await getGmailAccessToken()
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Gmail message fetch failed: ${res.status}`)
  const msg = await res.json() as GmailMessageRaw
  return extractBody(msg.payload) || msg.snippet || ''
}
