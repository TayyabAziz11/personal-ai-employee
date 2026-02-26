---
id: "017"
title: "OpenAI-only: remove Anthropic dependency"
stage: green
date: 2026-02-18
surface: agent
model: claude-sonnet-4-6
feature: linkedin-professional-post
branch: 001-gold-tier-full
user: tayyab
command: "feat(ai): switch content generation to openai-only (remove anthropic)"
labels: ["openai","anthropic-removal","content-generator","linkedin","testing"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - pyproject.toml
  - src/personal_ai_employee/core/content_generator.py
  - scripts/linkedin_professional_post.py
  - tests/test_linkedin_image_upload.py
  - README.md
tests:
  - tests/test_linkedin_image_upload.py (11 tests, all green)
---

## Prompt

Remove ALL Anthropic usage and make the LinkedIn "professional post + image upload"
pipeline use ONLY OpenAI.

Context (current state):
- src/personal_ai_employee/core/content_generator.py uses anthropic + openai
- scripts/linkedin_professional_post.py orchestrates: generate text + generate image + post to LinkedIn
- Secrets: .secrets/ai_credentials.json contains {anthropic_api_key, openai_api_key}
- Tests: tests/test_linkedin_image_upload.py — 10 tests passing

REQUEST:
1) Remove Anthropic dependency and code paths.
2) Use OpenAI for BOTH text generation (GPT-4o) and image generation (DALL-E 3).
3) Add --no-ai flag to the CLI script.
4) Keep tests green (mocked, no real network calls).
5) Update README with AI Setup section.
6) Commit with: feat(ai): switch content generation to openai-only (remove anthropic)

## Response snapshot

- Searched repo: Anthropic references found in content_generator.py, tests file, pyproject.toml, README.md
- Removed `anthropic>=0.40.0` from pyproject.toml
- Rewrote content_generator.py: replaced _get_anthropic_client() + Claude messages.create() with OpenAI chat.completions.create() (GPT-4o, temperature=0.4); image generation unchanged (DALL-E 3)
- Updated .secrets format doc: openai_api_key only
- Added --no-ai flag to linkedin_professional_post.py (static placeholder post + minimal PNG bytes)
- Updated tests: removed Anthropic mocks, switched to OpenAI chat.completions mock, added test_content_generator_loads_openai_key; 11 tests all green
- Updated README: new "AI Setup (OpenAI)" section, demo commands, flag table; replaced Claude Sonnet references
- Committed: 6213e1a feat(ai): switch content generation to openai-only (remove anthropic)

## Outcome

- ✅ Impact: Zero Anthropic references remain in src/, tests/, pyproject.toml. OpenAI-only pipeline verified end-to-end (--dry-run generated real GPT-4o post + DALL-E 3 image). --no-ai --dry-run runs with no tokens spent.
- 🧪 Tests: 11/11 green; offline CI safe (all OpenAI calls mocked)
- 📁 Files: 5 files modified/created (pyproject.toml, content_generator.py, linkedin_professional_post.py, test_linkedin_image_upload.py, README.md)
- 🔁 Next prompts: Create PR to merge 001-gold-tier-full into main; consider integration test for --content-only flag
- 🧠 Reflection: Smooth migration — existing interface (ContentGenerator.generate_linkedin_post / generate_image) preserved; only internal implementation changed

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): pytest -q → 11 passed PASS
- Prompt variant (if applicable): none
- Next experiment: add --topic flag to customize post subject at CLI level
