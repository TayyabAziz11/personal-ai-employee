# Handoff Summary — Personal AI Employee
**Date:** 2026-02-19
**Branch:** `001-gold-tier-full`
**Last worked on:** Gmail channel fixes + email sending

---

## What This Project Is

A full-stack autonomous AI Employee app:
- **Frontend:** Next.js 14 App Router at `apps/web/`
- **Backend execution:** Python scripts in `scripts/` and `src/personal_ai_employee/`
- **DB:** Neon PostgreSQL via Prisma (schema at `apps/web/prisma/schema.prisma`)
- **Auth:** NextAuth v4 with GitHub OAuth + email/password credentials
- **AI:** OpenAI gpt-4o-mini for content, DALL-E 3 for images
- **LinkedIn:** OAuth2 + web form in command center (`web_execute_plan.py` + LinkedIn API helper)
- **Gmail:** Gmail API (OAuth2, credentials in `.secrets/`) + web form

---

## Current State — What Works ✅

1. **Login/signup** (GitHub OAuth + email/password) — `apps/web/src/app/login/page.tsx`
2. **Dashboard** (`/app`) — shows plans, approvals, inbox
3. **Command Center** — LinkedIn workspace fully working:
   - Connect via CLI token OR web OAuth (Client ID + Secret)
   - Create text/image posts with AI generation
   - Plans go through approval → execute flow
4. **Plans flow** — create → approve/reject → execute with Python executor
5. **LinkedIn posting** — works via `web_execute_plan.py` → `linkedin_api_helper.py`
6. **OpenAI content generation** — AI Generate button in action wizard
7. **DALL-E image generation** — for LinkedIn image posts
8. **Inbox + delete** — inbox items with delete
9. **Plans delete** — trash icon on plan cards
10. **Home button** in sidebar (back to `/`)
11. **Login success messages** — proper feedback on auth

---

## What Was Just Fixed (Session 022) ✅

### Gmail Channel Display Bug
**Problem:** Gmail workspace showed "Connected Account: LinkedIn User" — wrong!
**Root cause:** `getFriendlyDisplayName()` always returned "LinkedIn User" when no name was set.
**Fix:** Made function channel-aware in `apps/web/src/app/app/command-center/[channel]/page.tsx`

```typescript
function getFriendlyDisplayName(name?: string, channel?: string, personUrn?: string): string {
  if (!name) {
    if (channel === 'gmail') return 'Gmail Account'
    // ...
  }
}
// Called as:
const displayName = getFriendlyDisplayName(rawDisplayName, channel, status?.metadata?.person_urn)
```

### Gmail Status Shows Email Address
**Fix:** `apps/web/src/app/api/integrations/status/route.ts` — when Gmail has a token file, now returns `displayName: process.env.GMAIL_USER` (set to `tayyab.aziz.110@gmail.com` in `.env.local`)

### Gmail Credentials Added to .env.local
Added to `apps/web/.env.local`:
```
GMAIL_USER="tayyab.aziz.110@gmail.com"
GMAIL_OAUTH_CREDENTIALS='{"installed":{"client_id":"1014276329720-pgpsnveit9cssvdi71bid70kfdb0frb3.apps.googleusercontent.com",...}}'
```
The full token is still in `.secrets/gmail_token.json`. The Python executor reads it from there.

### Gmail Python Executor Fixed
**File:** `scripts/web_execute_plan.py`
Three bugs fixed:
1. Wrong import: `gmail_helper` → `gmail_api_helper`
2. Wrong path: credentials looked in `src/personal_ai_employee/core/.secrets/` → now uses `REPO_ROOT/.secrets/`
3. `dry_run=True` default → now `dry_run=False` for actual sending

New helper function:
```python
def _make_gmail_helper():
    from personal_ai_employee.core import gmail_api_helper
    secrets_dir = os.path.join(REPO_ROOT, ".secrets")
    return gmail_api_helper.GmailAPIHelper(
        credentials_path=os.path.join(secrets_dir, "gmail_credentials.json"),
        token_path=os.path.join(secrets_dir, "gmail_token.json"),
    )
```

### Gmail Connection Panel in UI
New form in Gmail workspace (when not connected via DB):
- Enter Gmail address + App Password
- Saves to `UserConnection` table via `POST /api/integrations/gmail/connect`
- Step-by-step instructions for getting an App Password
**File:** `apps/web/src/app/app/command-center/[channel]/page.tsx`
**API:** `apps/web/src/app/api/integrations/gmail/connect/route.ts` (NEW)

---

## Session 023 Fixes ✅

### Inbox Delete 404 Fixed
**Problem:** `DELETE /api/inbox/fs:Needs_Action/...md` → 404 because slashes in ID break URL routing.
**Fix:** New `POST /api/inbox/delete` route takes ID in request body. `inbox-list.tsx` updated to use it.
Also handles filesystem-backed IDs (deletes the actual `.md` file from `Needs_Action/` folder).

### Inbox Delete UI — Inline Confirmation
Replaced `confirm()` browser dialog with inline "Delete? ✓ ✗" controls that appear on the card.

### Command Center Index — Connection Status Fixed
**Problem:** Cards showed "Not connected" for LinkedIn/Gmail even though they were connected via token files.
**Fix:** `getUserConnections()` in `command-center/page.tsx` now also checks `.secrets/` token files as fallback.

### LinkedIn Multi-Account Form Removed
Removed "Connect different account" button and form from the LinkedIn workspace. Only the connected account and expired-token refresh remain.

### Gmail Inbox — Full Implementation
- New `apps/web/src/lib/gmail-client.ts` — calls Gmail REST API directly (no Python), auto-refreshes expired token
- New `GET /api/gmail/inbox` — lists messages with query support
- New `POST /api/gmail/reply-plan` — AI generates reply, creates WebPlan with `pending_approval` status
- Gmail workspace right panel: search bar + "Load Inbox" + email list with "Create Reply Plan" button per email
- "Search Inbox" action in the left panel wires to `loadGmailInbox()`
- Reply plans go through normal approve → execute flow

## What Still Needs To Be Done ⚠️

### 1. Test Gmail Email Sending End-to-End (PRIORITY)
The Gmail token in `.secrets/gmail_token.json` has an **expired access token** (expired 2026-02-15). The refresh token should auto-renew it when `GmailAPIHelper.send_email()` is called. But this needs to be tested:
- Go to Gmail workspace → Create Email action wizard
- Fill in: recipient = `tayyab.aziz.110@gmail.com`, subject, body
- Approve the plan → Execute it
- Check if email arrives at `tayyab.aziz.110@gmail.com`

If the token refresh fails, the user needs to re-authenticate the Gmail OAuth:
```bash
cd "/mnt/e/Certified Cloud Native Generative and Agentic AI Engineer/Q4 part 2/Q4 part 2/Hackathon-0/Personal AI Employee"
python3 src/personal_ai_employee/core/gmail_api_helper.py --check-auth
```
This will open a browser to re-auth if needed.

### 2. Gmail Python Dependencies
If email sending fails with "Gmail API libraries not installed", run:
```bash
pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 3. Gmail Inbox / Search (Read Emails)
Currently the "Search Inbox" button in Gmail workspace doesn't do anything functional. Need to:
- Create a new API route: `POST /api/plans/execute-read` or similar for read-only actions
- Or: Add a dedicated `/api/gmail/search` route that calls `GmailAPIHelper.list_messages()`
- Display results in the Gmail right panel (similar to LinkedIn recent posts)

### 4. Action Wizard — AI Generate Button for Gmail
Currently the "Generate with AI" button only shows for LinkedIn channel.
**Fix needed in** `apps/web/src/components/command-center/action-wizard.tsx` around line 371:
```typescript
// Change from:
{channel === 'linkedin' && (
  <p className="text-[10px] text-zinc-600">...</p>
)}
// To show for all channels, or at least gmail too
```
The generate button itself (line 376-384) is not channel-gated, so just need to remove/adjust the character count p tag.

### 5. LinkedIn Simplification (Deferred by User)
User wants simpler LinkedIn connection — just Client ID + Secret with no technical knowledge needed. The full step-by-step guide is there but the user felt it was still complex. (Deferred — user said "do later")

### 6. Inbox Read Emails (Not Implemented)
When user receives an email, it should appear in the Inbox. Currently inbox shows AI-generated plans. Need to add a separate "email inbox" view or integrate Gmail messages into the inbox.

---

## Key Files Reference

| Area | File |
|------|------|
| Main page | `apps/web/src/app/app/page.tsx` |
| Command center channel | `apps/web/src/app/app/command-center/[channel]/page.tsx` |
| Action wizard | `apps/web/src/components/command-center/action-wizard.tsx` |
| Plans list | `apps/web/src/components/plans/plans-list.tsx` |
| Sidebar | `apps/web/src/components/layout/sidebar.tsx` |
| Python executor | `scripts/web_execute_plan.py` |
| Gmail API helper | `src/personal_ai_employee/core/gmail_api_helper.py` |
| LinkedIn API helper | `src/personal_ai_employee/core/linkedin_api_helper.py` |
| Integration status API | `apps/web/src/app/api/integrations/status/route.ts` |
| Gmail connect API | `apps/web/src/app/api/integrations/gmail/connect/route.ts` |
| LinkedIn OAuth start | `apps/web/src/app/api/integrations/linkedin/oauth/start/route.ts` |
| LinkedIn OAuth callback | `apps/web/src/app/api/integrations/linkedin/oauth/callback/route.ts` |
| Plans execute | `apps/web/src/app/api/plans/[id]/execute/route.ts` |
| Plans create | `apps/web/src/app/api/plans/create/route.ts` |
| Plans delete | `apps/web/src/app/api/plans/[id]/delete/route.ts` |
| AI content generate | `apps/web/src/app/api/ai/generate-content/route.ts` |
| NextJS→Python bridge | `apps/web/src/lib/linkedin-bridge.ts` |
| Prisma schema | `apps/web/prisma/schema.prisma` |
| Auth options | `apps/web/src/lib/auth.ts` |
| DB client | `apps/web/src/lib/db.ts` |
| Env vars | `apps/web/.env.local` |

---

## Environment Variables (.env.local)

```
DATABASE_URL="postgresql://neondb_owner:npg_...@ep-orange-lake-....aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
REPO_ROOT="/mnt/e/Certified Cloud Native Generative and Agentic AI Engineer/Q4 part 2/Q4 part 2/Hackathon-0/Personal AI Employee"
GMAIL_USER="tayyab.aziz.110@gmail.com"
GMAIL_OAUTH_CREDENTIALS='{"installed":{"client_id":"1014276329720-...","client_secret":"GOCSPX-...","redirect_uris":["http://localhost"]}}'
OPENAI_API_KEY="sk-..."  ← user needs to add this if not present
```

---

## .secrets/ Folder Contents

```
.secrets/
  gmail_credentials.json   ← Gmail OAuth2 app credentials
  gmail_token.json         ← Gmail OAuth2 user token (may need refresh)
  linkedin_credentials.json
  linkedin_token.json
  linkedin_profile.json
  ai_credentials.json
```

---

## How to Run

```bash
cd "apps/web"
npm run dev        # starts on http://localhost:3000
```

Python executor is spawned on demand when plans are executed (no separate process needed).

---

## Architecture Notes

1. **Plan flow:** User creates a plan in the wizard → saved to DB as `WebPlan` with status `draft` → user approves (status: `approved`) → user clicks Execute → `linkedin-bridge.ts` spawns Python → result saved to `ExecutionLog2`

2. **Credential storage:** LinkedIn credentials in `UserConnection.metadata` (DB). Gmail credentials in `.secrets/` files + env vars. Python executor reads from files/env.

3. **AI content:** OpenAI API called both from Next.js (`/api/ai/generate-content`) and from Python (`generate_content_with_openai()`) — both use `OPENAI_API_KEY` env var.

4. **Image generation:** DALL-E 3 called from Python executor only (not from Next.js UI directly).
