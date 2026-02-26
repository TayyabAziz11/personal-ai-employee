---
id: "028"
title: WhatsApp autoreply groups convo cooldown
stage: green
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: whatsapp-auto-reply
branch: 001-gold-tier-full
user: tayyab
command: inline fix request
labels: ["whatsapp","auto-reply","groups","conversation-history","cooldown","bugfix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - scripts/wa_auto_reply.py
tests:
  - manual: pm2 restart wa-auto-reply → SERVICE_READY logged ✓
  - manual: banner shows "Groups/channels: skipped" and "User cooldown: 10 min" ✓
---

## Prompt

hey so now auto reply are work good but the thing is its also reply to group msg dont do it dont send any msg to groups or channels and also now update it and make it like its chat with you right now its msg everytime only 1 type of just like whatsapp bussines now i want it like it chat with the other person in a professional friendly way etc and also when i start to msg then i want it to stop because what happened right now that i also msg then auto reply also msg so its mixing up

## Response snapshot

Three changes implemented in `scripts/wa_auto_reply.py`:

1. **Group/channel skip (JS + Python)**
   - Added `isGroupOrChannel(item)` in the MutationObserver JS — checks `span[data-icon]` attributes for `group`, `newsletter`, `channel`, `status`; also checks `data-testid` markers
   - Kept the existing `GROUP_PREVIEW` regex as a fallback for when DOM detection misses a group (preview pattern `"Name: message"`)
   - Groups/channels are now filtered at DOM read time — they never enter the pending queue

2. **Conversational replies with per-contact history**
   - Added `self.conversation_history = {}` dict on the daemon
   - Every incoming message is appended as `{"role": "user", "content": preview}` before `generate_reply` is called
   - `generate_reply(sender_name, history)` now receives the full history (capped at `MAX_HISTORY=20` entries) and passes it to OpenAI as the `messages` array
   - After a successful send, the reply is appended as `{"role": "assistant", ...}` — building a real conversation thread
   - System prompt rewritten: natural, warm, conversational; matches the other person's tone; no templated opener; plain text; ends with `— Tayyab's AI Employee`

3. **User-active cooldown (10 min)**
   - JS now pushes `{name}` to `window.__waUserSentEvents` whenever a chat preview changes to `"You: ..."` (Tayyab sent something)
   - Python drains `__waUserSentEvents` every tick via `_get_user_sent_events()`
   - `_mark_user_active(name)` stores `{name: time.time()}` in `self.user_active_chats`
   - `_is_user_active(name)` returns `True` for 10 minutes after Tayyab's last message in that chat
   - Any pending reply to an active chat is skipped with log: `⏸ Skipping 'X' — Tayyab is active (cooldown 10 min)`

## Outcome

- ✅ Impact: Auto-reply no longer fires for groups/channels; replies are conversational and context-aware; daemon pauses when Tayyab is in the conversation
- 🧪 Tests: pm2 restart confirmed SERVICE_READY at 18:45:58; banner updated with new feature lines
- 📁 Files: scripts/wa_auto_reply.py (single file, ~330 lines)
- 🔁 Next prompts: Consider persisting conversation_history across restarts; add configurable cooldown via env var
- 🧠 Reflection: Three orthogonal concerns (group filter, conversation context, user-active detection) cleanly separated — JS handles detection, Python handles logic and state

## Evaluation notes (flywheel)

- Failure modes observed: DOM selectors for group icons may lag behind WhatsApp Web updates — regex fallback mitigates this
- Graders run and results (PASS/FAIL): manual smoke test PASS
- Prompt variant (if applicable): null
- Next experiment: Add configurable COOLDOWN_MINUTES via env var `WA_USER_COOLDOWN_MINUTES`
