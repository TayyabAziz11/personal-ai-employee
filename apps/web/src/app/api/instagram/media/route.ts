import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

function getRepoRoot() {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  return path.resolve(process.cwd(), '..', '..')
}

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined

interface MediaItem {
  id: string
  caption?: string
  media_type?: string
  timestamp?: string
  permalink?: string
  comments_count?: number
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (IS_VERCEL) {
    return NextResponse.json({ media: [], message: 'Instagram media unavailable on Vercel' })
  }

  const root = getRepoRoot()

  // Fast path: read from watcher checkpoint (Social/Inbox/ parsed from YAML front-matter)
  try {
    const inboxDir = path.join(root, 'Social', 'Inbox')
    if (fs.existsSync(inboxDir)) {
      const files = fs.readdirSync(inboxDir)
        .filter((f) => f.startsWith('inbox__instagram__media_post__') && f.endsWith('.md'))
        .sort()
        .reverse()
        .slice(0, 10)

      if (files.length > 0) {
        const media: MediaItem[] = files.map((f) => {
          const raw = fs.readFileSync(path.join(inboxDir, f), 'utf-8')
          const fm = raw.match(/^---\n([\s\S]*?)\n---/)
          const obj: Record<string, string> = {}
          if (fm) {
            fm[1].split('\n').forEach((line) => {
              const [k, ...rest] = line.split(':')
              obj[k.trim()] = rest.join(':').trim()
            })
          }
          // Extract caption from ## Content section
          const captionMatch = raw.match(/### Content\n\n([\s\S]*?)\n\n###/)
          return {
            id:             obj.id ?? f,
            media_type:     obj.media_type || 'IMAGE',
            timestamp:      obj.timestamp || '',
            permalink:      obj.permalink || '',
            caption:        captionMatch?.[1]?.trim() ?? '',
            comments_count: undefined,
          }
        })
        return NextResponse.json({ media, source: 'inbox' })
      }
    }
  } catch { /* fall through to Python */ }

  // Live path: call Instagram API via Python helper
  return new Promise<NextResponse>((resolve) => {
    const pyCode = `
import sys, json
sys.path.insert(0, '${root}')
sys.path.insert(0, '${path.join(root, 'src')}')
try:
    from personal_ai_employee.core.instagram_api_helper import InstagramAPIHelper
    h = InstagramAPIHelper()
    items = h.list_recent_media(limit=10)
    print(json.dumps({"media": items}))
except Exception as e:
    print(json.dumps({"media": [], "error": str(e)}))
`.trim()

    const proc = spawn('python3', ['-c', pyCode], {
      cwd: root,
      env: { ...process.env },
    })

    let out = ''
    proc.stdout.on('data', (d) => { out += d.toString() })
    proc.on('close', () => {
      try {
        const lines = out.trim().split('\n').filter(Boolean)
        const last = lines[lines.length - 1]
        const data = JSON.parse(last ?? '{}')
        resolve(NextResponse.json({ media: data.media ?? [], error: data.error, source: 'api' }))
      } catch {
        resolve(NextResponse.json({ media: [], message: 'Could not parse Instagram response' }))
      }
    })
    proc.on('error', () => {
      resolve(NextResponse.json({ media: [], message: 'Python runtime not available' }))
    })
  })
}
