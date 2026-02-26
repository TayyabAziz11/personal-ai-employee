import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })

  let body: {
    topic: string
    tone?: string
    length?: string
    channel?: string
    intent?: string
    hashtags?: string
    cta?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { topic, tone = 'Professional', length = 'Medium', channel = 'linkedin', intent, hashtags, cta } = body
  if (!topic?.trim()) return NextResponse.json({ error: 'topic is required' }, { status: 400 })

  const wordCount = length.includes('50') ? 50 : length.includes('300') ? 300 : 150

  const systemPrompt =
    channel === 'linkedin'
      ? 'You are an expert LinkedIn content writer. Write engaging, authentic posts that perform well on LinkedIn. Use short paragraphs, line breaks for readability, and a conversational yet professional tone. Never use hashtags in the middle of the post — add them only at the end if requested.'
      : `You are an expert ${channel} content writer. Write engaging content appropriate for the platform.`

  const parts = [
    `Write a ${tone.toLowerCase()} ${channel} post about: ${topic}`,
    intent ? `Intent: ${intent}` : '',
    `Target length: approximately ${wordCount} words`,
    hashtags ? `Hashtags to include at the end: ${hashtags}` : '',
    cta ? `Call to action to include at the end: ${cta}` : '',
    '',
    'Write ONLY the post content — no preamble like "Here is your post:", no quotes, just the raw post text.',
  ]
  const userPrompt = parts.filter(Boolean).join('\n')

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 900,
        temperature: 0.75,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as { error?: { message?: string } }).error?.message ?? 'OpenAI request failed' },
        { status: 500 }
      )
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[]
    }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
