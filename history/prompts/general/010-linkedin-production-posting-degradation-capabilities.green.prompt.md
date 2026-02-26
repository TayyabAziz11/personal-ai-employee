---
id: 010
title: LinkedIn Production Posting + Degradation + Capabilities
stage: green
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: gold-tier-linkedin-oauth
branch: 001-gold-tier-full
user: tayyab
command: feat linkedin production posting + graceful read degradation + capability diagnostics
labels: ["feat","linkedin","rest-posts-api","graceful-degradation","capabilities","gold","real-mode","production"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/linkedin_api_helper.py
  - src/personal_ai_employee/skills/gold/linkedin_watcher_skill.py
  - tests/test_linkedin_create_post_rest.py
  - tests/test_linkedin_watcher_degradation.py
  - tests/test_linkedin_capabilities.py
tests:
  - tests/test_linkedin_create_post_rest.py (13 tests — all PASS)
  - tests/test_linkedin_watcher_degradation.py (11 tests — all PASS)
  - tests/test_linkedin_capabilities.py (12 tests — all PASS)
  - Full suite: 68/68 PASS (32 prior + 36 new), 3 skipped, 1 pre-existing unrelated failure (Odoo --dry-run)
---

## Prompt

We have successfully authenticated with LinkedIn via OIDC.
Posting scope (w_member_social) is enabled and working.
Reading posts is failing due to LinkedIn restricted permissions (r_member_social not granted).

TASK A — FIX LINKEDIN POSTING (PRODUCTION GRADE):
- create_post() must use POST https://api.linkedin.com/rest/posts (NOT /v2/ugcPosts or /v2/shares)
- JSON body: REST Posts API schema (commentary, distribution, lifecycleState, isReshareDisabledByAuthor)
- Required headers: Authorization, Content-Type, LinkedIn-Version, X-Restli-Protocol-Version
- On success: return post URN from x-restli-id header OR response JSON; log to Logs/mcp_actions.log
- On failure: log clean error; never crash executor; return structured error (raise LinkedInAPIError)

TASK B — WATCHER REAL-MODE GRACEFUL DEGRADATION:
- When r_member_social not granted (403 from ugcPosts): log warning, create remediation file, return 0 items
- Log: "LinkedIn read permission (r_member_social) not granted. Watcher running in limited real mode."
- Remediation file: Needs_Action/remediation__linkedin_read_permission__YYYYMMDD-HHMM.md
- Content: r_member_social restricted, posting works, reading needs special approval

TASK C — CAPABILITY DIAGNOSTIC (--capabilities flag):
- Test: authenticated, can_post (w_member_social scope), can_read (GET /v2/ugcPosts probe)
- Output: Authenticated: YES | Can Post: YES | Can Read Posts: NO (r_member_social not granted)
- Must NOT crash

TASK D — TESTS: header injection, watcher degradation, capability output formatting.

ONE commit only.

## Response snapshot

**Task A — REST Posts API:**
- Added `REST_BASE = "https://api.linkedin.com/rest"` constant to `LinkedInAPIHelper`
- Added `base` keyword arg to `_api_request_raw()` for REST endpoint support (backward compat)
- Rewrote `create_post()`:
  - Payload uses REST Posts schema: `commentary`, `distribution`, `lifecycleState`, `isReshareDisabledByAuthor`
  - Calls `_api_request_raw('POST', '/posts', base=self.REST_BASE, json=payload)`
  - Extracts URN from `x-restli-id` response header; falls back to response body `id`
  - On success: logs to `Logs/mcp_actions.log` via `_log_post_action()`; returns dict with `id`, `author`, `endpoint_used='rest/posts'`
  - On failure: raises `LinkedInAPIError` (executor already catches this)
- Added `_log_post_action()`: writes JSON line to Logs/mcp_actions.log

**Task B — Watcher degradation:**
- Added `check_read_access()` to `LinkedInAPIHelper`:
  - Probes `GET /v2/ugcPosts` with count=1
  - Returns `{'available': False, 'status': 403, 'reason': '...'}` on permission denied
  - 200/404 → available=True; network error → available=False, status=-1
- Added `_create_read_permission_remediation()` to `LinkedInWatcher`:
  - File: `remediation__linkedin_read_permission__YYYYMMDD-HHMM.md`
  - Content explains: r_member_social restricted, posting unaffected, how to request access
- Modified `_fetch_items_real()`: after URN resolution, calls `check_read_access()`:
  - If `available=False` and `status=403` → logs warning, creates remediation, returns []
  - Otherwise: proceeds to `list_posts()` as before

**Task C — Capabilities:**
- Added `check_can_post()`: checks `w_member_social` in configured scopes + URN resolvable
- Added `show_capabilities()` function:
  ```
  ----------------------------------------
  LinkedIn Capabilities
  ----------------------------------------
  Authenticated: YES
  Can Post:      YES
  Can Read Posts: NO (r_member_social not granted ...)
  ----------------------------------------
  ```
- Added `--capabilities` to `main()` and argument parser

**Task D — Tests (36 new):**
- `test_linkedin_create_post_rest.py`: URL (/posts not /ugcPosts), headers (all 4 required), URN extraction (header → body fallback), failure cases (403/400 raise), payload schema validation
- `test_linkedin_watcher_degradation.py`: 0 items on 403, no crash, remediation filename/content, check_read_access() unit tests
- `test_linkedin_capabilities.py`: check_can_post() scope logic, show_capabilities() output format for all scenarios

**Commit:** 7e2f1ca feat(gold): production-grade linkedin posting + graceful read degradation + capability diagnostics

## Outcome

- ✅ Impact: Posting now uses the official LinkedIn REST Posts API; watcher degrades gracefully when r_member_social unavailable; --capabilities provides instant diagnostic output
- 🧪 Tests: 68/68 PASS (32 prior + 36 new), 3 skipped, 1 pre-existing unrelated failure (Odoo executor --dry-run flag)
- 📁 Files: linkedin_api_helper.py (REST_BASE, _api_request_raw base kwarg, create_post rewrite, _log_post_action, check_read_access, check_can_post, show_capabilities, --capabilities CLI), linkedin_watcher_skill.py (_create_read_permission_remediation, _fetch_items_real read-access check), 3 new test files
- 🔁 Next prompts: Can now test live posting end-to-end; `--capabilities` confirms Can Post: YES, Can Read Posts: NO; watcher exits cleanly in limited real mode
- 🧠 Reflection: LinkedIn's r_member_social is effectively gated behind the partner program; the graceful degradation pattern (check before fetch → specific remediation file → clean exit) is the right production approach rather than treating it as an error.

## Evaluation notes (flywheel)

- Failure modes observed: check_read_access() could double-call the API — mitigated by only calling it once before list_posts(); remediation file naming must match exact pattern for downstream tooling
- Graders run and results (PASS/FAIL): pytest — 68/68 PASS (excl. pre-existing Odoo failure)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run `python3 scripts/linkedin_oauth_helper.py --capabilities` to verify output in real environment; run `python3 scripts/linkedin_watcher_skill.py --mode real --once` to confirm clean exit + remediation file created
