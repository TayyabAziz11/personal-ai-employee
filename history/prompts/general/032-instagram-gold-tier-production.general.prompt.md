---
id: "032"
title: Instagram Gold Tier Production Integration
stage: green
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: instagram-integration
branch: 001-gold-tier-full
user: tayyab
command: inline specification
labels: ["instagram","graph-api","gold-tier","watcher","executor","pm2","tests","docs","frontend"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/instagram_api_helper.py
  - src/personal_ai_employee/skills/gold/instagram_watcher_skill.py
  - src/personal_ai_employee/skills/gold/brain_execute_instagram_with_mcp_skill.py
  - scripts/instagram_watcher_skill.py
  - scripts/brain_execute_instagram_with_mcp_skill.py
  - scripts/instagram_oauth_helper.py
  - tests/test_instagram_helper.py
  - tests/test_instagram_mock_mode.py
  - Docs/mcp_instagram_setup.md
  - apps/web/src/app/app/command-center/page.tsx
  - ecosystem.config.js
  - scripts/agent_daemon.py
  - scripts/daily_cycle.py
  - /home/tayyab/pm2_instagram_watcher.sh
tests:
  - automated: python3 -m pytest tests/test_instagram_helper.py tests/test_instagram_mock_mode.py -v → 25 passed ✓
  - manual: python3 scripts/instagram_watcher_skill.py --mode mock --once → summary ok ✓
  - manual: python3 scripts/brain_execute_instagram_with_mcp_skill.py → DRY-RUN mode prints preview ✓
---

## Prompt

[Full Instagram + PM2 hardening specification provided by user in prior context window]

Key requirements:
- Instagram Graph API integration (token-based, dev mode, no webhooks)
- PM2 production hardening (health checks, memory guards, log rotation)
- Observability (system-status API, PM2 service dashboard)
- Daily cycle cron improvements with instagram watcher
- Frontend integration (Next.js command center + Instagram channel card)
- Tests (test_instagram_helper.py, test_instagram_mock_mode.py)
- Documentation (Docs/mcp_instagram_setup.md)

## Response snapshot

### Files created

**Core layer** (`src/personal_ai_employee/core/instagram_api_helper.py`):
- `InstagramAPIError`, `InstagramAuthError`, `InstagramPermissionError` hierarchy
- `InstagramAPIHelper` with lazy credential loading from `.secrets/instagram_credentials.json`
- `_request()` with exponential backoff on 429/5xx (3 retries, 1→2→4s)
- `check_auth()` → `{"valid": True, "user_id": ..., "name": ...}`
- `create_post_with_image(image_url, caption, *, dry_run)` — two-step Graph API (container → publish → permalink)
- `list_recent_media(limit, fields)` / `list_comments(media_id, limit)`
- CLI via `main()`: --status, --resolve, --whoami, --test-endpoints, --capabilities, --list-media

**Watcher skill** (`src/personal_ai_employee/skills/gold/instagram_watcher_skill.py`):
- `InstagramWatcher` class with `mock` and `real` modes
- Mock data: 2 media posts + 5 comments
- Per-cycle counter reset in `watch()` (bug found + fixed during testing)
- `_write_intake_wrapper()` creates YAML-fronted markdown in `Social/Inbox/`
- Checkpoint JSON at `Logs/instagram_watcher_checkpoint.json` (max 500 IDs)
- 5-min continuous mode + `--once` flag, `/tmp/instagram_watcher.ready` healthcheck file

**Executor skill** (`src/personal_ai_employee/skills/gold/brain_execute_instagram_with_mcp_skill.py`):
- `InstagramExecutor` with dry-run default, `--execute` required for real calls
- Parses `## Actions JSON` block or YAML front-matter from approved plans
- Operations: `create_post_image` (real), `create_post_text` (fails fast — IG doesn't support text-only)
- Validation: caption required, caption ≤ 2200 chars, image_url required for image ops
- Logs to `Logs/mcp_actions.log`, updates `Dashboard.md`, creates remediation tasks on failure

**Wrapper scripts** (all 1-line delegators):
- `scripts/instagram_watcher_skill.py`
- `scripts/brain_execute_instagram_with_mcp_skill.py`
- `scripts/instagram_oauth_helper.py`

**Tests** (25 total, all pass):
- `tests/test_instagram_helper.py` — 14 tests: credentials, check_auth, 3-request post flow, list endpoints
- `tests/test_instagram_mock_mode.py` — 11 tests: watcher mock mode, checkpoint, executor dry-run

**Docs**: `Docs/mcp_instagram_setup.md` — credentials setup, token exchange, run commands, PM2, limitations table

### Config updates

- `ecosystem.config.js` — added `instagram-watcher` process (200MB cap, autorestart=true)
- `scripts/agent_daemon.py` — added `instagram_watcher` interval task (every 10 min, --once mode)
- `scripts/daily_cycle.py` — added `instagram_watcher_skill.py` to daily skill list
- `apps/web/src/app/app/command-center/page.tsx`:
  - Added `Instagram` import from lucide-react
  - Added Instagram channel card (fuchsia theme, `live: true`)
  - Added `instagram` to token-file fallback in `getUserConnections`

### Bug fixed

`InstagramWatcher.watch()` didn't reset `created_count` / `skipped_count` / `errors` at the start
of each cycle. Added reset at line 290 of watcher skill. Test `test_watch_skips_already_processed`
caught this regression.

## Outcome

- ✅ 25 tests passing
- ✅ Mock mode watcher creates correct YAML-fronted intake wrappers
- ✅ Executor dry-run validates plans and previews actions without API calls
- ✅ Frontend command center shows Instagram as Live channel (fuchsia)
- ✅ PM2 ecosystem updated with instagram-watcher process
- ✅ Agent daemon polls every 10 min; daily cycle runs watcher at 03:00 UTC
- ✅ Setup guide covers token exchange, status check, real-mode switch

## Evaluation notes (flywheel)

- Failure modes tested: missing creds → InstagramAuthError; missing caption → validation fail; missing image_url → validation fail; text-only op → explicit fail-safe
- Graders: 25/25 PASS
- Prompt variant: large specification delivered over multiple prior context windows
- Next experiment: real mode integration test once Meta app credentials are available
