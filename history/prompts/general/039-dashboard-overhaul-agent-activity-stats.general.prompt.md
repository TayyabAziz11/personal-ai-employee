---
id: "039"
title: Dashboard Overhaul Agent Activity Stats
stage: general
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 001-gold-tier-full
user: tayyab
command: "dashboard update with agent stats, brand icons, watcher health"
labels: ["dashboard","agent-activity","brand-colors","fs-reader","next.js","pm2"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - apps/web/src/lib/fs-reader.ts
  - apps/web/src/components/dashboard/status-card.tsx
  - apps/web/src/app/app/page.tsx
tests:
  - "npm run build — exit 0, all routes compile"
  - "pm2 restart 2 — web-frontend online"
  - "GET /api/system-status — 200 {services:[...]}"
  - "Agent stats simulation — total:29, linkedin:10, whatsapp:9, gmail:6, instagram:4"
---

## Prompt

"also just update the dashboard now its proper show how much work agent do like how much linkdlin post etc wahstapp all and also agents watchers working proper and also add the instagram logo etc because its not showing insta logo type there and also you can check for other things if you thing need to add then add them proper professionally"

## Response snapshot

Added `readAgentStats()` to `fs-reader.ts` which counts files in `Approved/` and `Rejected/` folders by channel (parsed from WEBPLAN filename format: `WEBPLAN_YYYYMMDDHHII_Channel_ActionType_desc.md`).

Rewrote `status-card.tsx` to accept `brand` and `actionCount` props with per-brand CSS classes:
- LinkedIn = `#0a66c2` (blue)
- Gmail = `red-500`
- WhatsApp = `emerald-500`
- Instagram = `pink-500`
- Twitter = `sky-500`
- Odoo = `amber-500`

Full rewrite of `apps/web/src/app/app/page.tsx` dashboard with:
1. **Agent Activity strip** — 6 channel cards showing real action counts from filesystem
2. **Lifetime Summary card** — total/approved/rejected with approval rate % and progress bar
3. **Brand-colored watcher cards** — each StatusCard now has brand color, glow, and actionCount badge
4. **Audit & Logs quick link** — card with ShieldCheck icon linking to `/app/logs`

Built with `npm run build` (exit 0) and restarted PM2 process 2.

Verified agent stats from filesystem: 29 total plans (LinkedIn: 10, WhatsApp: 9, Gmail: 6, Instagram: 4).

## Outcome

- ✅ Impact: Dashboard now shows real agent activity counts per channel with brand colors and Instagram icon
- 🧪 Tests: Build passes, PM2 online, system-status API 200, agent stats simulation matches filesystem
- 📁 Files: 3 files modified (fs-reader.ts, status-card.tsx, page.tsx)
- 🔁 Next prompts: PHR for this session; start agents if needed
- 🧠 Reflection: `readAgentStats()` is pure filesystem — zero DB dependency, works offline

## Evaluation notes (flywheel)

- Failure modes observed: None — build clean, restart clean
- Graders run and results (PASS/FAIL): Build PASS, API smoke test PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add real-time polling via `/api/agent-stats` route if counts need live updates without page refresh
