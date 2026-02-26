import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 })

  let body: { clientId: string; clientSecret: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { clientId, clientSecret } = body
  if (!clientId?.trim() || !clientSecret?.trim()) {
    return NextResponse.json({ error: 'clientId and clientSecret are required' }, { status: 400 })
  }

  const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const redirectUri = `${baseUrl}/api/integrations/linkedin/oauth/callback`

  // Save credentials to DB so callback can retrieve them
  await prisma.userConnection.upsert({
    where: { userId_provider: { userId, provider: 'linkedin' } },
    update: {
      metadata: {
        pending_client_id: clientId.trim(),
        pending_client_secret: clientSecret.trim(),
        oauth_state: userId,
      },
      connected: false,
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider: 'linkedin',
      connected: false,
      metadata: {
        pending_client_id: clientId.trim(),
        pending_client_secret: clientSecret.trim(),
        oauth_state: userId,
      },
    },
  })

  // Build LinkedIn authorization URL
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId.trim())
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', userId)
  authUrl.searchParams.set('scope', 'openid profile email w_member_social')

  return NextResponse.json({ authUrl: authUrl.toString(), redirectUri })
}
