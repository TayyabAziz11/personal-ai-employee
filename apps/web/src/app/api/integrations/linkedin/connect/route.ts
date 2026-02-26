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

interface LinkedInToken {
  access_token?: string
  person_urn?: string
  expires_at?: number
  scope?: string
}

interface LinkedInProfile {
  person_urn?: string
  person_id?: string
  method?: string
  cached_at?: string
  raw_me?: {
    localizedFirstName?: string
    localizedLastName?: string
    name?: string
    sub?: string
    email?: string
    picture?: string
  }
}

function readSecretsFile<T>(filename: string): T | null {
  try {
    const root = getRepoRoot()
    const p = path.join(root, '.secrets', filename)
    if (!fs.existsSync(p)) return null
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as T
  } catch {
    return null
  }
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 })

  // Try multiple token file names
  const token =
    readSecretsFile<LinkedInToken>('linkedin_token.json') ??
    readSecretsFile<LinkedInToken>('linkedin_oauth_token.json') ??
    readSecretsFile<LinkedInToken>('linkedin_credentials.json')

  if (!token?.access_token) {
    return NextResponse.json({
      connected: false,
      message:
        'LinkedIn token not found. Run the LinkedIn OAuth flow via CLI (`python3 -m personal_ai_employee.core.linkedin_api_helper --auth`) to generate .secrets/linkedin_token.json',
    })
  }

  // Check expiry
  const isExpired = token.expires_at && token.expires_at < Date.now() / 1000

  // Read cached profile (set by linkedin_api_helper._cache_profile)
  const profile = readSecretsFile<LinkedInProfile>('linkedin_profile.json')

  let displayName = 'LinkedIn User'
  let profilePicture: string | undefined

  if (profile?.raw_me) {
    const raw = profile.raw_me
    if (raw.name) displayName = raw.name
    else if (raw.localizedFirstName || raw.localizedLastName) {
      displayName = `${raw.localizedFirstName ?? ''} ${raw.localizedLastName ?? ''}`.trim()
    } else if (raw.sub) displayName = raw.sub
    profilePicture = raw.picture
  } else if (profile?.person_urn) {
    displayName = profile.person_urn.split(':').pop() ?? 'LinkedIn User'
  }

  // Extract profile URL from person_urn
  const personId = profile?.person_id ?? profile?.person_urn?.split(':').pop()
  const profileUrl = personId ? `https://www.linkedin.com/in/${personId}/` : undefined

  // Upsert connection in DB (NO token stored)
  await prisma.userConnection.upsert({
    where: { userId_provider: { userId, provider: 'linkedin' } },
    update: {
      connected: true,
      displayName,
      profileUrl: profileUrl ?? null,
      metadata: {
        person_urn: profile?.person_urn,
        scope: token.scope,
        expires_at: token.expires_at,
        is_expired: isExpired,
        picture: profilePicture,
        cached_at: profile?.cached_at,
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
        person_urn: profile?.person_urn,
        scope: token.scope,
        is_expired: isExpired,
        picture: profilePicture,
      },
    },
  })

  return NextResponse.json({
    connected: true,
    displayName,
    profileUrl,
    profilePicture,
    personUrn: profile?.person_urn,
    scope: token.scope,
    isExpired,
    message: isExpired
      ? `Token found but may be expired. Display name: ${displayName}. Re-run OAuth to refresh.`
      : `LinkedIn connected as ${displayName}`,
  })
}
