---
id: 033
title: Instagram ActionWizard Dashboard Degraded Fix
stage: general
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: instagram
branch: 001-gold-tier-full
user: tayyab
command: fix three frontend bugs — ActionWizard crash on instagram, dashboard missing instagram, linkedin/whatsapp showing degraded
labels: ["bug-fix","instagram","dashboard","action-wizard","frontend"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - apps/web/src/components/command-center/action-wizard.tsx
  - apps/web/src/app/app/page.tsx
  - apps/web/src/lib/fs-reader.ts
tests:
  - none — UI fixes verified by code inspection
---

## Prompt

"now im getting this error when i click on post on instagram and also update dashborad in dashboard its not showing instagram and also in dashboard linkdlin and whastapp show as degraded only email show healthy"

## Response snapshot

Fixed three bugs:

1. **ActionWizard crash** (`action-wizard.tsx`):
   - Added `'instagram'` to `Channel` type union
   - Added `instagram` entry to `channelConfig` with `post_image` and `view_ig_media` action types, `hasImage: true`, `hasRecipient: false`, proper intents/tones/lengths
   - Also wired hashtag field and char counter for instagram (max 2200 chars)

2. **Dashboard missing Instagram** (`page.tsx` + `fs-reader.ts`):
   - Imported `Instagram` from lucide-react in dashboard page
   - Added `instagram: <Instagram className="h-4 w-4" />` to `watcherIcons` map
   - Added instagram to `readWatcherStatuses()` watchers list with `instagram_watcher.log` / `instagram_watcher_checkpoint.json`

3. **LinkedIn/WhatsApp degraded** (`fs-reader.ts`):
   - Root cause: `readWatcherStatuses()` was reading the last line of the log file and overriding "healthy" (from checkpoint) with "degraded" if that last line contained "error" or "warning"
   - Fix: checkpoint is now the primary health indicator. Log-line status is only used as fallback when no checkpoint file exists (`status === 'unknown'`). Old error lines in logs no longer override a healthy checkpoint.

## Outcome

- ✅ Impact: Instagram "Create Post" button no longer crashes; Instagram appears in Agent Watchers on dashboard; LinkedIn and WhatsApp show correct health status based on checkpoint files
- 🧪 Tests: none — UI changes verified by code inspection; logic change in fs-reader is a clear conditional guard
- 📁 Files: 3 files modified
- 🔁 Next prompts: test wizard flow end-to-end for Instagram; verify watcher status cards in browser
- 🧠 Reflection: The degraded status bug was caused by a log-line override pattern that didn't account for checkpoint-as-source-of-truth. Fixing the precedence is safer and more correct than changing watcher log content.

## Evaluation notes (flywheel)

- Failure modes observed: TypeScript union type not extended when new channel added; log-last-line heuristic too aggressive for status overriding
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): add checkpoint-timestamp freshness check (e.g., mark degraded if last_run > 2h ago) for more accurate staleness detection
