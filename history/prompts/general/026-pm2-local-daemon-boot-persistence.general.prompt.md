---
id: 026
title: PM2 Local Daemon Boot Persistence
stage: general
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 001-gold-tier-full
user: tayyab
command: "pm2 setup for wa_auto_reply, agent_daemon, web frontend"
labels: ["pm2","systemd","wsl2","whatsapp","daemon","boot-persistence"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - ecosystem.config.js
  - /home/tayyab/pm2_wa_reply.sh
  - /home/tayyab/pm2_agent.sh
  - /home/tayyab/pm2_web.sh
  - scripts/wa_auto_reply.py
tests:
  - pm2 status — all 3 processes online, counters stable for 60s
---

## Prompt

Run whatsapp (wa_auto_reply.py), agent daemon, and Next.js web frontend with PM2 locally so they:
- Start automatically on laptop boot (WSL2 Ubuntu with systemd)
- Auto-restart on crash
- Run without a terminal window open
- No Oracle Cloud — local only for now

## Response snapshot

1. Installed PM2 globally via npm.
2. Ran `pm2 startup systemd` with explicit PATH including `/usr/bin` so systemctl was accessible in sudo context.
3. Created `ecosystem.config.js` with 3 apps (wa-auto-reply, agent-daemon, web-frontend).
4. Hit path-with-spaces bug: repo is on NTFS `/mnt/e/Certified Cloud Native...` — PM2 splits interpreter args on spaces, Python receives `/usr/bin/bash` binary as source → `SyntaxError: Non-UTF-8 code starting with \x82`.
5. Fix: created wrapper scripts at `/home/tayyab/` (no spaces):
   - `pm2_wa_reply.sh` — cd into repo, exec python3 scripts/wa_auto_reply.py
   - `pm2_agent.sh` — cd into repo, exec python3 scripts/agent_daemon.py
   - `pm2_web.sh` — cd into apps/web, fuser -k 3000, exec npm run start
6. Updated `ecosystem.config.js` to `interpreter: 'bash'` pointing to wrappers.
7. Hit second bug: `next start` fails with `EADDRINUSE :3000` on PM2 restart (port still held by dying process). Fixed by adding `fuser -k 3000/tcp` in wrapper with 1s sleep.
8. Hit third bug: `next start` failed with "No .next directory" — production build missing. Ran `npm run build` (success, 38 static pages). Added auto-build guard in `pm2_web.sh`.
9. Hit fourth bug: `wa_auto_reply.py` crashed on `page.evaluate(f"...('{SIGNATURE}')")` — `SIGNATURE = "— Tayyab's AI Employee"` has an apostrophe that breaks the JS single-quoted string. Fixed: `json.dumps(SIGNATURE)` produces a safely-escaped double-quoted JS string.
10. All 3 processes stable: `pm2 save` → boot persistence enabled.

## Outcome

- ✅ Impact: All 3 services (WA auto-reply, agent daemon, Next.js) run under PM2 with systemd boot persistence on WSL2 Ubuntu. No terminal window needed.
- 🧪 Tests: `pm2 status` showed all 3 `online` with frozen restart counters after 60s observation.
- 📁 Files: ecosystem.config.js, /home/tayyab/pm2_*.sh, scripts/wa_auto_reply.py (apostrophe fix)
- 🔁 Next prompts: Oracle Cloud deployment (deferred), WhatsApp session QR re-auth flow
- 🧠 Reflection: NTFS mounts with spaces in path are a known PM2 footgun — wrapper scripts in /home/ are the clean fix. Always json.dumps() when interpolating Python strings into JS evaluate() calls.

## Evaluation notes (flywheel)

- Failure modes observed: (1) spaces-in-path NTFS bug, (2) EADDRINUSE race on restart, (3) missing .next build, (4) apostrophe in JS string literal
- Graders run and results (PASS/FAIL): pm2 status 60s stability check — PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add `pm2 reset wa-auto-reply` on boot to clear stale restart counters
