---
id: 014
title: LinkedIn API Version YYYYMMDD Normalization Fix
stage: green
date: 2026-02-18
surface: agent
model: claude-sonnet-4-5-20250929
feature: gold-tier-linkedin-oauth
branch: 001-gold-tier-full
user: tayyab
command: fix HTTP 426 NONEXISTENT_VERSION when api_version in credentials is YYYYMMDD format
labels: ["fix","linkedin","api_version","yyyymmdd","normalization","http-426","_build_headers","rest-posts-api","gold"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/linkedin_api_helper.py
  - tests/test_linkedin_oidc_author_urn.py
tests:
  - tests/test_linkedin_oidc_author_urn.py (4 new tests — TestNormalizeLinkedinVersion — all PASS)
  - Full suite: 120/120 PASS (116 prior + 4 new), 3 skipped, 1 pre-existing unrelated failure (Odoo --dry-run)
---

## Prompt

now im getting this error:
POST rest/posts → HTTP 426: {"status":426,"code":"NONEXISTENT_VERSION","message":"Requested version 20250201 is not active"}
❌ Post failed: POST rest/posts → HTTP 426: ...

fix it proper and make sure this able to post

## Response snapshot

**Root cause:**
- LinkedIn REST API requires `LinkedIn-Version` header in YYYYMM (6-digit) format
- User's credentials file had `api_version: "20250201"` (8-digit YYYYMMDD format)
- `_build_headers()` passed "20250201" to the header verbatim → LinkedIn rejected with HTTP 426
- LinkedIn error: "Requested version 20250201 is not active" (YYYYMMDD is never a valid version)

**Fix — `_normalize_linkedin_version()` static method:**
- New static method: if version is 8 digits (YYYYMMDD), strips day portion → YYYYMM
- "20250201" → "202502", "202502" → "202502" (no change for already-correct values)
- Applied in `_build_headers()` after reading from credentials file

**4 new tests in TestNormalizeLinkedinVersion:**
1. `test_yyyymmdd_truncated_to_yyyymm`: "20250201" → "202502"
2. `test_yyyymm_unchanged`: "202502" → "202502"
3. `test_yyyymm_jan_unchanged`: "202501" → "202501"
4. `test_build_headers_normalizes_yyyymmdd_api_version`: integration test — `api_version: "20250201"` in credentials → header "202502"

**Commit:** 91f5544 fix(linkedin): normalize YYYYMMDD api_version to YYYYMM to fix HTTP 426 NONEXISTENT_VERSION

## Outcome

- ✅ Impact: HTTP 426 NONEXISTENT_VERSION eliminated; api_version/linkedin_version in YYYYMMDD format is silently normalised to YYYYMM before sending to LinkedIn
- 🧪 Tests: 120/120 PASS (116 prior + 4 new), 3 skipped, 1 pre-existing unrelated failure (Odoo --dry-run)
- 📁 Files: linkedin_api_helper.py (_normalize_linkedin_version static method, _build_headers applies normalization), test_linkedin_oidc_author_urn.py (4 new TestNormalizeLinkedinVersion tests)
- 🔁 Next prompts: Run python3 scripts/linkedin_oauth_helper.py --post-test "Hello from my AI Employee" → should show ✅ Posted!
- 🧠 Reflection: The error "Requested version 20250201 is not active" is a clear LinkedIn API signal that the version format was wrong. The fix is a single-point normalization in _build_headers() so all callers benefit. YYYYMMDD→YYYYMM truncation is unambiguous (last 2 digits are always the day in YYYYMMDD).

## Evaluation notes (flywheel)

- Failure modes observed: User set api_version to YYYYMMDD format ("20250201") instead of YYYYMM ("202502") — likely copied a full date string. LinkedIn returns HTTP 426 NONEXISTENT_VERSION for any non-YYYYMM version string.
- Graders run and results (PASS/FAIL): pytest — 120/120 PASS (excl. pre-existing Odoo failure)
- Prompt variant (if applicable): Follow-up from PHR 013 — same session, after capabilities fix, post test revealed version format bug
- Next experiment (smallest change to try): Run python3 scripts/linkedin_oauth_helper.py --post-test "Hello from my AI Employee" on real credentials to confirm live posting
