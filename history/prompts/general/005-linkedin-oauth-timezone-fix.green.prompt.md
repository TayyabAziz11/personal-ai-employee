---
id: 005
title: LinkedIn OAuth Timezone Fix
stage: green
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: gold-tier-linkedin-oauth
branch: 001-gold-tier-full
user: tayyab
command: fix linkedin oauth timezone bug
labels: ["bugfix","datetime","timezone","linkedin","oauth","gold"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/linkedin_api_helper.py
  - tests/test_linkedin_datetime.py
tests:
  - tests/test_linkedin_datetime.py::TestLinkedInDatetimeParsing::test_parse_z_suffix_returns_aware_datetime
  - tests/test_linkedin_datetime.py::TestLinkedInDatetimeParsing::test_seconds_remaining_does_not_raise
  - tests/test_linkedin_datetime.py::TestLinkedInDatetimeParsing::test_future_token_has_positive_remaining
  - tests/test_linkedin_datetime.py::TestLinkedInDatetimeParsing::test_past_token_has_negative_remaining
  - tests/test_linkedin_datetime.py::TestLinkedInDatetimeParsing::test_naive_minus_aware_raises
  - tests/test_linkedin_datetime.py::TestLinkedInDatetimeParsing::test_aware_minus_aware_does_not_raise
---

## Prompt

We have a bug in LinkedIn OAuth helper:

Error: "can't subtract offset-naive and offset-aware datetimes"
Happens on:
- python3 scripts/linkedin_oauth_helper.py --status
- --check-auth
- verification step after --init

Token is saved successfully to .secrets/linkedin_token.json and includes expires_at like:
"2026-04-18T11:42:19.521804Z"

TASK: Fix timezone handling in src/personal_ai_employee/core/linkedin_api_helper.py
Requirements:
1) All datetime comparisons must be timezone-aware UTC.
   - Use datetime.now(timezone.utc)
   - Parse expires_at correctly:
     - Support "Z" suffix by converting to "+00:00"
     - Use datetime.fromisoformat(...)
   - Never subtract naive/aware.

2) show_status() should display:
   - authenticated true/false
   - expires_at
   - seconds/days remaining
   - if expired, say expired and instruct re-init

3) check_auth() should NOT fail because of datetime math.
   It should:
   - validate token freshness
   - then hit userinfo endpoint and succeed if token valid

4) Add a small unit test:
   tests/test_linkedin_datetime.py
   - verifies parsing of "2026-04-18T11:42:19.521804Z"
   - verifies remaining time calc does not raise

5) Keep everything backwards compatible.

After fix, run and paste outputs:
- python3 scripts/linkedin_oauth_helper.py --status
- python3 scripts/linkedin_oauth_helper.py --check-auth

Commit:
fix(gold): linkedin oauth timezone-safe expires_at handling

## Response snapshot

Root cause: `_is_token_expired()` and `_save_token()` used `datetime.utcnow()` (naive)
while `expires_at` was parsed with `+00:00` tzinfo (aware), causing `TypeError` on subtraction.

Fixes applied to `linkedin_api_helper.py`:
1. Added `timezone` to imports: `from datetime import datetime, timedelta, timezone`
2. `_save_token`: `datetime.utcnow()` → `datetime.now(timezone.utc)`
3. `_is_token_expired`: `datetime.utcnow()` → `datetime.now(timezone.utc)`
4. `show_status`: displays seconds_remaining, days_remaining, and expired re-init instruction

Created `tests/test_linkedin_datetime.py` with 6 tests — all passing.

CLI outputs:
- `--status`: AUTHENTICATED, 5183367 seconds / 59 days remaining
- `--check-auth`: AUTHENTICATED, same result

Commit: 55548bb fix(gold): linkedin oauth timezone-safe expires_at handling

## Outcome

- ✅ Impact: Fixed TypeError crash on --status, --check-auth, and post-init verification
- 🧪 Tests: 6/6 passed (test_linkedin_datetime.py)
- 📁 Files: linkedin_api_helper.py (3 hunks), tests/test_linkedin_datetime.py (new, 6 tests)
- 🔁 Next prompts: None required; auth flow fully functional
- 🧠 Reflection: `datetime.utcnow()` is a common Python footgun when mixing with ISO strings parsed from APIs that use "Z" suffix. Always use `datetime.now(timezone.utc)` for aware datetimes.

## Evaluation notes (flywheel)

- Failure modes observed: naive/aware subtraction TypeError in _is_token_expired and _save_token
- Graders run and results (PASS/FAIL): pytest tests/test_linkedin_datetime.py — PASS (6/6)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Consider adding an integration smoke test for the full OAuth flow
