'use client'

import { useState } from 'react'
import { Play, Zap, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type RunStatus = 'idle' | 'running' | 'done' | 'error'

interface RunResult {
  runId?: string
  message?: string
  error?: string
  cloudMode?: boolean
}

export function RunControls() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dryRunStatus, setDryRunStatus] = useState<RunStatus>('idle')
  const [executeStatus, setExecuteStatus] = useState<RunStatus>('idle')
  const [result, setResult] = useState<RunResult | null>(null)

  async function triggerRun(mode: 'dry_run' | 'execute') {
    const setter = mode === 'dry_run' ? setDryRunStatus : setExecuteStatus
    setter('running')
    setResult(null)
    setConfirmOpen(false)

    try {
      const res = await fetch(`/api/run/daily-cycle?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: mode === 'execute' ? JSON.stringify({ confirm: true }) : JSON.stringify({}),
      })
      const data = await res.json()

      if (!res.ok) {
        setter('error')
        setResult({ error: data.error ?? 'Unknown error' })
      } else {
        setter('done')
        setResult(data)
      }
    } catch (err) {
      setter('error')
      setResult({ error: String(err) })
    }

    // Reset after 5s
    setTimeout(() => setter('idle'), 5000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {/* Dry-run button */}
        <Button
          variant="secondary"
          onClick={() => triggerRun('dry_run')}
          disabled={dryRunStatus === 'running' || executeStatus === 'running'}
          loading={dryRunStatus === 'running'}
          className="flex-1"
        >
          {dryRunStatus === 'done' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {dryRunStatus === 'running' ? 'Running...' : 'Dry-Run Cycle'}
        </Button>

        {/* Execute button */}
        <Button
          variant="default"
          onClick={() => setConfirmOpen(true)}
          disabled={executeStatus === 'running' || dryRunStatus === 'running'}
          loading={executeStatus === 'running'}
          className="flex-1"
        >
          {executeStatus === 'done' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {executeStatus === 'running' ? 'Executing...' : 'Execute Cycle'}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            result.error
              ? 'border-red-500/20 bg-red-500/5 text-red-400'
              : result.cloudMode
                ? 'border-amber-500/20 bg-amber-500/5 text-amber-400'
                : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
          }`}
        >
          {result.error ?? result.message ?? 'Done'}
          {result.runId && (
            <span className="ml-2 font-mono text-zinc-600">ID: {result.runId.slice(0, 8)}</span>
          )}
        </div>
      )}

      {/* Confirm execute modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Confirm Execute Mode
            </DialogTitle>
            <DialogDescription>
              Execute mode will run all agent scripts with{' '}
              <span className="font-medium text-zinc-200">real actions</span>. The orchestrator
              will respect approval gates. Dry-run mode is recommended for testing.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
            <p className="font-medium">Scripts that will run:</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-amber-400/80">
              <li>brain_mcp_registry_refresh_skill.py --mock</li>
              <li>linkedin_watcher_skill.py --mode mock</li>
              <li>odoo_watcher_skill.py --mode mock</li>
              <li>brain_generate_accounting_audit_skill.py</li>
              <li>brain_generate_weekly_ceo_briefing_skill.py</li>
              <li>brain_ralph_loop_orchestrator_skill.py --execute</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => triggerRun('execute')}>
              <Zap className="h-4 w-4" />
              Confirm Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
