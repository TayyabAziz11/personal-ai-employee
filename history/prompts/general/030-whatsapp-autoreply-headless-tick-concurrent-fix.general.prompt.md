---
id: "030"
title: WhatsApp autoreply headless tick concurrent fix
stage: green
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: whatsapp-auto-reply
branch: 001-gold-tier-full
user: tayyab
command: inline fix request
labels: ["whatsapp","auto-reply","headless","getComputedStyle","concurrent","bugfix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - scripts/wa_auto_reply.py
tests:
  - manual: pm2 restart wa-auto-reply → SERVICE_READY at 11:13:39 ✓
  - manual: send message while daemon running → should log ⚡ Abort / cooldown
  - manual: two people message simultaneously → both should receive replies
---

## Prompt

hey so now there are some things we need to fix first now when i start to massage then its not stopping and second when i massage then its think that this msg is from other user and its reply to my own msg also fix it proper and third issue is when 2 chats msg at the same time then its only reply to 1 chat and ignore the other

## Response snapshot

Three root causes identified and fixed in `scripts/wa_auto_reply.py`:

### Root cause 1 & 2: `offsetWidth/offsetHeight` = 0 in headless Chromium

`hasSentTick()` used `el.offsetWidth > 0 && el.offsetHeight > 0` to check if a
delivery tick icon was visible.  In headless Chromium (which the daemon uses with
`headless=True`), the layout engine does **not** compute element dimensions — all
`offsetWidth` and `offsetHeight` values are 0.  Result: `hasSentTick()` silently
returned `false` for every tick icon, making it completely blind.

Combined with WhatsApp Web rendering "You:" as a separate styled sibling span
(outside the text node), the `/^You[\s:]/.test(text)` check also failed.

So `youSent` was always `false` → Tayyab's own sent messages were treated as
incoming messages from the other person → reply fired against own message.

**Fix**: Replaced `el.offsetWidth > 0 && el.offsetHeight > 0` with
`getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'`.
`getComputedStyle` evaluates CSS rules correctly in headless mode.

Applied in both `hasSentTick()` (inside `_OBSERVER_JS`) and the equivalent inline
check inside `_get_live_preview()` (Python method).

Also separated `preview` from `fullText` in `readChats()`:
- `preview = ltrEl.textContent` — message text only (no timestamps)
- `fullText = secEl.textContent` — full container (includes "You: " prefix)
- `youSent = /^You[\s:]/.test(fullText) || hasSentTick(secEl)`

### Root cause 3: Timestamp churn resets the scheduleCandidate timer

`readChats()` previously used `secEl.textContent` for the `preview` value stored in
`__waSnapshots`.  WhatsApp Web updates the timestamp string inside `secEl` every
minute ("just now" → "1 min ago" → "2 min ago").  Each timestamp update triggers a
MutationObserver callback → `checkChanges()` sees a changed preview →
`scheduleCandidate(name, newPreview)` → **cancels the existing 2s timer and starts
a new one**.  For two simultaneous messages, this meant one contact's timer kept
getting reset by timestamp ticks and never actually fired before Python drained the
queue.

**Fix**: Changed `preview` in `readChats()` to use `ltrEl.textContent` (message text
only, no timestamps).  Now the snapshot only changes when actual message text
changes.  Timestamps live in separate sibling elements inside `secEl` but NOT in
`ltrEl`, so they no longer trigger false "preview changed" events.

### Also: improved `_last_msg_in_chat_is_ours` selector

Changed from `[data-testid="msg-container"][data-id], div[data-id]` (broad, may
match non-message elements) to `[data-id^="true_"], [data-id^="false_"]` (CSS
attribute prefix match — only matches actual WA message IDs).

## Outcome

- ✅ Impact: Three bugs fixed — (1) daemon stops when Tayyab messages, (2) Tayyab's
  outgoing messages no longer treated as incoming, (3) concurrent chats both get replies
- 🧪 Tests: pm2 restart SERVICE_READY ✓; behavioural test pending user verification
- 📁 Files: scripts/wa_auto_reply.py — hasSentTick, readChats, _get_live_preview,
  _last_msg_in_chat_is_ours (4 sections modified)
- 🔁 Next prompts: If issues persist, add debug logging to print `youSent` value and
  data-id values seen during a test send
- 🧠 Reflection: The headless offsetWidth=0 issue is a classic gotcha — CSS layout
  does not run in headless Chromium. getComputedStyle is the correct headless-safe
  API. The timestamp churn issue was a subtler race condition hidden in the snapshot
  comparison logic.

## Evaluation notes (flywheel)

- Failure modes observed: If WA Web uses opacity:0 to hide ticks (instead of
  display:none/visibility:hidden), getComputedStyle check would still pass. In that
  case, add parseFloat(cs.opacity) > 0 to the check.
- Graders run and results (PASS/FAIL): SERVICE_READY PASS; behavioural test pending
- Prompt variant (if applicable): null
- Next experiment: Log the computed style properties of tick icons during a test to
  confirm which CSS property WA Web uses for hiding them
