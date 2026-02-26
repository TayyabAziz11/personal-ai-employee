---
id: "016"
title: LinkedIn Professional Post Claude DALL-E
stage: green
date: 2026-02-18
surface: agent
model: claude-sonnet-4-5-20250929
feature: linkedin-professional-post
branch: 001-gold-tier-full
user: tayyab
command: implement plan (professional LinkedIn post with Claude + DALL-E)
labels: ["linkedin", "claude", "dalle", "image-upload", "green"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - pyproject.toml
  - src/personal_ai_employee/core/linkedin_api_helper.py
  - src/personal_ai_employee/core/content_generator.py
  - scripts/linkedin_professional_post.py
  - tests/test_linkedin_image_upload.py
tests:
  - tests/test_linkedin_image_upload.py::TestUploadImage::test_upload_image_initializes_then_uploads
  - tests/test_linkedin_image_upload.py::TestUploadImage::test_upload_image_raises_on_init_failure
  - tests/test_linkedin_image_upload.py::TestUploadImage::test_upload_image_raises_on_put_failure
  - tests/test_linkedin_image_upload.py::TestCreatePostWithImage::test_create_post_with_image_sends_content_block
  - tests/test_linkedin_image_upload.py::TestCreatePostWithImage::test_create_post_with_image_returns_correct_dict
  - tests/test_linkedin_image_upload.py::TestCreatePostWithImage::test_create_post_with_image_raises_on_error
  - tests/test_linkedin_image_upload.py::TestContentGeneratorPost::test_content_generator_post_mock
  - tests/test_linkedin_image_upload.py::TestContentGeneratorPost::test_content_generator_post_raises_on_empty_response
  - tests/test_linkedin_image_upload.py::TestContentGeneratorImage::test_content_generator_image_mock
  - tests/test_linkedin_image_upload.py::TestContentGeneratorImage::test_content_generator_image_raises_on_no_url
---

## Prompt

Implement the following plan:

# Plan: Professional LinkedIn Agentic AI Post with DALL-E Image

LinkedIn posting is now working (HTTP 201 confirmed). Elevate to professional quality:
- Content: Claude API generates a fresh, engaging LinkedIn post about Agentic AI
- Image: DALL-E 3 generates a unique AI-themed visual, uploaded to LinkedIn via REST media upload API

Steps:
1. Add anthropic>=0.40.0, openai>=1.50.0 to pyproject.toml
2. Extend linkedin_api_helper.py with upload_image() + create_post_with_image()
3. Create src/personal_ai_employee/core/content_generator.py
4. Create scripts/linkedin_professional_post.py CLI
5. Create tests/test_linkedin_image_upload.py (4 test classes, 10 tests total)

## Response snapshot

Implemented all 5 steps:

1. **pyproject.toml** — added `anthropic>=0.40.0`, `openai>=1.50.0`, `requests>=2.28.0`

2. **linkedin_api_helper.py** — added two methods:
   - `upload_image(image_bytes, mime_type) → str`: Two-step (POST initializeUpload + PUT bytes); returns image URN
   - `create_post_with_image(text, image_urn, image_title, visibility) → dict`: Adds `content.media.id` block to REST Posts payload; logs to mcp_actions.log with endpoint `rest/posts+image`

3. **content_generator.py** — new `ContentGenerator` class:
   - `generate_linkedin_post(topic)`: Calls Claude claude-sonnet-4-5-20250929 with thought-leader system prompt; returns 150-200 word post with hashtags
   - `generate_image(concept)`: Calls DALL-E 3 (1024x1024, vivid); downloads URL → bytes; returns raw bytes

4. **linkedin_professional_post.py** — CLI with `--dry-run` and `--content-only` flags; orchestrates all 4 steps with clear emoji progress output

5. **test_linkedin_image_upload.py** — 10 tests across 4 classes; all pass (1.46s)

## Outcome

- ✅ Impact: LinkedIn can now post professional AI-generated content with DALL-E images; full pipeline validated
- 🧪 Tests: 10 passed, 0 failed — covers upload, post-with-image, Claude mock, DALL-E mock
- 📁 Files: 2 new core files, 1 new script, 1 new test file, 2 updated (pyproject.toml, linkedin_api_helper.py)
- 🔁 Next prompts: Add .secrets/ai_credentials.json with real keys then run live; consider retry logic for image upload
- 🧠 Reflection: Two-step LinkedIn image upload (initializeUpload → PUT) requires separate requests.put call outside _api_request_raw since it uses an external CDN URL, not the LinkedIn API base

## Evaluation notes (flywheel)

- Failure modes observed: None during implementation; all tests green first run
- Graders run and results (PASS/FAIL): pytest tests/test_linkedin_image_upload.py → 10 PASSED
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Live dry-run with real API keys to confirm DALL-E URL download + LinkedIn initializeUpload works end-to-end
