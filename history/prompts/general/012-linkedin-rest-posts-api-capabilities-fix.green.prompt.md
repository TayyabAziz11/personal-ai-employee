---
id: 012
title: LinkedIn REST Posts API + Capabilities Fix + Post-Test
stage: green
date: 2026-02-18
surface: agent
model: claude-sonnet-4-5-20250929
feature: gold-tier-linkedin-oauth
branch: 001-gold-tier-full
user: tayyab
command: fix linkedin real-mode posting via REST API + capabilities + post-test always executes
labels: ["fix","linkedin","rest-posts-api","capabilities","post-test","api_version","oidc","real-mode","gold"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/linkedin_api_helper.py
  - tests/test_linkedin_oidc_author_urn.py
tests:
  - tests/test_linkedin_oidc_author_urn.py (3 new tests — TestBuildHeadersVersionOverride — all PASS)
  - Full suite: 115/115 PASS (112 prior + 3 new), 3 skipped, 1 pre-existing unrelated failure (Odoo --dry-run)
---

## Prompt

LinkedIn OAuth OIDC is working. --status shows authenticated. However /v2/me returns 403, /v2/ugcPosts returns 404, /v2/shares returns 403. Developer Console shows products enabled (Sign In with LinkedIn using OpenID Connect + Share on LinkedIn REST).

--capabilities currently says "Can Post: NO (w_member_social scope not in configured scopes)" but credentials.json scopes include w_member_social.

GOAL: Make LinkedIn real-mode posting work using REST APIs, stop relying on legacy /v2/me + ugcPosts/shares for capabilities gating.

Requirements:
1) POST https://api.linkedin.com/rest/posts with Authorization, X-Restli-Protocol-Version, LinkedIn-Version (default 202401, override via "api_version" key), Content-Type
2) create_post() uses /rest/posts
3) Fix --capabilities: read scopes from credentials.json or token granted_scopes
4) --post-test "text" actually calls REST endpoint (not dry-run by default)
5) Watcher: don't require /v2/me to succeed in real mode
6) Don't break mock mode
7) Secrets in .secrets/ only
8) Update Docs
9) Single commit

## Response snapshot

**Already implemented (commits 7e2f1ca + 4925586):**
- create_post() rewritten to use POST /rest/posts
- check_can_post() fixed: uses _get_granted_scopes() (no network call)
- _get_granted_scopes(): token['granted_scopes'] → credentials['scopes']
- get_author_urn(): 4-step fallback (memory → disk → /v2/me → OIDC sub)
- post_test() and --post-test implemented
- Watcher uses get_author_urn() with anti-spam checkpoint
- Docs updated

**New in this commit (9710f3d):**
- _build_headers(): supports "api_version" credential key as alias for "linkedin_version" (user-specified key name)
- post_test() default changed to execute=True — --post-test always calls REST endpoint
- --dry-run flag added for opt-out (validates pipeline without sending)
- main(): --execute still applies to --test-endpoints; --dry-run applies to --post-test
- 3 new tests: linkedin_version overrides default, api_version overrides default, linkedin_version takes priority over api_version

**Commit:** 9710f3d fix(linkedin): api_version credential key + --post-test always executes

## Outcome

- ✅ Impact: All requirements met — REST posting, capabilities fixed, --post-test calls real endpoint, api_version credential key supported
- 🧪 Tests: 115/115 PASS (112 prior + 3 new), 3 skipped, 1 pre-existing unrelated failure
- 📁 Files: linkedin_api_helper.py (_build_headers api_version alias, post_test execute=True default, main --dry-run), test_linkedin_oidc_author_urn.py (3 new TestBuildHeadersVersionOverride tests)
- 🔁 Next prompts: Run verification commands below in WSL

## Verification commands (expected output)

```
# 1. Status check
python3 scripts/linkedin_oauth_helper.py --status
# Expected: ✅ Status: AUTHENTICATED

# 2. Capabilities (the bug fix)
python3 scripts/linkedin_oauth_helper.py --capabilities
# Expected:
# ----------------------------------------
# LinkedIn Capabilities
# ----------------------------------------
# Authenticated: YES
# Can Post:      YES
# Can Read Posts: NO (r_member_social not granted — expected for OIDC apps)
# ----------------------------------------

# 3. Post test (calls REST endpoint)
python3 scripts/linkedin_oauth_helper.py --post-test "Hello from my AI Employee"
# Expected:
# ✅ Authenticated as: <name>
# ✅ Author URN: urn:li:person:<sub>
# ✅ w_member_social scope: confirmed
# 🚀 Posting to LinkedIn...
# ✅ Posted!
#    URN      : urn:li:post:...
#    Endpoint : rest/posts
#    Author   : urn:li:person:<sub>
```

## Evaluation notes (flywheel)

- Failure modes observed: none new
- Graders run and results (PASS/FAIL): pytest — 115/115 PASS (excl. pre-existing Odoo failure)
- Prompt variant (if applicable): This prompt was a re-submission of the same goals covered in PHR 011, with two additional deltas (api_version key alias, --post-test always-execute)
- Next experiment (smallest change to try): Run python3 scripts/linkedin_oauth_helper.py --post-test "Hello from my AI Employee" on real credentials to confirm live posting
