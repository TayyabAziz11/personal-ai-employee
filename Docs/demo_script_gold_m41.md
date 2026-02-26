# Gold Tier M4.1 Demo Script - Social Executor with Plan Parsing

**Version**: 1.0.0 (M4.1)
**Created**: 2026-02-16
**Purpose**: Demonstrate social executor plan parsing and execution flow

---

## Overview

M4.1 completes the social executor by implementing full plan parsing with support for:
- **Markdown table format**: Actions defined in a table with server | operation | parameters columns
- **JSON block format**: Actions defined in a fenced JSON array
- **Parameter validation**: Twitter 280-char limit, required fields, platform constraints
- **PII redaction**: Automatic redaction in logs and previews
- **Dry-run previews**: Detailed action previews without execution
- **Plan lifecycle**: Moves plans to completed/ or failed/ based on results

---

## Quick Start: Run a Dry-Run Social Plan

### Step 1: Place an Approved Plan

Plans must be in `Approved/` directory with this structure:

```markdown
---
id: your_plan_id
status: approved
---

# Your Plan Title

## Actions JSON

\```json
[
  {
    "server": "linkedin",
    "operation": "create_post",
    "parameters": {
      "text": "Your LinkedIn post content here",
      "visibility": "public"
    }
  },
  {
    "server": "twitter",
    "operation": "create_post",
    "parameters": {
      "text": "Your tweet content (max 280 chars)",
      "media_ids": []
    }
  }
]
\```
```

**Alternative**: Use markdown table format:

```markdown
## Actions

| server   | operation    | parameters                                         |
|----------|--------------|---------------------------------------------------|
| linkedin | create_post  | {"text": "...", "visibility": "public"}           |
| twitter  | create_post  | {"text": "...", "media_ids": []}                  |
```

### Step 2: Run Dry-Run (Default)

```bash
python3 brain_execute_social_with_mcp_skill.py
```

**Expected Output**:
```
🔍 DRY-RUN MODE: No real actions will be taken

  📋 Action Preview:
     Platform: Linkedin
     Operation: create_post
     Content: Your LinkedIn post content...
     Length: 123 chars
     visibility: public

  📋 Action Preview:
     Platform: Twitter
     Operation: create_post
     Content: Your tweet content...
     Length: 45 chars
     Twitter limit: 45/280 chars ✓

✅ Dry-run successful
   Plan: /path/to/Approved/your_plan.md
   Actions would be executed: 2
```

### Step 3: Run Execute Mode (Simulated)

```bash
python3 brain_execute_social_with_mcp_skill.py --execute
```

**What Happens**:
1. Parses approved plan
2. Validates all actions
3. Simulates execution (real MCP integration pending)
4. Logs to `Logs/mcp_actions.log`
5. Moves plan to `Plans/completed/`
6. Updates `Dashboard.md` with last action

**Expected Output**:
```
⚠️  EXECUTE MODE: Real actions will be performed!

  🚀 Executing Action (SIMULATED):
     Platform: Linkedin
     Operation: create_post
     Status: Simulated success (real MCP integration pending)

✅ Execution successful
   Plan: /path/to/Approved/your_plan.md
   Actions executed: 2/2
```

---

## Plan Format Examples

### Example 1: JSON Block Format (Recommended)

```markdown
## Actions JSON

\```json
[
  {
    "server": "linkedin",
    "operation": "create_post",
    "parameters": {
      "text": "Excited to announce our new product launch! #innovation",
      "visibility": "public"
    }
  }
]
\```
```

### Example 2: Markdown Table Format

```markdown
## MCP Tools

| server   | operation      | parameters                                                        |
|----------|----------------|-------------------------------------------------------------------|
| whatsapp | send_message   | {"to": "+1234567890", "message": "Hello from automation!"}      |
| linkedin | create_post    | {"text": "Professional update here", "visibility": "connections"}|
```

### Example 3: Mixed Actions

```json
[
  {
    "server": "twitter",
    "operation": "create_post",
    "parameters": {
      "text": "Quick update for Twitter followers! #devops"
    }
  },
  {
    "server": "linkedin",
    "operation": "create_post",
    "parameters": {
      "text": "Longer, more detailed professional update for LinkedIn audience. This can be much longer than Twitter's 280 character limit.",
      "visibility": "public"
    }
  },
  {
    "server": "whatsapp",
    "operation": "send_message",
    "parameters": {
      "to": "+1234567890",
      "message": "Private notification sent via WhatsApp"
    }
  }
]
```

---

## Validation Rules

### Twitter Constraints
- **Max length**: 280 characters
- **Required fields**: `text` or `content`
- **Validation**: Executor will reject posts > 280 chars

### LinkedIn Constraints
- **Required fields**: `text` or `content`
- **Optional fields**: `visibility` (default: "public")

### WhatsApp Constraints
- **send_message**: Requires `to` field (phone number)
- **reply_message**: Requires `message_id` field

---

## Logs and Outputs

### mcp_actions.log Format

Each action is logged as a JSON line:

```json
{
  "timestamp": "2026-02-16T06:55:44.666672+00:00",
  "server": "linkedin",
  "tool": "create_post",
  "params": {
    "text": "Post content (PII redacted if present)",
    "visibility": "public"
  },
  "dry_run": false,
  "status": "simulated_success",
  "result": "Simulated execution successful"
}
```

### Plan Lifecycle

**Approved Plans** → `Approved/`
- Initial location for all plans awaiting execution

**Successful Execution** → `Plans/completed/`
- Plan moved here after all actions succeed
- Original filename preserved

**Failed Execution** → `Plans/failed/`
- Plan moved here if any action fails
- Remediation task created in `Needs_Action/`

### Dashboard Updates

After execution, `Dashboard.md` is updated:

```markdown
**Last External Action (Gold)**: linkedin.create_post - success - 2026-02-16 12:00 UTC
```

---

## Troubleshooting

### No actions found in plan
**Cause**: Executor couldn't parse actions from plan
**Fix**: Ensure plan has either:
- `## Actions JSON` section with valid JSON array
- `## Actions` or `## MCP Tools` table with 3 columns

### Twitter content too long
**Cause**: Tweet exceeds 280 characters
**Fix**: Shorten text or split into multiple tweets

### Validation failed: Missing required field
**Cause**: Action missing required parameter
**Fix**: Add required fields based on validation rules above

---

## Safety Features

1. **Dry-run default**: Never executes without `--execute` flag
2. **PII redaction**: Automatically redacts emails and phone numbers in logs
3. **Constraint validation**: Checks platform limits before execution
4. **Stop on failure**: Execution halts immediately if any action fails
5. **Remediation tasks**: Creates actionable tasks for failed executions
6. **Audit trails**: Complete JSON logs in `Logs/mcp_actions.log`

---

## Next Steps

After M4.1:
- Real MCP client integration (connect to actual APIs)
- Rate limiting with `mcp_helpers.rate_limit_and_backoff()`
- OAuth token refresh handling
- Media upload support for Twitter/LinkedIn
- Scheduled execution via cron/scheduler

---

**Last Updated**: 2026-02-16
**Version**: 1.0.0 (Gold Tier M4.1)
