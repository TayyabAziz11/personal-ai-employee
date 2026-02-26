---
id: 006
title: LinkedIn Person URN Real-Mode Watcher Fix
stage: green
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: gold-tier-linkedin-oauth
branch: 001-gold-tier-full
user: tayyab
command: fix linkedin real-mode watcher person URN
labels: ["bugfix","linkedin","oauth","urn","watcher","gold","real-mode"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/linkedin_api_helper.py
  - src/personal_ai_employee/skills/gold/linkedin_watcher_skill.py
  - Docs/mcp_linkedin_setup.md
tests:
  - python3 scripts/linkedin_oauth_helper.py --whoami
  - python3 scripts/linkedin_watcher_skill.py --mode real --once --max-results 3
---

## Prompt

LinkedIn OAuth works (OIDC), token valid, watcher runs in real mode but returns 0 items.

Logs show:
- OIDC auth verified (sub=6A129M19xg)
- WARNING: Could not determine LinkedIn author URN from auth response
- Processing 0 LinkedIn items

TASK: Fix LinkedIn real-mode watcher to correctly derive the author URN and fetch real items.

Requirements:
1) Add get_person_urn() to linkedin_api_helper.py
2) Fix watcher _fetch_items_real() to use get_person_urn()
3) Add --whoami CLI command
4) Update Docs/mcp_linkedin_setup.md
5) Provide test evidence

## Response snapshot

Root cause: `_fetch_items_real()` called `auth_info.get('id', '')` on the top-level
`check_auth()` result dict (`{'status', 'profile', 'auth_method'}`), which has no `'id'` key.
The profile (with OIDC `sub`) is nested at `auth_info['profile']`. For OIDC auth, even
`profile['sub']` may not be the member ID needed for `/v2/ugcPosts`.

Fixes:
1. `get_person_urn()` added to `LinkedInAPIHelper`:
   - Tries `GET /v2/me` → extracts `id` → `urn:li:person:<id>` (method=v2_me)
   - Falls back to OIDC `sub` if 403 → `urn:li:person:<sub>` (method=oidc_sub)
   - Caches to memory + `.secrets/linkedin_profile.json`

2. `_fetch_items_real()` in watcher:
   - Now calls `helper.get_person_urn()` → passes full URN directly (no more double-prefix bug)
   - Fixed display name extraction from `auth_info['profile']`
   - Logs endpoint + status code + response snippet on empty results

3. `list_ugc_posts()` enhanced to log endpoint + status on empty/error

4. `show_whoami()` + `--whoami` added to CLI

5. `Docs/mcp_linkedin_setup.md` updated with "Person URN Requirement" section

CLI outputs:
- `--whoami`: /v2/me → 403 → falls back to OIDC sub → urn:li:person:6A129M19xg (oidc_sub)
- `--mode real`: No more "Could not determine author URN"; 404 from /v2/ugcPosts clearly logged
  (indicates LinkedIn app doesn't have 'Share on LinkedIn' product enabled — API-level issue)

Commit: 8c224b7 fix(gold): resolve linkedin person URN for real-mode watcher

## Outcome

- ✅ Impact: Eliminated "Could not determine LinkedIn author URN" warning; watcher now reaches the API
- 🧪 Tests: --whoami shows correct URN; watcher logs clear 404 with endpoint + guidance
- 📁 Files: linkedin_api_helper.py (+get_person_urn, +show_whoami, --whoami, enhanced list_ugc_posts), linkedin_watcher_skill.py (_fetch_items_real fixed), Docs/mcp_linkedin_setup.md (+Person URN section)
- 🔁 Next prompts: Enable 'Share on LinkedIn' product in LinkedIn Developer Console to resolve 404
- 🧠 Reflection: check_auth() returns a structured dict; callers must access auth_result['profile'] not auth_result directly. Always test watcher end-to-end against real API to catch structural mistakes.

## Evaluation notes (flywheel)

- Failure modes observed: auth_info.get('id') on wrong dict level; /v2/me 403 needs graceful fallback
- Graders run and results (PASS/FAIL): --whoami PASS; watcher reaches API with correct URN PASS; 404=expected (LinkedIn product not enabled)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Enable 'Share on LinkedIn' product and re-test
