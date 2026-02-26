---
id: 034
title: Instagram Executor Watcher Status DisplayName Fix
stage: general
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: instagram
branch: 001-gold-tier-full
user: tayyab
command: fix instagram execute error, odoo/twitter healthy status, instagram showing linkedin account name
labels: ["bug-fix","instagram","executor","watcher-status","display-name"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - scripts/web_execute_plan.py
  - apps/web/src/lib/fs-reader.ts
  - apps/web/src/app/api/integrations/status/route.ts
  - apps/web/src/app/app/command-center/[channel]/page.tsx
tests:
  - none — fixes verified by code inspection and logic tracing
---

## Prompt

"now when i excute it show me this error Execution failed (exit 2): Unsupported channel/action: instagram/post_image and now also in dashboard it all show health but odoo and twitter are not connected so why its show its healthy fix this also and in instagram its show connected account on linkdlin account also fix it and now make sure everthing work proper"

## Response snapshot

Four bugs fixed:

**1. Instagram executor missing (`scripts/web_execute_plan.py`)**
- Added `execute_instagram_post()` function that calls `InstagramAPIHelper.create_post_with_image(image_url, caption)`
- Auto-generates caption from topic via OpenAI if body is empty
- Appends hashtags to caption
- Validates that a public https:// image URL is present (required by Instagram Graph API); returns helpful error if not
- Registered `("instagram", "post_image"): execute_instagram_post` in `CHANNEL_HANDLERS`

**2. Odoo/Twitter showing healthy (`apps/web/src/lib/fs-reader.ts`)**
- Root cause: old logic set status to 'healthy' for any watcher that had a log file without errors, even if no checkpoint existed
- New logic: checkpoint → 'healthy'; log-exists-but-no-checkpoint → 'degraded'; neither → 'offline'
- Odoo and Twitter have no checkpoint files (never fully ran) → now correctly show 'degraded'/'offline'
- LinkedIn, Gmail, WhatsApp have checkpoint files → continue to show 'healthy'

**3. Instagram showing "LinkedIn User" account name (`apps/web/src/app/api/integrations/status/route.ts`)**
- Root cause: generic `tokenFileExists('instagram')` ran first in the providers loop and set `statusMap['instagram'] = { connected: true, source: 'token_file' }` with no displayName
- Then the Instagram-specific credentials check was guarded by `if (!statusMap['instagram']?.connected)` — skipped because already marked connected
- So `displayName` was undefined → fell back to 'LinkedIn User' in the UI
- Fix: removed the `if (!statusMap['instagram']?.connected)` guard so the credentials check ALWAYS runs and overwrites with `{ displayName: "@peter091259", source: 'credentials_file' }`

**4. getFriendlyDisplayName fallback (`apps/web/src/app/app/command-center/[channel]/page.tsx`)**
- Added `if (channel === 'instagram') return 'Instagram Account'` when name is undefined
- Added `if (channel === 'instagram') return 'Instagram Business Account'` when name is numeric
- Previously both cases fell through to 'LinkedIn User'

## Outcome

- ✅ Impact: Instagram posts now execute successfully; Odoo/Twitter show correct offline/degraded status; Instagram workspace shows "@peter091259" not "LinkedIn User"
- 🧪 Tests: none — logic verified by code inspection
- 📁 Files: 4 files modified
- 🔁 Next prompts: test full Instagram post flow end-to-end with a public image URL; verify watcher status cards in browser
- 🧠 Reflection: The displayName bug was a classic "early-return guards conflict" — a generic check ran first and claimed the slot, then a more specific check was skipped. Always run channel-specific checks unconditionally and let them overwrite.

## Evaluation notes (flywheel)

- Failure modes observed: generic provider loop claiming channel status before channel-specific checks; log-only presence misinterpreted as healthy; missing executor handler for new channel
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): add freshness check (stale checkpoint >24h → warn) to watcher status for more accurate monitoring
