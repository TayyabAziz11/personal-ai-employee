---
id: "020"
title: "Command Center Plans Approval Execute"
stage: green
date: "2026-02-19"
surface: agent
model: claude-sonnet-4-6
feature: command-center
branch: 001-gold-tier-full
user: tayyab
command: "implement command center + plans lifecycle"
labels: ["command-center", "plans", "approval", "linkedin", "gmail", "wizard", "prisma", "api"]
links:
  spec: "null"
  ticket: "null"
  adr: "null"
  pr: "null"
files_created:
  - apps/web/prisma/schema.prisma (updated — UserConnection, WebPlan, ExecutionLog2)
  - apps/web/src/lib/plan-storage.ts
  - apps/web/src/lib/linkedin-bridge.ts
  - apps/web/src/app/app/command-center/page.tsx
  - apps/web/src/app/app/command-center/[channel]/page.tsx
  - apps/web/src/components/command-center/action-wizard.tsx
  - apps/web/src/components/plans/pending-plans.tsx
  - apps/web/src/app/api/plans/create/route.ts
  - apps/web/src/app/api/plans/[id]/approve/route.ts
  - apps/web/src/app/api/plans/[id]/reject/route.ts
  - apps/web/src/app/api/plans/[id]/execute/route.ts
  - apps/web/src/app/api/integrations/status/route.ts
  - apps/web/src/app/api/integrations/linkedin/connect/route.ts
  - apps/web/src/app/api/linkedin/recent/route.ts
  - scripts/web_execute_plan.py
files_modified:
  - apps/web/src/app/page.tsx (homepage dual auth CTAs)
  - apps/web/src/app/login/page.tsx (?mode=email query param)
  - apps/web/src/components/layout/sidebar.tsx (Command Center nav)
  - apps/web/src/app/app/page.tsx (Plans inbox + Live Activity)
  - apps/web/next.config.js (serverExternalPackages fix)
  - apps/web/.env.local (created)
  - apps/web/.env (created for Prisma CLI)
tests_run:
  - npx tsc --noEmit (0 errors)
  - npx prisma db push (tables created successfully)
---

## Prompt

We have /apps/web Next.js (App Router) running with Neon Postgres + Prisma + NextAuth.
Email/password login works and GitHub OAuth works. UI is futuristic and good.

NEW REQUIREMENTS:
A) Homepage sign-in - show BOTH auth options clearly
B) Command Center (core feature) - integration cards for LinkedIn/Gmail/WhatsApp/Twitter
C) Channel workspace UX - multi-step wizard (5 steps: action→content→image→schedule→review)
D) Safety & Architecture - Plan→Approval→Action→Logging preserved
E) Database - IntegrationConnection, WebPlan, ExecutionLog models
F) Backend API routes - plans CRUD lifecycle + integrations status
G) UI Requirements - futuristic agentic vibe, Plans inbox in dashboard, Live Activity panel
H) Must not break deployment - dual-mode (local FS writes + Vercel DB-only)

[Full detailed requirements as provided in prompt]

## Response

Implemented full Command Center feature set:

### Schema (Prisma)
- Added `UserConnection` model (per-user OAuth status, no secrets stored)
- Added `WebPlan` model (userId, channel, actionType, payload JSON, status enum, scheduledAt)
- Added `ExecutionLog2` model (planId, status, stdout/stderr, result JSON)
- All nullable additions — backward compatible; `db push` succeeded

### Homepage + Login
- Homepage: dual CTAs — "Continue with GitHub" + "Continue with Email" (→ /login?mode=email)
- Login: reads `?mode=email` query param to auto-select email tab on load

### Sidebar
- Added "Command Center" nav item (Cpu icon) between Dashboard and Inbox
- `exact: true` on Dashboard prevents over-matching

### Lib Files
- `plan-storage.ts`: dual-mode plan storage (local: writes markdown to Pending_Approval/; Vercel: DB only)
- `linkedin-bridge.ts`: executes WebPlan via Python subprocess; creates ExecutionLog2 records
- `renderPlanMarkdown()`: generates human-readable markdown plan files

### Command Center UI
- `/app/command-center`: 4 integration cards (LinkedIn, Gmail live; WhatsApp, Twitter stubbed)
- Card shows: status, plan stats (pending/executed/failed), actions list, Connected/Not Connected badge
- `/app/command-center/[channel]`: channel workspace with left panel (overview + action buttons) + right panel (wizard OR content)

### Action Wizard (5-step)
1. Action type selection + Intent (e.g. Announcement, Educational, Story, Hiring)
2. Content inputs (topic, body, tone, length, hashtags, CTA; Gmail: recipient, subject)
3. Image options (none / AI generate with style+subject+vibe / upload URL)
4. Scheduling (now / later with datetime-local + timezone display)
5. Review (preview card + metadata grid + approval warning + "Create Plan" button)

### API Routes
- `POST /api/plans/create` — creates WebPlan in DB + writes markdown to Pending_Approval/
- `POST /api/plans/[id]/approve` — marks approved + moves file to Approved/
- `POST /api/plans/[id]/reject` — marks rejected + moves file to Rejected/
- `POST /api/plans/[id]/execute` — calls Python executor via linkedin-bridge; fire-and-forget with 5s sync window
- `GET /api/integrations/status` — returns connected status per provider (DB + token file fallback)
- `POST /api/integrations/linkedin/connect` — reads .secrets/linkedin_token.json, upserts UserConnection (no token stored in DB)
- `GET /api/linkedin/recent` — reads from checkpoint JSON, falls back to Python helper

### Python Executor
- `scripts/web_execute_plan.py` — routes (channel, action_type) to appropriate Python helper
- LinkedIn: calls LinkedInAPIHelper.create_text_post() or create_image_post()
- Gmail: calls gmail_helper.create_draft() or send_email()
- Graceful fallback: if helper not available, logs as dry-run

### Dashboard Updates
- Plans inbox section: Pending Approval (approve/reject), Approved (execute/reject), Recent history
- Live Activity panel reading system_log.md (redacted)
- If no plans yet: shows "Open Command Center" prompt

### Safety Architecture Preserved
- Wizard → Plan created with status=pending_approval
- No execution without explicit approve → execute
- File-based audit trail in Pending_Approval/ → Approved/ → execution
- All actions logged to ExecutionLog2 in DB
- IS_VERCEL check prevents filesystem operations in cloud deployment

### TypeScript
- 0 errors after `npx tsc --noEmit`
