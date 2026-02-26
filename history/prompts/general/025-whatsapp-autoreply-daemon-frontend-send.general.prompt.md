---
id: "025"
title: "WhatsApp Auto-Reply Daemon + Frontend Quick Send"
stage: general
date: "2026-02-20"
surface: agent
model: claude-sonnet-4-6
feature: whatsapp-integration
branch: 001-gold-tier-full
user: tayyab
command: "continue from session summary"
labels: ["whatsapp", "auto-reply", "daemon", "frontend", "openai", "mutationobserver"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - scripts/wa_auto_reply.py
  - scripts/start_wa_reply.sh
  - scripts/stop_wa_reply.sh
  - start_all.sh
  - stop_all.sh
  - agent_status.sh
  - apps/web/src/app/api/whatsapp/send/route.ts
  - apps/web/src/app/app/command-center/[channel]/page.tsx
tests: []
---

## Prompt

and then also set it for frontend and make sure from frontend we also send msg if openai need then its in .env get from there and make it use if needed

(Prior session: complete rewrite of wa_auto_reply.py to use JavaScript MutationObserver for real-time new-message detection. Requested that daemon run as a 24/7 background service without terminal command.)

## Response

### Background service scripts (completing prior session work)

Created `start_wa_reply.sh` and `stop_wa_reply.sh` following the same pattern as `start_agent.sh`/`stop_agent.sh`:
- `start_wa_reply.sh`: Starts `wa_auto_reply.py` via `nohup`, writes PID to `Logs/wa_auto_reply.pid`, verifies process alive after 3s.  Supports `--fg` (foreground) and `--dry-run` flags.
- `stop_wa_reply.sh`: Sends SIGTERM, waits 15s for clean exit, force-kills if needed.

Updated `start_all.sh`: Now 1/3=Web, 2/3=Agent, 3/3=WA Auto-Reply.
Updated `stop_all.sh`: Now 1/3=WA Auto-Reply, 2/3=Agent, 3/3=Web.
Updated `agent_status.sh`: Added WA Auto-Reply section (PID, started-at, log path) + WA log tail command.

### Frontend WhatsApp Quick Send

**`/api/whatsapp/send` route** (new):
- `POST { to, message }` — spawns `python3 scripts/web_execute_plan.py --json <payload>` directly (no DB plan, no approval step)
- Returns `{ success, result }` or `{ success: false, error }`
- Uses `OPENAI_API_KEY` from `apps/web/.env` automatically via Next.js env loading

**WhatsApp channel workspace page** (`[channel]/page.tsx`):
- Added 6 state variables for compose panel: `waSendTo`, `waSendMsg`, `waSending`, `waSendResult`, `waGenerating`, `waGenTopic`
- Added `sendDirectWaMessage()` — calls `/api/whatsapp/send`, shows result banner, auto-refreshes inbox after 2s on success
- Added `generateWaMessage()` — calls `/api/ai/generate-content` with `channel: 'whatsapp'` (uses OpenAI key from .env)
- Chat item "Reply Plan" button → "Quick Reply" — clicking pre-fills `waSendTo` with the contact name
- Added compose panel below chat list:
  - **To** field (contact name or phone)
  - **Topic** field + "AI Write" button (generates message via OpenAI)
  - **Message** textarea (Ctrl+Enter to send)
  - Result banner (green/red)
  - **Send WhatsApp Message** button (disabled if session not paired)
  - Warning if session not paired

OpenAI key: already present in `apps/web/.env` as `OPENAI_API_KEY`. Next.js loads it automatically. Both the AI generate route and the new send route use `process.env.OPENAI_API_KEY` — no manual wiring needed.
