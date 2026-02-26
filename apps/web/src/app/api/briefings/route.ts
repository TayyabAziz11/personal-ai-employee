import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(process.cwd(), '..', '..')
const BRIEFINGS_DIR = path.join(REPO_ROOT, 'Business', 'Briefings')

export async function GET() {
  try {
    if (!fs.existsSync(BRIEFINGS_DIR)) {
      return NextResponse.json({ briefings: [] })
    }

    const files = fs.readdirSync(BRIEFINGS_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .reverse()

    const briefings = files.map((filename) => {
      const filePath = path.join(BRIEFINGS_DIR, filename)
      const content = fs.readFileSync(filePath, 'utf-8')

      // Extract metadata from first few lines
      const lines = content.split('\n')
      const title = lines.find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '').trim() ?? filename
      const periodLine = lines.find((l) => l.startsWith('**Period:**'))
      const generatedLine = lines.find((l) => l.startsWith('**Generated:**'))
      const modeLine = lines.find((l) => l.startsWith('**Mode:**'))

      const period = periodLine?.replace('**Period:**', '').trim() ?? ''
      const generated = generatedLine?.replace('**Generated:**', '').trim() ?? ''
      const mode = modeLine?.replace('**Mode:**', '').trim() ?? ''

      // Week number from filename e.g. CEO_Briefing__2026-W08.md
      const weekMatch = filename.match(/(\d{4}-W\d{2})/)
      const week = weekMatch?.[1] ?? ''

      return {
        filename,
        title,
        week,
        period,
        generated,
        mode,
        size: content.length,
      }
    })

    return NextResponse.json({ briefings })
  } catch (err) {
    return NextResponse.json({ error: String(err), briefings: [] }, { status: 500 })
  }
}
