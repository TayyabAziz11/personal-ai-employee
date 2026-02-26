/**
 * LinkedIn Bridge — executes an approved WebPlan via the existing Python skills.
 *
 * Spawns: python3 scripts/web_execute_plan.py --json <json_payload>
 * Works in local dev only; Vercel execution is stubbed with a friendly message.
 */
import { spawn } from 'child_process'
import path from 'path'
import { prisma } from '@/lib/db'

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined

function getRepoRoot(): string {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT
  return path.resolve(process.cwd(), '..', '..')
}

export interface ExecutionResult {
  success: boolean
  stdout: string
  stderr: string
  message: string
}

export async function executeWebPlan(planId: string): Promise<ExecutionResult> {
  const plan = await prisma.webPlan.findUnique({ where: { id: planId } })
  if (!plan) {
    return { success: false, stdout: '', stderr: 'Plan not found', message: 'Plan not found' }
  }
  if (plan.status !== 'approved') {
    return { success: false, stdout: '', stderr: '', message: `Plan must be approved. Current status: ${plan.status}` }
  }

  // Create execution log entry
  const execLog = await prisma.executionLog2.create({
    data: { planId, status: 'running' },
  })

  if (IS_VERCEL) {
    const msg = 'Execution skipped — Python runtime not available on Vercel. Plan approved and stored in DB.'
    await Promise.all([
      prisma.executionLog2.update({
        where: { id: execLog.id },
        data: { status: 'success', result: { message: msg } },
      }),
      prisma.webPlan.update({
        where: { id: planId },
        data: { status: 'executed', updatedAt: new Date() },
      }),
    ])
    return { success: true, stdout: msg, stderr: '', message: msg }
  }

  // Local: spawn Python executor
  return new Promise((resolve) => {
    const root = getRepoRoot()
    const scriptPath = path.join(root, 'scripts', 'web_execute_plan.py')

    const jsonPayload = JSON.stringify({
      plan_id: plan.id,
      channel: plan.channel,
      action_type: plan.actionType,
      payload: plan.payload,
      title: plan.title,
      scheduled_at: plan.scheduledAt?.toISOString() ?? null,
    })

    const proc = spawn('python3', [scriptPath, '--json', jsonPayload], {
      cwd: root,
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    proc.on('close', async (code) => {
      const success = code === 0
      const dbStatus = success ? 'success' : 'failed'
      const planStatus = success ? 'executed' : 'failed'

      // Parse last JSON line from stdout as the result
      let result: Record<string, unknown> = {}
      try {
        const lines = stdout.trim().split('\n').filter(Boolean)
        const lastLine = lines[lines.length - 1]
        if (lastLine) result = JSON.parse(lastLine)
      } catch { /* ignore parse error */ }

      const message = success
        ? `Execution completed for ${plan.channel}/${plan.actionType}`
        : `Execution failed (exit ${code}): ${result.error ?? stderr.slice(0, 300)}`

      await Promise.all([
        prisma.executionLog2.update({
          where: { id: execLog.id },
          data: {
            status: dbStatus,
            stdout: stdout.slice(0, 10000),
            stderr: stderr.slice(0, 2000),
            result: { exit_code: code, message, ...result },
          },
        }),
        prisma.webPlan.update({
          where: { id: planId },
          data: { status: planStatus, updatedAt: new Date() },
        }),
      ])

      resolve({ success, stdout, stderr, message })
    })

    proc.on('error', async (err) => {
      const errMsg = err.message
      await Promise.all([
        prisma.executionLog2.update({
          where: { id: execLog.id },
          data: { status: 'failed', stderr: errMsg, result: { error: errMsg } },
        }),
        prisma.webPlan.update({
          where: { id: planId },
          data: { status: 'failed', updatedAt: new Date() },
        }),
      ])
      resolve({ success: false, stdout: '', stderr: errMsg, message: `Spawn error: ${errMsg}` })
    })
  })
}
