import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { spawn } from 'child_process'
import path from 'path'

interface ScriptResult {
  script: string
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
}

function getRepoRoot(): string {
  return process.env.REPO_ROOT || path.resolve(process.cwd(), '..', '..')
}

async function runScript(repoRoot: string, scriptName: string, args: string[]): Promise<ScriptResult> {
  const scriptPath = path.join(repoRoot, 'scripts', scriptName)
  const start = Date.now()

  return new Promise((resolve) => {
    const proc = spawn('python3', [scriptPath, ...args], {
      cwd: repoRoot,
      env: { ...process.env, PYTHONPATH: path.join(repoRoot, 'src') },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      resolve({
        script: scriptName,
        exitCode: code ?? 0,
        stdout: stdout.slice(0, 4000),
        stderr: stderr.slice(0, 2000),
        durationMs: Date.now() - start,
      })
    })

    proc.on('error', (err) => {
      resolve({
        script: scriptName,
        exitCode: 1,
        stdout: '',
        stderr: String(err),
        durationMs: Date.now() - start,
      })
    })

    // Safety timeout: 120s per script
    setTimeout(() => {
      proc.kill()
      resolve({
        script: scriptName,
        exitCode: -1,
        stdout,
        stderr: stderr + '\n[TIMEOUT: killed after 120s]',
        durationMs: Date.now() - start,
      })
    }, 120_000)
  })
}

function buildScriptList(mode: string): Array<{ script: string; args: string[] }> {
  const isExecute = mode === 'execute'
  return [
    { script: 'brain_mcp_registry_refresh_skill.py', args: ['--mock', '--once'] },
    { script: 'linkedin_watcher_skill.py', args: ['--mode', 'mock', '--once'] },
    { script: 'odoo_watcher_skill.py', args: ['--mode', 'mock', '--once'] },
    { script: 'brain_generate_accounting_audit_skill.py', args: ['--mode', 'mock'] },
    { script: 'brain_generate_weekly_ceo_briefing_skill.py', args: ['--mode', 'mock'] },
    {
      script: 'brain_ralph_loop_orchestrator_skill.py',
      args: isExecute ? ['--execute'] : ['--dry-run'],
    },
  ]
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mode = req.nextUrl.searchParams.get('mode') ?? 'dry_run'
  if (!['dry_run', 'execute'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  // Extra safety gate for execute mode
  if (mode === 'execute') {
    const body = await req.json().catch(() => ({}))
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: 'Execute mode requires { confirm: true } in body' },
        { status: 400 }
      )
    }
  }

  // Check if Python execution is available (disabled on Vercel / cloud)
  if (process.env.DISABLE_PYTHON_EXEC === 'true' || process.env.VERCEL) {
    return NextResponse.json({
      ok: false,
      mode,
      message: 'Python execution is disabled in cloud mode. Run locally with REPO_ROOT set.',
      cloudMode: true,
    })
  }

  // Create Run record
  const run = await prisma.run.create({
    data: { mode, status: 'running' },
  })

  // Fire-and-forget (respond immediately, run in background)
  void (async () => {
    const repoRoot = getRepoRoot()
    const scripts = buildScriptList(mode)
    const results: ScriptResult[] = []
    let hasError = false

    for (const { script, args } of scripts) {
      const result = await runScript(repoRoot, script, args)
      results.push(result)

      const level = result.exitCode === 0 ? 'success' : 'error'
      if (result.exitCode !== 0) hasError = true

      // Log each script result to DB
      await prisma.eventLog.create({
        data: {
          level,
          source: 'run',
          message: `[${mode}] ${script} exited ${result.exitCode} in ${result.durationMs}ms`,
          metadata: {
            exitCode: result.exitCode,
            durationMs: result.durationMs,
            stdoutSnippet: result.stdout.slice(0, 500),
          },
          runId: run.id,
        },
      })
    }

    const summary = results
      .map((r) => `${r.script}: exit ${r.exitCode} (${r.durationMs}ms)`)
      .join('\n')

    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: hasError ? 'failed' : 'completed',
        completedAt: new Date(),
        summary,
        scriptsRun: results.length,
        stdout: results.map((r) => `=== ${r.script} ===\n${r.stdout}`).join('\n'),
        stderr: results
          .filter((r) => r.stderr)
          .map((r) => `=== ${r.script} ===\n${r.stderr}`)
          .join('\n'),
      },
    })
  })()

  return NextResponse.json({
    ok: true,
    runId: run.id,
    mode,
    message: `Daily cycle started in ${mode} mode. Check /api/status for progress.`,
    scriptsQueued: buildScriptList(mode).length,
  })
}
