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

interface Post {
  id: string
  text: string
  created: string
  likes?: number
  comments?: number
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (IS_VERCEL) {
    return NextResponse.json({ posts: [], message: 'Recent posts unavailable on Vercel' })
  }

  const root = getRepoRoot()

  // Try reading from checkpoint first (fast, no network)
  try {
    const cpPath = path.join(root, 'Logs', 'linkedin_watcher_checkpoint.json')
    if (fs.existsSync(cpPath)) {
      const cp = JSON.parse(fs.readFileSync(cpPath, 'utf-8'))
      const rawPosts: Record<string, unknown>[] = cp.recent_posts ?? cp.posts ?? []
      if (rawPosts.length > 0) {
        const posts: Post[] = rawPosts.slice(0, 10).map((p, i) => ({
          id: (p.id as string) ?? String(i),
          text: (p.text as string) ?? (p.commentary as string) ?? (p.content as string) ?? '',
          created: (p.created as string) ?? (p.timestamp as string) ?? new Date().toISOString(),
          likes: p.likes as number | undefined,
          comments: p.comments as number | undefined,
        }))
        return NextResponse.json({ posts, source: 'checkpoint' })
      }
    }
  } catch { /* fall through to Python */ }

  // Spawn Python to fetch live — uses list_posts() (the correct method)
  return new Promise<NextResponse>((resolve) => {
    const pyCode = `
import sys, json
sys.path.insert(0, '${root}')
sys.path.insert(0, '${path.join(root, 'src')}')
try:
    from personal_ai_employee.core.linkedin_api_helper import LinkedInAPIHelper
    h = LinkedInAPIHelper()
    author_urn = h.get_author_urn()
    raw = h.list_posts(author_urn=author_urn, count=10)
    posts = []
    for p in (raw or []):
        posts.append({
            "id": p.get("id", ""),
            "text": p.get("text", p.get("commentary", "")),
            "created": p.get("created", ""),
            "likes": p.get("likes"),
            "comments": p.get("comments"),
        })
    print(json.dumps({"posts": posts}))
except Exception as e:
    import traceback
    print(json.dumps({"posts": [], "error": str(e), "trace": traceback.format_exc()}))
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
        resolve(NextResponse.json({ posts: data.posts ?? [], error: data.error }))
      } catch {
        resolve(NextResponse.json({ posts: [], message: 'Could not parse LinkedIn response' }))
      }
    })
    proc.on('error', () => {
      resolve(NextResponse.json({ posts: [], message: 'Python runtime not available' }))
    })
  })
}
