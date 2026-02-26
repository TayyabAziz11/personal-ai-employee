import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

function getRepoRoot() {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  return path.resolve(process.cwd(), '..', '..')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let id: string
  try {
    const body = await req.json()
    id = body.id
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Filesystem-backed item (ID is the file path)
  if (!id.match(/^c[a-z0-9]{20,}$/)) {
    // Looks like a file path, not a CUID — try to delete the file
    const root = getRepoRoot()
    // Sanitize: strip leading fs: prefix if present
    const relativePath = id.startsWith('fs:') ? id.slice(3) : id
    const fullPath = path.resolve(root, relativePath)

    // Security: must stay within repo root
    if (!fullPath.startsWith(root)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
    } catch {
      // File already gone — still return success
    }

    // Also try to delete from DB in case there's a record with this ID
    await prisma.inboxItem.delete({ where: { id } }).catch(() => null)
    return NextResponse.json({ success: true })
  }

  // Normal CUID — delete from DB
  await prisma.inboxItem.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ success: true })
}
