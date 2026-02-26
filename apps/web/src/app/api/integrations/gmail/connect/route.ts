import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 })

  let body: { email: string; appPassword: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, appPassword } = body
  if (!email?.trim() || !appPassword?.trim()) {
    return NextResponse.json({ error: 'Gmail address and App Password are required' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  await prisma.userConnection.upsert({
    where: { userId_provider: { userId, provider: 'gmail' } },
    update: {
      connected: true,
      displayName: email.trim(),
      metadata: {
        gmail_user: email.trim(),
        gmail_app_password: appPassword.trim(),
        source: 'web_setup',
      },
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider: 'gmail',
      connected: true,
      displayName: email.trim(),
      metadata: {
        gmail_user: email.trim(),
        gmail_app_password: appPassword.trim(),
        source: 'web_setup',
      },
    },
  })

  return NextResponse.json({ success: true, displayName: email.trim() })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 })

  await prisma.userConnection.updateMany({
    where: { userId, provider: 'gmail' },
    data: { connected: false, metadata: {}, updatedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
