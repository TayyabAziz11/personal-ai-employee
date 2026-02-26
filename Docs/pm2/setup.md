# PM2 Setup & Operations Guide

Personal AI Employee process management — how to start, test, verify, and maintain all 4 PM2 services.

---

## Architecture Overview

```
ecosystem.config.js         ← Single source of truth for all PM2 processes
/home/tayyab/pm2_*.sh       ← Wrapper scripts (needed because repo path has spaces)
scripts/                    ← Python daemons and daily orchestration
Logs/                       ← All PM2 and Python log files
/tmp/*.ready                ← Health signal files written by each daemon
```

### Processes

| PM2 Name | Script | Purpose |
|----------|--------|---------|
| `wa-auto-reply` | `pm2_wa_reply.sh` → `scripts/wa_auto_reply.py` | WhatsApp auto-reply daemon (Playwright) |
| `agent-daemon` | `pm2_agent.sh` → `scripts/agent_daemon.py` | Watcher loop + Ralph orchestrator |
| `web-frontend` | `pm2_web.sh` → `apps/web` Next.js | Dashboard UI |
| `daily-cycle` | `pm2_daily_cycle.sh` → `scripts/daily_cycle.py` | Runs at 03:00 UTC, stops after completion |

---

## First-Time Setup

### 1. Start all processes

```bash
cd "/mnt/e/Certified Cloud Native Generative and Agentic AI Engineer/Q4 part 2/Q4 part 2/Hackathon-0/Personal AI Employee"

pm2 start ecosystem.config.js
pm2 save           # persist across reboots
pm2 status         # confirm all 4 appear
```

Expected output:
```
┌────┬──────────────────┬───────────┬──────────┬───────────┐
│ id │ name             │ uptime    │ restarts │ status    │
├────┼──────────────────┼───────────┼──────────┼───────────┤
│ 0  │ wa-auto-reply    │ 30s       │ 0        │ online    │
│ 1  │ agent-daemon     │ 30s       │ 0        │ online    │
│ 2  │ web-frontend     │ 30s       │ 0        │ online    │
│ 3  │ daily-cycle      │ 0         │ 0        │ stopped   │  ← correct, runs via cron
└────┴──────────────────┴───────────┴──────────┴───────────┘
```

> `daily-cycle` shows `stopped` — that is correct. It only runs once at 03:00 UTC and exits cleanly.

### 2. Set up log rotation (one-time, run once ever)

```bash
bash scripts/setup_pm2_logrotate.sh
```

This installs `pm2-logrotate` and configures:
- Max log file size: 10 MB
- Retention: 14 days
- Rotation: daily at midnight
- Compression: gzip

---

## Everyday Operations

### See all process status

```bash
pm2 status
```

### Tail logs

```bash
pm2 logs                       # all processes
pm2 logs agent-daemon          # specific process
pm2 logs wa-auto-reply --lines 50
pm2 logs web-frontend
```

### Restart a single process

```bash
pm2 restart agent-daemon
pm2 restart wa-auto-reply
pm2 restart web-frontend
```

### Reload after ecosystem.config.js changes

```bash
pm2 reload ecosystem.config.js
pm2 save
```

### Stop everything

```bash
pm2 stop ecosystem.config.js
```

### Delete and re-register all processes

```bash
pm2 delete ecosystem.config.js
pm2 start ecosystem.config.js
pm2 save
```

### Real-time monitoring (CPU/memory)

```bash
pm2 monit
```

---

## Health Verification

### 1. Check ready-file signals

Both Python daemons write `/tmp/*.ready` once they are fully initialised.

```bash
cat /tmp/agent_daemon.ready      # → "ready"
cat /tmp/wa_auto_reply.ready     # → "ready"  (appears only after WA browser connects)
```

If a file is missing, the daemon is still starting or has crashed. Check logs:
```bash
pm2 logs agent-daemon --lines 30
pm2 logs wa-auto-reply --lines 30
```

### 2. Test the system-status API

```bash
curl -s http://localhost:3000/api/system-status | python3 -m json.tool
```

Expected response:
```json
{
  "services": [
    { "name": "wa-auto-reply",  "status": "online", "uptime_seconds": 480, "restarts": 0, "memory_mb": 29 },
    { "name": "agent-daemon",   "status": "online", "uptime_seconds": 480, "restarts": 0, "memory_mb": 14 },
    { "name": "web-frontend",   "status": "online", "uptime_seconds": 480, "restarts": 0, "memory_mb": 52 },
    { "name": "daily-cycle",    "status": "stopped","uptime_seconds": 0,   "restarts": 0, "memory_mb": 0  }
  ]
}
```

If you get `{"services":[],"status":"unavailable"}`, PM2 is not running or `pm2 jlist` failed.

### 3. View dashboard status card

Open **http://localhost:3000/app** — the **PM2 Services** card at the bottom of the right column auto-refreshes every 10 seconds.

### 4. Check memory limits are applied

```bash
pm2 show wa-auto-reply | grep -i memory
pm2 show agent-daemon  | grep -i memory
pm2 show web-frontend  | grep -i memory
```

Look for `max memory restart: 500MB`. If a process exceeds 500 MB RAM, PM2 automatically restarts it.

---

## Daily Cycle (03:00 UTC Cron)

`daily-cycle` is triggered by PM2's `cron_restart` at 03:00 UTC. It runs three skills sequentially as subprocesses and exits.

### Manual trigger (for testing)

```bash
python3 scripts/daily_cycle.py
```

Or via PM2:
```bash
pm2 restart daily-cycle
```

### View daily cycle log

```bash
cat Logs/daily_cycle.log
# or tail live
tail -f Logs/daily_cycle.log
```

### What it runs

1. `scripts/brain_generate_weekly_ceo_briefing_skill.py`
2. `scripts/brain_generate_accounting_audit_skill.py`
3. `scripts/brain_ralph_loop_orchestrator_skill.py`

Each skill is run as a subprocess — no in-process imports, so failures are isolated.

---

## Log Files

All logs are in the `Logs/` directory:

| File | Contents |
|------|----------|
| `Logs/pm2_agent_out.log` | agent-daemon stdout |
| `Logs/pm2_agent_err.log` | agent-daemon stderr |
| `Logs/pm2_wa_reply_out.log` | wa-auto-reply stdout |
| `Logs/pm2_wa_reply_err.log` | wa-auto-reply stderr |
| `Logs/pm2_web_out.log` | web-frontend stdout |
| `Logs/pm2_web_err.log` | web-frontend stderr |
| `Logs/pm2_daily_cycle_out.log` | daily-cycle stdout |
| `Logs/pm2_daily_cycle_err.log` | daily-cycle stderr |
| `Logs/agent_daemon.log` | agent-daemon internal log |
| `Logs/daily_cycle.log` | daily_cycle.py internal log |
| `Logs/gmail_watcher.log` | Gmail watcher |
| `Logs/mcp_actions.log` | MCP action history |

---

## Troubleshooting

### wa-auto-reply keeps restarting

```bash
pm2 logs wa-auto-reply --lines 50
```
Common causes:
- WhatsApp QR not scanned → run `python3 scripts/wa_setup.py`
- Playwright browser not installed → run `playwright install chromium`
- `/tmp/wa_auto_reply.ready` missing → daemon crashed before connecting

### agent-daemon crashed

```bash
pm2 logs agent-daemon --lines 50
cat Logs/agent_daemon.log | tail -50
```

The daemon has an auto-restart wrapper — it will recover after 10 seconds. If it keeps crashing, check for a missing API key in `apps/web/.env.local`.

### API returns 404 for /api/system-status

The Next.js server is running a stale build. Rebuild and restart:

```bash
cd apps/web
npm run build
pm2 restart web-frontend
# wait ~10 seconds for server to boot
curl -s http://localhost:3000/api/system-status
```

### API returns `{"services":[],"status":"unavailable"}`

PM2 is not accessible. Check:
```bash
pm2 status          # if this fails, PM2 is not running
pm2 jlist           # raw JSON PM2 returns to the API
```

### Memory limit triggered

If `pm2 logs` shows `memory limit exceeded`, that's expected and healthy — PM2 auto-restarted the process. To raise or lower the limit, edit `ecosystem.config.js`:

```js
max_memory_restart: "500M",   // change as needed
```

Then: `pm2 reload ecosystem.config.js && pm2 save`

---

## Configuration Reference

**`ecosystem.config.js`** — all PM2 process settings

**`/home/tayyab/pm2_*.sh`** — wrapper scripts (outside repo because path has spaces)
- `pm2_wa_reply.sh` → wa-auto-reply
- `pm2_agent.sh` → agent-daemon
- `pm2_web.sh` → web-frontend
- `pm2_daily_cycle.sh` → daily-cycle

**`scripts/setup_pm2_logrotate.sh`** — one-time log rotation setup

**`scripts/daily_cycle.py`** — daily orchestration entry point

**`apps/web/src/app/api/system-status/route.ts`** — API route backing the dashboard card

**`apps/web/src/components/dashboard/system-status-card.tsx`** — dashboard PM2 status card
