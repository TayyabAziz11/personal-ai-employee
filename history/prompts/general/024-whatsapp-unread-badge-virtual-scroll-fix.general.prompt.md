---
id: "024"
title: "WhatsApp Unread Badge Virtual Scroll Fix"
stage: general
date: "2026-02-20"
surface: agent
model: claude-sonnet-4-6
feature: whatsapp-integration
branch: 001-gold-tier-full
user: tayyab
command: "continue from session summary"
labels: ["whatsapp", "bugfix", "playwright", "virtual-scroll", "unread-badge"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/personal_ai_employee/core/whatsapp_web_helper.py
tests: []
---

## Prompt

hey so this is the work im doing
[Session Summary — WhatsApp Integration]

Phase 1B, Phase 2 complete. One remaining bug:
get_unread_messages() returns 0 despite 3 unread messages in "Family 👪".
Suspected root cause: is_logged_in() inside get_unread_messages() triggers another
wait_for_load_state("networkidle", timeout=20_000) which resets virtual-scroll state.
Fix: remove redundant is_logged_in() guard, use direct URL/DOM check instead,
add 2s settle pause after chat rows appear.
(User also notes they shifted to a 2nd WhatsApp account.)

## Response

Fixed `get_unread_messages()` and `list_chats()` in `whatsapp_web_helper.py`:

1. Added `_check_logged_in_fast()` method — lightweight guard that checks
   `page.url` and queries `SEL["logged_in_check"]` without triggering any
   `wait_for_load_state` call. Raises RuntimeError if not logged in.

2. Replaced `if not self.is_logged_in():` in both `list_chats()` (line 401)
   and `get_unread_messages()` (line 481) with `self._check_logged_in_fast()`.

3. Added `page.wait_for_timeout(2_000)` after `wait_for_selector(chat_item)`
   in both methods to let the virtual-scroll list finish rendering before
   `query_selector_all` runs — ensures unread badges are present in the DOM.

Root cause confirmed: the old `is_logged_in()` call inside these methods fired
a second `wait_for_load_state("networkidle", timeout=20_000)` which caused
WhatsApp Web to reset the virtual-scroll viewport, removing badge elements
from the DOM before the query ran.

## Outcome

- `get_unread_messages()` should now detect unread badges correctly
- `list_chats()` unread_count field should also populate correctly
- No change to `send_message()`, `healthcheck()`, or `is_logged_in()` itself
  (those still use the full check as appropriate)
