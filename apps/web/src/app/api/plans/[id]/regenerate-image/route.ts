import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })

  const userId = (session.user as { id?: string })?.id
  const { id } = params

  const plan = await prisma.webPlan.findUnique({ where: { id } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payload = plan.payload as Record<string, unknown>
  const imageSubject = (payload.imageSubject as string | undefined)?.trim() || ''
  const imageStyle = (payload.imageStyle as string | undefined)?.trim() || ''
  const imageVibe = (payload.imageVibe as string | undefined)?.trim() || ''
  const topic = (payload.topic as string | undefined)?.trim() || ''
  const subject = imageSubject || topic || 'Professional business visual'

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

    // Store preview URL in plan payload
    await prisma.webPlan.update({
      where: { id },
      data: {
        payload: { ...payload, previewImageUrl: imageUrl },
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ imageUrl })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Image generation failed' },
      { status: 500 }
    )
  }
}
