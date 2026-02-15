# Social Inbox

**Purpose**: Storage for social media intake wrappers created by social watchers (WhatsApp, LinkedIn, Twitter).

## Directory Structure

All intake wrappers follow the naming convention:
```
inbox__<channel>__YYYYMMDD-HHMM__<sender_or_handle>.md
```

Examples:
- `inbox__whatsapp__20260215-1430__john_doe.md`
- `inbox__linkedin__20260215-1445__jane_smith.md`
- `inbox__twitter__20260215-1500__tech_influencer.md`

## Content Format

Each intake wrapper contains:

1. **YAML Frontmatter** (required fields):
   - `id`: Unique identifier
   - `source`: Channel (whatsapp/linkedin/twitter)
   - `received_at`: ISO timestamp
   - `sender` or `handle`: Sender identifier
   - `channel`: Social channel name
   - `thread_id`: Conversation/thread identifier
   - `excerpt`: Message preview (PII redacted)
   - `status`: Processing status (pending/planned/archived)
   - `plan_required`: Boolean (true if action needed)
   - `pii_redacted`: Boolean (always true)

2. **Body**: Full message content or context (PII redacted)

## Processing Flow

1. **Watcher** creates intake wrapper
2. **Brain** detects new wrapper, analyzes content
3. If action needed → creates plan → requests approval
4. After processing → wrapper moved to archive or deleted

## PII Redaction

All intake wrappers MUST have PII redacted:
- Email addresses → `[EMAIL_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`

## See Also

- `templates/social_intake_wrapper_template.md` — Template for creating intake wrappers
- `Docs/social_watchers.md` — Documentation for social watchers (created in G-M3)
