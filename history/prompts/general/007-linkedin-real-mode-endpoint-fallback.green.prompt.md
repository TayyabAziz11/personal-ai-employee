---
id: 007
title: LinkedIn Real-Mode Endpoint Fallback
stage: green
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: gold-tier-linkedin-oauth
branch: 001-gold-tier-full
user: tayyab
command: fix linkedin real-mode fallback ugcPosts + shares
labels: ["bugfix","linkedin","oauth","fallback","ugcPosts","shares","gold","real-mode"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/linkedin_api_helper.py
  - src/personal_ai_employee/skills/gold/linkedin_watcher_skill.py
  - tests/test_linkedin_api_helper_fallback.py
tests:
  - tests/test_linkedin_api_helper_fallback.py (14 tests — all PASS)
---

## Prompt

We have real LinkedIn OIDC auth working, but real-mode watcher fails:
GET /v2/ugcPosts?q=author&author=urn:li:person:6A129M19xg&count=3 returns 404.

Implement robust LinkedIn real-mode support with:
A) get_person_id_v2_me() + refactored get_person_urn()
B) list_posts() with ugcPosts → shares fallback
C) create_post() ugcPosts → shares fallback
D) Update watcher to use list_posts()
E) Tests with mocked responses

## Response snapshot

**A) Person URN resolution:**
- Added `get_person_id_v2_me()`: calls GET /v2/me, extracts `id`, caches raw
  response + URN to `.secrets/linkedin_profile.json`
- Added `_cache_profile()` for atomic profile caching
- Refactored `get_person_urn()`: tries /v2/me first (method=v2_me), falls back
  to OIDC sub on 401/403 (method=oidc_sub) with explicit warning logged

**B) Read fallback (`list_posts`):**
- Added `_api_request_raw()`: authenticated request without raise_for_status,
  returns raw response so callers can check status_code for fallback decisions
- Added `_normalize_post()`: static method unifying ugcPosts + shares schemas
  into `{id, author_urn, text, created_ms, source_endpoint, _raw}`
- Added `list_posts()`: tries /v2/ugcPosts → /v2/shares on 404/403; logs
  endpoint used + status at each step

**C) Write fallback (`create_post`):**
- Updated `create_post()`: tries POST /v2/ugcPosts then POST /v2/shares on
  404/403; response includes `endpoint_used` field

**D) Watcher updated:**
- `_fetch_items_real()` now calls `helper.list_posts()` and reads normalized
  post fields (`text`, `created_ms`, `source_endpoint`) directly

**E) Tests (14/14 PASS):**
- v2_me 200 → numeric id returned + profile.json written
- v2_me 403 → None returned
- get_person_urn: v2_me 200 → urn:li:person:<id>
- get_person_urn: v2_me 403 → OIDC sub fallback + warning logged
- list_posts: ugcPosts 200 → normalized; ugcPosts 404 → shares 200; both fail → []

**Runtime evidence:**
- `--whoami`: person_urn=urn:li:person:6A129M19xg (method=oidc_sub, /v2/me=403)
- `--mode real`: /ugcPosts→404 (fallback triggered), /shares→403 (both fail,
  clear error: "Not enough permissions … ACCESS_DENIED")
  → Root cause confirmed: 'Share on LinkedIn' product not enabled in LinkedIn app

**Commit:** 2b3420d fix(gold): linkedin real-mode fallback (v2/me urn + shares fallback)

## Outcome

- ✅ Impact: Fallback chain fully functional; 404/403 are handled gracefully with clear diagnostics
- 🧪 Tests: 14/14 PASS (test_linkedin_api_helper_fallback.py)
- 📁 Files: linkedin_api_helper.py (+get_person_id_v2_me, +_cache_profile, refactored get_person_urn, +_api_request_raw, +_normalize_post, +list_posts, updated create_post), linkedin_watcher_skill.py (uses list_posts), tests/test_linkedin_api_helper_fallback.py (new, 14 tests)
- 🔁 Next prompts: Enable 'Share on LinkedIn' product in LinkedIn Developer Console to unblock real posts
- 🧠 Reflection: _api_request() using raise_for_status() is convenient for happy-path but blocks fallback logic. _api_request_raw() adds flexibility for callers that need to inspect status codes before deciding next step.

## Evaluation notes (flywheel)

- Failure modes observed: /ugcPosts 404, /shares 403 — both need LinkedIn app product enablement
- Graders run and results (PASS/FAIL): pytest tests/test_linkedin_api_helper_fallback.py — PASS (14/14)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Enable 'Share on LinkedIn' product in LinkedIn Developer Console and re-run real-mode watcher
