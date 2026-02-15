# Skill: watcher_gmail

**Tier:** Silver
**Type:** Perception Skill (Watch-Only)
**Version:** 1.0.0
**Skill Number:** 24

## Purpose

Monitor Gmail inbox via OAuth2 and create intake wrappers for new emails. PERCEPTION ONLY - this skill does NOT send emails or take external actions. All email actions require plan approval.

## Inputs

- **Gmail Query:** Filter from .env (e.g., "is:unread is:important")
- **Execution Mode:** `--once` (single run) or loop mode (continuous)

## Outputs

- **Intake Wrappers:** Files created in Needs_Action/ for each email
- **Attachments:** Downloaded to Needs_Action/attachments/{email_id}/
- **Log Entries:** Logged to Logs/gmail_watcher.log

## Preconditions

- Gmail API OAuth2 credentials configured (credentials.json)
- OAuth token generated (token.json) via first-time consent
- .env file with Gmail configuration
- Needs_Action/ folder exists

## Approval Gate

**No** (perception-only skill, creates intake wrappers but doesn't send emails)

## MCP Tools Used

None (uses Gmail API directly via OAuth2, not MCP)

**Note:** Email SENDING requires MCP and uses brain_execute_with_mcp (Skill 18)

## Steps

### 1. Load Configuration from .env

```powershell
$config = @{
    CredentialsPath = $env:GMAIL_CREDENTIALS_PATH  # credentials.json
    TokenPath = $env:GMAIL_TOKEN_PATH  # token.json
    Query = $env:GMAIL_QUERY  # "is:unread is:important"
    Label = $env:GMAIL_LABEL  # "AI-Employee"
    Limit = $env:GMAIL_LIMIT  # 10
    MarkAsRead = $env:GMAIL_MARK_AS_READ  # false
    ApplyLabel = $env:GMAIL_APPLY_LABEL  # true
}
```

### 2. Authenticate with Gmail API

```python
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# Load or refresh token
if os.path.exists(TOKEN_PATH):
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())  # Auto-refresh
    else:
        # First-time OAuth (opens browser)
        from google_auth_oauthlib.flow import InstalledAppFlow
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
        creds = flow.run_local_server(port=0)

    # Save token for future use
    with open(TOKEN_PATH, 'w') as token:
        token.write(creds.to_json())

service = build('gmail', 'v1', credentials=creds)
```

### 3. Fetch Emails Matching Query

```python
results = service.users().messages().list(
    userId='me',
    q=config['Query'],
    maxResults=config['Limit']
).execute()

messages = results.get('messages', [])
```

### 4. For Each Email

#### 4.1 Get Full Email Details

```python
msg = service.users().messages().get(
    userId='me',
    id=message['id'],
    format='full'
).execute()
```

#### 4.2 Extract Metadata

```python
headers = msg['payload']['headers']
sender = next(h['value'] for h in headers if h['name'] == 'From')
subject = next(h['value'] for h in headers if h['name'] == 'Subject')
date = next(h['value'] for h in headers if h['name'] == 'Date')
```

#### 4.3 Extract Email Body

```python
# Handle plain text and HTML
body_text = extract_body(msg['payload'])
```

#### 4.4 Download Attachments (if any)

```python
if 'parts' in msg['payload']:
    for part in msg['payload']['parts']:
        if part.get('filename'):
            attachment_data = service.users().messages().attachments().get(
                userId='me',
                messageId=message['id'],
                id=part['body']['attachmentId']
            ).execute()

            # Save to Needs_Action/attachments/{email_id}/{filename}
            save_attachment(attachment_data, message['id'], part['filename'])
```

#### 4.5 Check if Already Processed

```python
# Track processed email IDs to avoid duplicates
if message['id'] in processed_ids:
    continue  # Skip
```

#### 4.6 Create Intake Wrapper

File: `Needs_Action/intake__gmail__{YYYY-MM-DD}_{HH-MM}__{slug}.md`

```markdown
---
Source: Gmail
Email ID: {message_id}
From: {sender_email}
Subject: {subject}
Date: {email_date}
Priority: {P2 if important, else P3}
Created: {YYYY-MM-DD HH:MM:SS UTC}
---

# Email from {sender_name}

**Subject:** {subject}

**From:** {sender_email}
**To:** {recipient_email}
**Date:** {email_date}

## Message Body

{email_body_text}

{if attachments:}
## Attachments

- {filename1} (saved to Needs_Action/attachments/{email_id}/{filename1})
- {filename2} (saved to Needs_Action/attachments/{email_id}/{filename2})
{endif}

---

**AI Employee Note:** Process this email and take appropriate action if needed. Any replies require plan approval.
```

#### 4.7 Apply Label (optional)

```python
if config['ApplyLabel']:
    service.users().messages().modify(
        userId='me',
        id=message['id'],
        body={'addLabelIds': [LABEL_ID]}
    ).execute()
```

#### 4.8 Mark as Read (optional)

```python
if config['MarkAsRead']:
    service.users().messages().modify(
        userId='me',
        id=message['id'],
        body={'removeLabelIds': ['UNREAD']}
    ).execute()
```

### 5. Track Processed IDs

```python
# Save processed IDs to avoid duplicates
with open('.gmail_processed_ids', 'a') as f:
    f.write(f"{message['id']}\n")
```

### 6. Log to Logs/gmail_watcher.log

```
[YYYY-MM-DD HH:MM:SS UTC] Gmail Watcher Run
Query: {query}
Emails Fetched: {count}
Intake Wrappers Created: {count}
Attachments Downloaded: {count}
Errors: {count}
Duration: {seconds}s
```

### 7. Log to system_log.md

```markdown
### {timestamp} - gmail_watched
**Skill:** watcher_gmail (Skill 24)
**Query:** {query}

**Outcome:** ✓ OK - Gmail monitored
- Emails Fetched: {count}
- Intake Wrappers: {count}
- Attachments: {count}
```

## Failure Handling

### What to Do:
1. **If OAuth token expired:**
   - Auto-refresh using refresh token
   - Save new token to token.json
   - Continue processing

2. **If credentials.json missing:**
   - Log error to Logs/gmail_watcher.log
   - Display error: "Gmail credentials not found - see Docs/gmail_oauth_setup.md"
   - STOP

3. **If Gmail API quota exceeded:**
   - Log warning to Logs/gmail_watcher.log
   - Skip this run, try again next scheduled run
   - Do NOT crash

4. **If email parsing fails:**
   - Log error for that email
   - Continue with remaining emails
   - Create partial intake wrapper with error note

### What NOT to Do:
- ❌ Do NOT send emails (this is perception-only)
- ❌ Do NOT delete emails
- ❌ Do NOT modify email content
- ❌ Do NOT crash on single email failure (continue with others)
- ❌ Do NOT process same email twice (check processed IDs)

## Logging Requirements

### Logs/gmail_watcher.log
Every run:
```
[YYYY-MM-DD HH:MM:SS UTC] Gmail Watcher Run
Mode: --once | loop
Query: {query}
Emails Fetched: {count}
Intake Wrappers Created: {count}
Attachments Downloaded: {count}
Errors: {count}
Duration: {seconds}s
```

### system_log.md
Significant runs (errors or >0 emails):
```markdown
### {YYYY-MM-DD HH:MM:SS UTC} - gmail_watched
**Skill:** watcher_gmail (Skill 24)
**Emails:** {count}
**Outcome:** ✓ OK / ✗ FAIL
```

## Definition of Done

- [ ] Gmail API authenticated via OAuth2
- [ ] Emails fetched matching query
- [ ] Intake wrappers created in Needs_Action/
- [ ] Attachments downloaded (if any)
- [ ] Processed email IDs tracked
- [ ] No duplicate processing
- [ ] All operations logged
- [ ] No emails sent (perception-only verified)

## Test Procedure (Windows)

### Test 1: First-Time OAuth Setup

```powershell
# 1. Ensure credentials.json exists
Test-Path "credentials.json"  # Returns True

# 2. Run watcher (first time - will open browser)
python gmail_watcher.py --once

# Expected:
# - Browser opens for OAuth consent
# - User authorizes application
# - token.json created automatically
# - Emails fetched and intake wrappers created
```

### Test 2: Fetch Emails and Create Intake Wrappers

```powershell
# Run watcher with existing token
python gmail_watcher.py --once --verbose

# Verify intake wrappers created
Get-ChildItem "Needs_Action/intake__gmail__*.md"

# Verify log entry
Get-Content "Logs/gmail_watcher.log" | Select-Object -Last 10

# Expected: Intake wrappers for unread/important emails
```

### Test 3: Dry-Run Mode

```powershell
# Preview what would happen without creating files
python gmail_watcher.py --dry-run

# Expected: Shows email count and subjects, no files created
```

### Test 4: Token Auto-Refresh

```powershell
# Manually expire token (set expiry to past date in token.json)
# Then run watcher
python gmail_watcher.py --once

# Expected: Token auto-refreshes, emails fetched successfully
```

## Integration with Other Skills

**Called By:**
- Scheduled task (every 30 minutes)
- User (manual invocation)

**Calls:**
- None (creates intake wrappers only)

**Followed By:**
- Bronze processing skills (process intake wrappers)
- brain_create_plan (if email reply needed)

## References

- Constitution: `Specs/sp.constitution.md` (Section 2: Perception Skills)
- Specification: `Specs/SPEC_silver_tier.md` (Section 4: Gmail Watcher)
- OAuth Setup Guide: `Docs/gmail_oauth_setup.md`
- Company Handbook: `Company_Handbook.md` (Skill 24)

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
**Next:** M3 Implementation (gmail_watcher.py, OAuth2 setup)
