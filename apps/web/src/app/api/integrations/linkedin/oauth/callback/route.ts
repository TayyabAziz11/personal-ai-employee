import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state') // userId stored as state
  const oauthError = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const channelUrl = `${baseUrl}/app/command-center/linkedin`

  if (oauthError) {
    return NextResponse.redirect(
      `${channelUrl}?error=${encodeURIComponent(errorDesc ?? oauthError)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(`${channelUrl}?error=missing_params`)
  }

  const userId = state

  // Retrieve stored credentials
  const connection = await prisma.userConnection
    .findUnique({ where: { userId_provider: { userId, provider: 'linkedin' } } })
    .catch(() => null)

  const meta = connection?.metadata as Record<string, unknown> | null
  const clientId = meta?.pending_client_id as string | undefined
  const clientSecret = meta?.pending_client_secret as string | undefined

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${channelUrl}?error=credentials_not_found`)
  }

  const redirectUri = `${baseUrl}/api/integrations/linkedin/oauth/callback` // must match exactly what was sent in /start

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    })

    if (!tokenRes.ok) {
      console.error('LinkedIn token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${channelUrl}?error=token_exchange_failed`)
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      expires_in?: number
      scope?: string
    }
    const accessToken = tokenData.access_token
    const expiresAt = tokenData.expires_in
      ? Math.floor(Date.now() / 1000) + tokenData.expires_in
      : undefined

    // Fetch user profile via OpenID Connect userinfo endpoint
    let displayName = 'LinkedIn User'
    let profilePicture: string | undefined
    let personId: string | undefined
    let personUrn: string | undefined

    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (profileRes.ok) {
      const profile = await profileRes.json() as {
        name?: string
        given_name?: string
        family_name?: string
        picture?: string
        sub?: string
        email?: string
      }
      const nameParts = `${profile.given_name ?? ''} ${profile.family_name ?? ''}`.trim()
      displayName = profile.name ?? (nameParts || 'LinkedIn User')
      profilePicture = profile.picture
      personId = profile.sub
      personUrn = personId ? `urn:li:person:${personId}` : undefined
    }

    const profileUrl = personId ? `https://www.linkedin.com/in/${personId}/` : undefined

    // Save connection to DB
    await prisma.userConnection.upsert({
      where: { userId_provider: { userId, provider: 'linkedin' } },
      update: {
        connected: true,
        displayName,
        profileUrl: profileUrl ?? null,
        metadata: {
          access_token: accessToken,
          expires_at: expiresAt,
          is_expired: false,
          person_urn: personUrn,
          person_id: personId,
          picture: profilePicture,
          client_id: clientId,
          client_secret: clientSecret,
          scope: tokenData.scope,
          source: 'web_oauth',
        },
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: 'linkedin',
        connected: true,
        displayName,
        profileUrl: profileUrl ?? null,
        metadata: {
          access_token: accessToken,
          expires_at: expiresAt,
          is_expired: false,
          person_urn: personUrn,
          person_id: personId,
          picture: profilePicture,
          client_id: clientId,
          client_secret: clientSecret,
          scope: tokenData.scope,
          source: 'web_oauth',
        },
      },
    })

    return NextResponse.redirect(`${channelUrl}?connected=1`)
  } catch (err) {
    console.error('LinkedIn OAuth error:', err)
    return NextResponse.redirect(`${channelUrl}?error=oauth_failed`)
  }
}
