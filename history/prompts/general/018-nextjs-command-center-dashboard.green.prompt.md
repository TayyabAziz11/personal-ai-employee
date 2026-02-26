---
id: "018"
title: "Next.js Command Center Dashboard"
stage: green
date: 2026-02-18
surface: agent
model: claude-sonnet-4-6
feature: web-dashboard
branch: 001-gold-tier-full
user: tayyab
command: "feat(web): add Next.js command center dashboard"
labels: ["nextjs","neon","prisma","nextauth","vercel","tailwind","dashboard","fullstack"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - apps/web/package.json
  - apps/web/tsconfig.json
  - apps/web/next.config.js
  - apps/web/tailwind.config.ts
  - apps/web/postcss.config.js
  - apps/web/.env.local.example
  - apps/web/.gitignore
  - apps/web/.eslintrc.json
  - apps/web/prisma/schema.prisma
  - apps/web/src/lib/utils.ts
  - apps/web/src/lib/db.ts
  - apps/web/src/lib/auth.ts
  - apps/web/src/lib/fs-reader.ts
  - apps/web/src/lib/sync.ts
  - apps/web/src/types/next-auth.d.ts
  - apps/web/src/middleware.ts
  - apps/web/src/app/globals.css
  - apps/web/src/app/layout.tsx
  - apps/web/src/app/page.tsx
  - apps/web/src/app/login/page.tsx
  - apps/web/src/app/app/layout.tsx
  - apps/web/src/app/app/page.tsx
  - apps/web/src/app/app/inbox/page.tsx
  - apps/web/src/app/app/plans/page.tsx
  - apps/web/src/app/app/logs/page.tsx
  - apps/web/src/app/app/settings/page.tsx
  - apps/web/src/app/api/auth/[...nextauth]/route.ts
  - apps/web/src/app/api/sync/route.ts
  - apps/web/src/app/api/run/daily-cycle/route.ts
  - apps/web/src/app/api/status/route.ts
  - apps/web/src/app/api/inbox/route.ts
  - apps/web/src/app/api/plans/route.ts
  - apps/web/src/app/api/logs/route.ts
  - apps/web/src/components/ui/button.tsx
  - apps/web/src/components/ui/card.tsx
  - apps/web/src/components/ui/badge.tsx
  - apps/web/src/components/ui/dialog.tsx
  - apps/web/src/components/ui/separator.tsx
  - apps/web/src/components/layout/sidebar.tsx
  - apps/web/src/components/layout/topbar.tsx
  - apps/web/src/components/dashboard/status-card.tsx
  - apps/web/src/components/dashboard/run-controls.tsx
  - apps/web/src/components/dashboard/timeline-feed.tsx
  - apps/web/src/components/dashboard/sync-button.tsx
  - Docs/web_dashboard_setup.md
tests:
  - "npx tsc --noEmit → 0 errors"
  - "npx next lint → 0 warnings or errors"
  - "DATABASE_URL=placeholder npx prisma validate → schema valid"
  - "npm install → 458 packages installed successfully"
---

## Prompt

Build a production-grade Next.js frontend + backend (API) with Neon Postgres, deployed on Vercel, as a "Command Center" for the Personal AI Employee system.

MANDATORY STACK: Next.js 14+ (App Router) + TypeScript, TailwindCSS + shadcn/ui + lucide-react, Neon Postgres via Prisma ORM, NextAuth GitHub OAuth, Vercel deployment.

FEATURES:
A) Public marketing site / — Hero, How It Works pipeline, Safety principles, CTA
B) Auth + App Shell — /login (GitHub), /app (protected), sidebar layout
C) Dashboard Command Center — watcher status cards, needs-action counts, inbox summary, event timeline, Run Daily Cycle (dry-run/execute) buttons
D) Pages — /app/inbox, /app/plans, /app/logs, /app/settings
E) Backend API — /api/sync (FS→DB), /api/run/daily-cycle (Python spawn), /api/status, /api/inbox, /api/plans, /api/logs

CONSTRAINTS: No paid services, separate from Python src/, UI futuristic dark theme with teal accent.

## Response snapshot

Implemented 47 files across apps/web/:

**Config:** package.json, tsconfig.json, next.config.js, tailwind.config.ts, postcss.config.js, .env.local.example, .gitignore, .eslintrc.json

**Prisma:** schema.prisma with NextAuth adapter tables (Account, Session, User, VerificationToken) + domain models (Connection, Run, EventLog, InboxItem, Plan)

**Core library:**
- utils.ts — cn(), formatRelativeTime(), redactPii(), statusColor(), levelColor()
- db.ts — Prisma singleton with global cache
- auth.ts — NextAuth v4 + PrismaAdapter + GitHub provider
- fs-reader.ts — reads Needs_Action, Plans, Logs/mcp_actions.log, watcher checkpoints
- sync.ts — FS→Postgres upsert pipeline

**API routes:** 7 routes (auth, sync, run, status, inbox, plans, logs)
**UI:** Button, Card, Badge, Dialog, Separator (shadcn-style); Sidebar, Topbar; StatusCard, RunControls (with confirm modal), TimelineFeed, SyncButton
**Pages:** marketing, login, dashboard, inbox, plans, logs, settings

**Design system:** #07070f bg, #14b8a6 teal accent, grid bg, glassmorphism cards, subtle glow effects

**Verification:** tsc --noEmit clean, next lint clean, prisma validate clean, 458 npm packages installed

**Commit:** fadefbd feat(web): add Next.js command center dashboard

## Outcome

- ✅ Impact: Full-stack web app scaffolded, TypeScript-strict, no compile errors, no lint warnings. Existing Python CLI workflows untouched. All free tier services.
- 🧪 Tests: TypeScript 0 errors, ESLint 0 warnings, Prisma schema valid, npm install successful
- 📁 Files: 47 new files across apps/web/ + Docs/web_dashboard_setup.md
- 🔁 Next prompts: Set up Neon DB, create GitHub OAuth app, run `db:push`, deploy to Vercel
- 🧠 Reflection: FS bridge pattern (read files → sync to Neon → serve from API) is clean; graceful degradation when DB/REPO_ROOT missing means it works in stages

## Evaluation notes (flywheel)

- Failure modes observed: none (0 TypeScript errors, 0 lint warnings)
- Graders run and results (PASS/FAIL): tsc PASS, eslint PASS, prisma validate PASS
- Prompt variant (if applicable): none
- Next experiment: add real-time WebSocket updates for run progress via Vercel Edge runtime
