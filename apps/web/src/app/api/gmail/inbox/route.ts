import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listGmailMessages } from '@/lib/gmail-client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? 'is:inbox'
  const max = Math.min(parseInt(searchParams.get('max') ?? '15'), 20)

  try {
    const messages = await listGmailMessages(query, max)
    return NextResponse.json({ messages, query, count: messages.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ messages: [], error: msg, count: 0 })
  }
}
