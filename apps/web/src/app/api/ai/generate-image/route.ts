import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })

  let body: { imageSubject?: string; imageStyle?: string; imageVibe?: string; topic?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { imageSubject, imageStyle, imageVibe, topic } = body
  const subject = imageSubject?.trim() || topic?.trim() || 'Professional business visual'

  const promptParts = [
    subject,
    imageStyle ? `Style: ${imageStyle}` : '',
    imageVibe ? `Mood: ${imageVibe}` : '',
    'Professional LinkedIn post visual, high quality, no text overlay',
  ].filter(Boolean)

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: promptParts.join('. '),
        size: '1024x1024',
        n: 1,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as { error?: { message?: string } }).error?.message ?? 'DALL-E request failed' },
        { status: 500 }
      )
    }

    const data = await response.json() as { data: { url: string }[] }
    const imageUrl = data.data?.[0]?.url
    if (!imageUrl) throw new Error('No image URL in response')

    return NextResponse.json({ imageUrl })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Image generation failed' },
      { status: 500 }
    )
  }
}
