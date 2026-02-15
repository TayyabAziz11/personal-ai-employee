---
# Unique identifier (format: <channel>_<timestamp>_<random>)
id: "whatsapp_20260215143000_abc123"

# Source channel (whatsapp | linkedin | twitter)
source: "whatsapp"

# ISO 8601 timestamp when message was received
received_at: "2026-02-15T14:30:00Z"

# Sender identifier (phone number for WhatsApp, handle for LinkedIn/Twitter)
# For WhatsApp: anonymized or hashed phone number
# For LinkedIn: profile URL or user ID
# For Twitter: @handle
sender: "+1-555-xxx-xxxx"

# Channel name (for clarity, usually same as source)
channel: "whatsapp"

# Thread or conversation ID (for grouping related messages)
thread_id: "thread_abc123"

# Message preview/excerpt (MUST be PII redacted, max 280 chars for Twitter)
# All emails → [EMAIL_REDACTED]
# All phone numbers → [PHONE_REDACTED]
excerpt: "Hi, I'm interested in your services. Can you call me at [PHONE_REDACTED]?"

# Processing status (pending | planned | archived)
status: "pending"

# Whether this message requires a plan/action (true | false)
plan_required: true

# PII redaction flag (ALWAYS true for social intake wrappers)
pii_redacted: true
---

# Social Intake Wrapper

## Message Content

[Full message body goes here. Include context if this is a reply in a thread.]

**Example**:
```
Hi, I'm interested in your services. Can you call me at [PHONE_REDACTED] or email me at [EMAIL_REDACTED]?

I saw your LinkedIn post about multi-channel automation and think it could help our business. We currently handle 100+ customer inquiries per day across WhatsApp and email, and response times are too slow.

Looking forward to hearing from you!
```

## Context (Optional)

**Previous Messages in Thread** (if applicable):
- [Link to previous intake wrapper if this is a continuation]

**Detected Intent**:
- Sales inquiry
- Product question
- Support request
- Other: [specify]

## Suggested Actions

**Recommended Plan**:
1. Generate response draft using context from previous conversations
2. Request approval via `brain_request_approval`
3. Execute reply via `brain_execute_social_with_mcp` with `--dry-run` first

**Priority**: High | Medium | Low

**Urgency**: Immediate | Within 24h | No rush

## Notes

[Any additional notes for the Brain or human reviewer]

---

**Created by**: `whatsapp_watcher` skill
**Watcher Version**: 1.0.0
**Checkpoint ID**: checkpoint_xyz789
