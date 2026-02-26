---
id: "027"
title: PM2 Observability & Reliability Upgrade
stage: green
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 001-gold-tier-full
user: tayyab
command: implement plan
labels: ["pm2","observability","reliability","ready-file","memory-ceiling","log-rotation","daily-cycle","system-status"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - scripts/wa_auto_reply.py
  - scripts/agent_daemon.py
  - ecosystem.config.js
  - /home/tayyab/pm2_daily_cycle.sh
  - scripts/setup_pm2_logrotate.sh
  - scripts/daily_cycle.py
  - apps/web/src/app/api/system-status/route.ts
  - apps/web/src/components/dashboard/system-status-card.tsx
  - apps/web/src/app/app/page.tsx
tests:
  - npx tsc --noEmit (exit 0, zero errors)
---

## Prompt

Implement the following plan:

# Plan: PM2 Observability & Reliability Upgrade

## Context
The PM2 infrastructure is running but lacks operational visibility and reliability guards. This adds:
1. Ready-file health signals for Python daemons
2. Memory ceiling (500M) on all PM2 processes
3. Log rotation setup script
4. Daily orchestration cron process
5. System status card in the Next.js dashboard

Nothing touches business logic, WhatsApp browser, MCP, Neon/Prisma, or auth.

[Full plan with 9 implementation steps covering ready-file signals, ecosystem.config.js updates, new scripts, API route, and SystemStatusCard component.]

## Response snapshot

Implemented all 9 plan items:

1. **`scripts/wa_auto_reply.py`** — added `import atexit`, `READY_FILE = Path("/tmp/wa_auto_reply.ready")`, `atexit.register(...)`, `print("SERVICE_READY")` + `READY_FILE.write_text("ready")` after LIVE banner, `READY_FILE.unlink(missing_ok=True)` in cleanup.

2. **`scripts/agent_daemon.py`** — same pattern: `import atexit`, `READY_FILE = Path("/tmp/agent_daemon.ready")`, `atexit.register(...)`, `print("SERVICE_READY")` + write after Tasks log, `READY_FILE.unlink(missing_ok=True)` in finally block.

3. **`ecosystem.config.js`** — added `max_memory_restart: "500M"` to all 3 existing apps; added new `daily-cycle` app with `cron_restart: "0 3 * * *"`, `autorestart: false`, `max_memory_restart: "200M"`.

4. **`/home/tayyab/pm2_daily_cycle.sh`** — new wrapper script (outside repo, matches pm2_*.sh pattern), chmod +x.

5. **`scripts/setup_pm2_logrotate.sh`** — new manual-run script: installs pm2-logrotate, sets 10M max, 14-day retain, compress, daily rotation. chmod +x.

6. **`scripts/daily_cycle.py`** — new orchestration script; runs 3 skills as subprocesses (ceo briefing, accounting audit, ralph orchestrator); logs to `Logs/daily_cycle.log`; prints `DAILY_CYCLE_STARTED` / `DAILY_CYCLE_COMPLETED`.

7. **`apps/web/src/app/api/system-status/route.ts`** — new API route: runs `pm2 jlist`, parses JSON, returns services array with name/status/uptime_seconds/restarts/memory_mb. Full try/catch → returns `{services:[], status:"unavailable"}` on failure.

8. **`apps/web/src/components/dashboard/system-status-card.tsx`** — new `'use client'` component; auto-polls `/api/system-status` every 10s; displays table with colored status dots, uptime, restarts, memory; graceful "Status unavailable" fallback.

9. **`apps/web/src/app/app/page.tsx`** — imported `SystemStatusCard`, added `<SystemStatusCard />` below Event Timeline in right column.

TypeScript check: `npx tsc --noEmit` → exit 0, zero errors.

## Outcome

- ✅ Impact: PM2 processes now have 500M memory ceilings, ready-file health signals for both Python daemons, daily orchestration cron at 03:00 UTC, log rotation setup script, and a live-updating PM2 status card on the dashboard
- 🧪 Tests: TypeScript type-check passes (exit 0, zero errors)
- 📁 Files: 9 files created/modified (3 modified, 6 new)
- 🔁 Next prompts: Run `pm2 reload ecosystem.config.js && pm2 save`; manually run `bash scripts/setup_pm2_logrotate.sh` once; verify `cat /tmp/agent_daemon.ready` shows "ready"
- 🧠 Reflection: All changes are additive/non-breaking. atexit covers abnormal exits; explicit unlink in cleanup covers clean exits. No business logic, MCP, WhatsApp browser, or auth touched.

## Evaluation notes (flywheel)

- Failure modes observed: none — clean tsc pass, all edits precise
- Graders run and results (PASS/FAIL): tsc --noEmit PASS
- Prompt variant (if applicable): plan-driven implementation
- Next experiment: verify ready-file signals with `cat /tmp/wa_auto_reply.ready` after next WA connect
