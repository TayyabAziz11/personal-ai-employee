import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  // Remove trailing slash to avoid double-slash
  const cleanBase = baseUrl.replace(/\/$/, '')
  const redirectUri = `${cleanBase}/api/integrations/linkedin/oauth/callback`

  return NextResponse.json({ redirectUri })
}
