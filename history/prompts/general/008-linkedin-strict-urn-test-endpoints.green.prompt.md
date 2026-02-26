---
id: 008
title: LinkedIn Strict URN + Endpoint Diagnostics
stage: green
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: gold-tier-linkedin-oauth
branch: 001-gold-tier-full
user: tayyab
command: fix linkedin strict urn + --test-endpoints diagnostics
labels: ["bugfix","linkedin","oauth","urn","diagnostics","gold","real-mode"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/linkedin_api_helper.py
  - tests/test_linkedin_api_helper_fallback.py
  - Docs/mcp_linkedin_setup.md
tests:
  - tests/test_linkedin_api_helper_fallback.py (15 tests — all PASS)
  - tests/test_linkedin_datetime.py (6 tests — all PASS)
---

## Prompt

LinkedIn products enabled (Share on LinkedIn + Sign In with LinkedIn OIDC).
Now make real-mode diagnostics and fix URN resolution:

1) get_person_urn() strict: require /v2/me, raise on 401/403 (no OIDC fallback)
2) Add --test-endpoints CLI flag
3) Update Docs/mcp_linkedin_setup.md with Verification Checklist

## Response snapshot

**1) Strict get_person_urn():**
- OIDC sub NO longer used as fallback for API endpoints
- /v2/me 401/403 → raises LinkedInAuthError with actionable instructions to re-run OAuth
- oidc_sub on-disk cache is bypassed (forces fresh /v2/me call after re-auth)
- v2_me on-disk cache is trusted (avoids unnecessary network call)
- In-memory cache also tracks method to ensure only v2_me results are trusted

**2) test_endpoints() + --test-endpoints:**
- Calls /v2/me, /v2/shares, /v2/ugcPosts in sequence
- Prints: status code | OK/FAIL | response snippet | actionable fix guidance
- On /v2/me 200: refreshes on-disk URN cache with fresh v2_me result
- On /v2/me 403/401: stops (can't test shares/ugcPosts without valid URN), prints fix

**3) Docs update — Verification Checklist:**
- 5-step checklist: enable products → re-run OAuth → verify --whoami → --test-endpoints → watcher
- Example outputs for --whoami (all products enabled) and --test-endpoints (all OK)
- Updated "if 403" section with ordered fix steps

**Tests updated:** replaced oidc_sub-fallback tests with strict-mode tests:
- v2_me 403 → raises LinkedInAuthError (with --init in message)
- v2_me 401 → raises LinkedInAuthError
- cached method=v2_me → trusted, no network
- cached method=oidc_sub → bypassed, /v2/me called fresh

**CLI output (current state — token pre-dates product enablement):**
```
[1/3] GET /v2/me
  ❌ /v2/me: HTTP 403
     Response: {"status":403,"code":"ACCESS_DENIED",...}
     Fix: Token lacks profile scope OR was issued before products were enabled.
          Re-run OAuth: python3 scripts/linkedin_oauth_helper.py --init
          Then confirm products in LinkedIn Developer Console:
            • Sign In with LinkedIn using OpenID Connect
            • Share on LinkedIn
⚠️ Cannot test shares/ugcPosts without /v2/me URN. Fix /v2/me first.
```

**Commit:** 0d2c02c fix(gold): linkedin endpoint diagnostics + strict urn resolution

## Outcome

- ✅ Impact: get_person_urn() is now strict and safe; --test-endpoints gives clear next step
- 🧪 Tests: 21/21 PASS (15 fallback + 6 datetime)
- 📁 Files: linkedin_api_helper.py (strict get_person_urn, test_endpoints, --test-endpoints flag), tests/ (5 new tests replacing old oidc_sub fallback tests), Docs/mcp_linkedin_setup.md (Verification Checklist)
- 🔁 Next: User must re-run `--init` with new token to get fresh scopes from enabled products
- 🧠 Reflection: Token issued before products were enabled does not carry the required scopes, even after products are approved. Always re-run OAuth after enabling new LinkedIn Developer Console products.

## Evaluation notes (flywheel)

- Failure modes observed: stale token (pre-product-enablement) causes /v2/me 403 even after products enabled
- Graders run and results (PASS/FAIL): pytest — 21/21 PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Re-run --init to get fresh token, then --test-endpoints should show ✅ for all three endpoints
