---
id: 035
title: Gmail Draft Send Fix UTF-8
stage: general
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: gmail
branch: 001-gold-tier-full
user: tayyab
command: fix gmail email not being received by recipients
labels: ["bug-fix","gmail","draft","send","utf-8"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - scripts/web_execute_plan.py
  - src/personal_ai_employee/core/gmail_api_helper.py
tests:
  - none — fixes verified by code inspection and API logic tracing
---

## Prompt

"perfect now instagram post are working and its posting now i check all again email is not sending linkldin working good just email is not recieved"

## Response snapshot

Two bugs fixed:

**1. `execute_gmail_draft` sent to yourself instead of creating a real draft (`scripts/web_execute_plan.py`)**
- Root cause: old implementation did `helper.send_email(to=gmail_user, ...)` — sent a preview email to the authenticated user's own address with "[DRAFT]" prefix. The actual intended recipient never received anything.
- Fix: Now calls `helper.service.users().drafts().create(userId='me', body={...})` to create a real Gmail Draft saved in the Drafts folder. The user can open Gmail, review it, and send manually. Returns `draft_id` and a clear message: "Draft saved to Gmail Drafts folder for {to} — open Gmail to review and send"

**2. `send_email` used ASCII-only MIMEText (`src/personal_ai_employee/core/gmail_api_helper.py`)**
- Root cause: `MIMEText(body)` defaults to ASCII charset. AI-generated content (em-dashes, smart quotes, Unicode) raises `UnicodeEncodeError` or produces garbled output.
- Fix: Changed to `MIMEText(body, 'plain', 'utf-8')` — handles all Unicode characters correctly.

## Outcome

- ✅ Impact: "Draft Email" action now creates a real Gmail Draft instead of emailing yourself; "Send Email" now handles AI-generated content with Unicode characters
- 🧪 Tests: none — verified by code inspection
- 📁 Files: 2 files modified
- 🔁 Next prompts: test draft creation and verify it appears in Gmail Drafts; test send with unicode content
- 🧠 Reflection: The "draft_preview sends to self" design was a workaround for not having a proper Drafts API integration. Using `users().drafts().create()` is the correct Gmail API approach.

## Evaluation notes (flywheel)

- Failure modes observed: draft action sending to self masquerading as draft; ASCII-only MIME encoding for AI-generated Unicode text
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): add HTML email support (`MIMEMultipart('alternative')` with text/html part) for richer email formatting
