import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getGmailMessageBody } from '@/lib/gmail-client'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id ?? ''
  const { messageId, from, subject, snippet } = await req.json() as {
    messageId: string
    from: string
    subject: string
    snippet: string
  }

  // Fetch full email body for context
  let emailBody = snippet
  try {
    const body = await getGmailMessageBody(messageId)
    if (body.trim()) emailBody = body
  } catch { /* fall back to snippet */ }

  // Extract sender email address
  const senderEmail = from.match(/<([^>]+)>/)?.[1] ?? from.trim()

  // Generate AI reply
  let aiReply = `Hi,\n\nThank you for your message regarding "${subject}".\n\n[Your reply here]\n\nBest regards`
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a professional email assistant. Write a concise, professional reply to the email. Keep it under 120 words. Write only the email body — no subject line, no "Subject:" prefix.',
            },
            {
              role: 'user',
              content: `From: ${from}\nSubject: ${subject}\n\nEmail content:\n${emailBody.slice(0, 1200)}`,
            },
          ],
          max_tokens: 250,
          temperature: 0.7,
        }),
      })
      const data = await res.json() as { choices?: { message: { content: string } }[] }
      const content = data.choices?.[0]?.message?.content?.trim()
      if (content) aiReply = content
    } catch { /* use fallback */ }
  }

  // Create pending approval plan
  const plan = await prisma.webPlan.create({
    data: {
      userId,
      title: `Reply to: ${subject.slice(0, 60)}`,
      channel: 'gmail',
      actionType: 'send_email',
      status: 'pending_approval',
      payload: {
        recipient: senderEmail,
        subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
        body: aiReply,
        tone: 'Professional',
        length: 'Brief (~50 words)',
        intent: 'Reply',
        source_message_id: messageId,
      },
    },
  })

  return NextResponse.json({
    success: true,
    planId: plan.id,
    preview: aiReply.slice(0, 300),
  })
}
