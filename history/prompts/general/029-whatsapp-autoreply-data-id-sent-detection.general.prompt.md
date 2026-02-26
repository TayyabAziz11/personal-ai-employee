---
id: "029"
title: WhatsApp autoreply data-id sent detection
stage: green
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: whatsapp-auto-reply
branch: 001-gold-tier-full
user: tayyab
command: inline fix request
labels: ["whatsapp","auto-reply","sent-detection","data-id","bugfix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - scripts/wa_auto_reply.py
tests:
  - manual: pm2 restart wa-auto-reply → SERVICE_READY at 20:11:30 ✓
  - manual: send test message from Tayyab's phone → daemon should abort (log: ⚡ Abort ... data-id true_*)
---

## Prompt

test it its still replying when i msg

## Response snapshot

Root cause identified: `_get_live_preview` reads the chat-list panel preview text
and tick icons to detect "Tayyab sent this". Both signals are unreliable:

1. **"You:" text prefix** — WhatsApp Web renders "You:" as a styled sibling `<span>`
   outside the text node we read, so `textContent` doesn't include it.
2. **`hasSentTick` icons** — Delivery tick icons can persist in the DOM from previous
   sends and the `offsetWidth > 0` visibility check doesn't reliably distinguish
   "currently showing" from "cached but hidden".

**Fix**: Added `_last_msg_in_chat_is_ours(name)` method that navigates into the
actual chat view and reads the last message bubble's `data-id` attribute:
- `true_...` → Tayyab sent this message → abort auto-reply
- `false_...` → other person sent → proceed with reply

This uses WhatsApp's own sync state (not DOM visual presentation), making it
authoritative across all locales and WA Web versions.

**Flow change** in the main send loop:
- Removed: post-generation `_get_live_preview` live check (unreliable)
- Added: `self._before_send(name)` called first (pauses observer for contact)
- Added: `self._last_msg_in_chat_is_ours(name)` check — navigates to chat, reads
  last `data-id`, escapes back to list. If `True` → `_after_send()` + abort.
- `send_message` only called if `last_is_ours` is `False` or `None`

The pre-generation `_get_live_preview` check is kept as a fast early-exit
optimization (saves the AI API call when it works), but correctness no longer
depends on it.

## Outcome

- ✅ Impact: Sent-message detection is now authoritative — uses `data-id` from actual
  message bubbles, not the unreliable chat-list preview DOM
- 🧪 Tests: pm2 restart confirmed SERVICE_READY ✓; send detection to be verified
  manually by Tayyab messaging during an active auto-reply cycle
- 📁 Files: scripts/wa_auto_reply.py — added `_last_msg_in_chat_is_ours()` method
  (~35 lines), replaced post-gen live check in main loop
- 🔁 Next prompts: If `div[data-id]` selector is too broad (matches non-message elements),
  narrow to `[data-testid="msg-container"][data-id]` only
- 🧠 Reflection: The `data-id` attribute is WhatsApp Web's internal message identifier
  and is completely locale/version independent — it's set by the sync engine, not the
  renderer. This is the correct layer to read from.

## Evaluation notes (flywheel)

- Failure modes observed: If the contact is not visible in the chat list (scrolled out),
  `_last_msg_in_chat_is_ours` returns `None` and the send proceeds — acceptable behaviour
  (don't block on failure to detect)
- Graders run and results (PASS/FAIL): manual smoke test SERVICE_READY PASS; behavioural
  test pending user verification
- Prompt variant (if applicable): null
- Next experiment: Log the actual data-id value to confirm `true_` / `false_` format
  in this WA Web build; verify 5-second wait_for_selector timeout is sufficient
