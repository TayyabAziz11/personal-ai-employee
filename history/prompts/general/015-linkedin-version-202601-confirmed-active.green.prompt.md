---
id: 015
title: LinkedIn API Version 202601 Confirmed Active
stage: green
date: 2026-02-18
surface: agent
model: claude-sonnet-4-5-20250929
feature: gold-tier-linkedin-oauth
branch: 001-gold-tier-full
user: tayyab
command: fix persistent HTTP 426 NONEXISTENT_VERSION after stale pyc fix — binary search confirmed 202601 is an active LinkedIn API version
labels: ["fix","linkedin","api_version","202601","http-426","version-discovery","live-post","real-mode","gold"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/linkedin_api_helper.py
tests:
  - tests/test_linkedin_oidc_author_urn.py (23 tests — all PASS)
  - Full suite: 120/120 PASS, 3 skipped, 1 pre-existing unrelated failure (Odoo --dry-run)
---

## Prompt

still getting this error: POST rest/posts → HTTP 426: {"status":426,"code":"NONEXISTENT_VERSION","message":"Requested version 20250201 is not active"} (second occurrence after previous pyc fix)

## Response snapshot

**Diagnosis chain:**
1. Cleared stale .pyc and changed DEFAULT from "202502" → "202501"
2. Tested with "202501" → LinkedIn returned "Requested version 20250101 is not active"
   (LinkedIn appends "01" day when displaying YYYYMM versions in error messages)
3. Binary search across versions: tested 202601, 202512, 202511... in order
4. First hit: "202601" (January 2026) → HTTP 201 OK ✅

**Root cause of 20250201 error:**
- Stale `__pycache__/linkedin_api_helper.cpython-310.pyc` was from an older code version
  where DEFAULT_LINKEDIN_VERSION was "20250201" (8-digit YYYYMMDD format, not YYYYMM)
- NTFS/WSL mtime resolution caused Python to use the stale .pyc even after source edits
- Neither "202501" nor "202502" are active LinkedIn API versions (LinkedIn releases versions
  periodically — not every YYYYMM is a released version)

**Key insight — LinkedIn version lifecycle:**
- LinkedIn releases API versions periodically (not every month)
- They append "01" day when reporting version errors: send "202501" → error shows "20250101"
- Active versions in February 2026: 202601 (January 2026) confirmed ✅
- 202501 (Jan 2025) and 202502 (Feb 2025) are NOT active (expired or never released)

**Fix:** DEFAULT_LINKEDIN_VERSION = "202601"

**Live confirmation:**
- POST /rest/posts with LinkedIn-Version: 202601 → HTTP 201
- Post URN: urn:li:share:7429758646932365312
- Author: urn:li:person:6A129M19xg
- Endpoint: rest/posts

**Commit:** 35325b5 fix(linkedin): set DEFAULT_LINKEDIN_VERSION to 202601 — confirmed active LinkedIn API version

## Outcome

- ✅ Impact: LinkedIn posting now works end-to-end — HTTP 201, post URN urn:li:share:7429758646932365312 created live
- 🧪 Tests: 120/120 PASS, 3 skipped, 1 pre-existing unrelated failure (Odoo --dry-run)
- 📁 Files: linkedin_api_helper.py (DEFAULT_LINKEDIN_VERSION: "202601")
- 🔁 Next prompts: Verify post appeared on LinkedIn profile; run --capabilities to confirm; watcher can now also post
- 🧠 Reflection: LinkedIn does not release API versions for every YYYYMM — only specific months. A binary search was needed to find a currently active version. The pattern: LinkedIn converts YYYYMM to YYYYMM01 internally (appending "01" day). Always test the version against the live API before releasing; the stale .pyc on NTFS/WSL was a compounding factor that masked the real issue.

## Evaluation notes (flywheel)

- Failure modes observed: (1) Stale .pyc on NTFS/WSL masked the "202502→20250201" version bug; (2) LinkedIn only activates specific YYYYMM versions — not every month; need to binary search or use LinkedIn's versioning docs; (3) "202501" and "202502" both expired/never-released as of Feb 2026
- Graders run and results (PASS/FAIL): pytest — 120/120 PASS (excl. pre-existing Odoo failure)
- Prompt variant (if applicable): PHR 015 = follow-up from PHR 014, same bug chain
- Next experiment (smallest change to try): Run --post-test "Hello" again (should ✅ Posted! every time), then run watcher to confirm scheduled posts also work
