import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(process.cwd(), '..', '..')
const BRIEFINGS_DIR = path.join(REPO_ROOT, 'Business', 'Briefings')

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params

  // Safety: only allow .md files, no path traversal
  if (!filename.endsWith('.md') || filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const filePath = path.join(BRIEFINGS_DIR, filename)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  return NextResponse.json({ content, filename })
}
