# Implementation Plan: Gold Tier — Full Multi-Channel & Accounting Integration

**Branch**: `001-gold-tier-full` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-gold-tier-full/spec.md`

---

## Summary

**Objective**: Implement complete Gold Tier capabilities building on Silver Tier foundation, adding multi-channel social operations (WhatsApp, LinkedIn, Twitter), Odoo accounting integration via JSON-RPC, weekly CEO briefing generation, autonomous multi-step execution (Ralph loop), and comprehensive reliability features.

**Technical Approach**:
- Extend existing Perception → Plan → Approval → Action → Logging architecture
- Add 4 new watchers (WhatsApp, LinkedIn, Twitter, Odoo) following BaseWatcher pattern
- Integrate 4 MCP servers with tool discovery + graceful degradation
- Implement 16 new agent skills for social/accounting operations + autonomy
- Create cross-domain vault structure (Social/, Business/, MCP/)
- Build Ralph loop orchestrator with bounded iterations + approval gates
- Generate weekly CEO briefing synthesizing multi-domain data

**Baseline**: Silver Tier complete (Gmail watcher, plan-first workflow, HITL approvals, real Gmail API execution, scheduling, logging, daily summaries)

**Delivery Model**: 8 milestones (G-M1 through G-M8) with strict dependency order, no parallelization to avoid chaos.

---

## Technical Context

**Language/Version**: Python 3.10+
**Primary Dependencies**:
- `watchdog` (filesystem monitoring)
- `pyyaml` (frontmatter parsing)
- `requests` (HTTP/API calls)
- `xmlrpc.client` (Odoo JSON-RPC)
- LinkedIn API SDK (community or custom)
- Twitter API v2 SDK (`tweepy`)
- WhatsApp Business API SDK or web automation (`selenium`/`playwright`)
- Gmail API (already implemented in Silver)

**Storage**: Local filesystem (Markdown vault + JSON logs), Odoo Community Edition (PostgreSQL backend)
**Testing**: pytest (unit + integration), manual end-to-end testing with mock fixtures
**Target Platform**: Windows 11 WSL2 (Ubuntu), Windows Task Scheduler for automation
**Project Type**: Single project (all skills in root, no backend/frontend split)
**Performance Goals**:
- Watcher intake creation: <5 minutes from message arrival
- Odoo queries: <3 seconds for 1000 invoices
- CEO briefing generation: <60 seconds
- Ralph loop iteration: <2 minutes per step

**Constraints**:
- Dry-run mandatory default for all executors
- PII redaction 100% accuracy (emails, phones)
- Approval gates cannot be bypassed
- Secrets never committed (`.secrets/` gitignored)
- Graceful degradation (one MCP server down → others continue)

**Scale/Scope**:
- 4 social channels (WhatsApp, LinkedIn, Twitter, Gmail)
- 4 MCP servers with 20+ total tools
- 16 new agent skills
- 1000+ intake wrappers per week (estimated)
- 7 new scheduled tasks

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Project Constitution**: Template not yet populated. Proceeding with hackathon requirements and Silver Tier established patterns.

**Key Architectural Principles** (from Silver Tier + Hackathon):
1. ✅ **Perception-Only Watchers**: Watchers create intake wrappers, never execute actions (PASS)
2. ✅ **Plan-First Workflow**: All external actions require structured plans (PASS)
3. ✅ **HITL Approvals Mandatory**: File-based approvals cannot be bypassed (PASS)
4. ✅ **Dry-Run Default**: All executors default to `--dry-run`, `--execute` flag required (PASS)
5. ✅ **Append-Only Audit Trails**: JSON logs + Markdown logs, no deletions (PASS)
6. ✅ **Agent Skills for AI Functionality**: All new AI capabilities implemented as skills (PASS)
7. ✅ **PII Redaction Everywhere**: Logs, intake wrappers, summaries (PASS)

**No Constitution violations detected**. Gold Tier extends Silver patterns without introducing new complexity.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-gold-tier-full/
├── spec.md              # Feature specification (created by /sp.specify)
├── plan.md              # This file (created by /sp.plan)
├── research.md          # Phase 0 output (if needed)
├── data-model.md        # Phase 1 output (entities: Social Intake Wrapper, CEO Briefing, MCP Snapshot, etc.)
├── quickstart.md        # Phase 1 output (setup instructions)
├── contracts/           # Phase 1 output (MCP tool contracts, YAML schemas)
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec validation (already created)
└── tasks.md             # Phase 2 output (created by /sp.tasks, NOT created here)
```

### Source Code (repository root)

```text
Personal AI Employee/
├── Social/
│   ├── Inbox/           # Social intake wrappers (WhatsApp/LinkedIn/Twitter)
│   ├── Summaries/       # Daily/weekly social summaries
│   └── Analytics/       # Aggregated social metrics
├── Business/
│   ├── Goals/           # Strategic objectives
│   ├── Briefings/       # Weekly CEO briefings
│   ├── Accounting/      # Odoo-related intake wrappers (optional)
│   ├── Clients/         # Client metadata (if needed)
│   └── Invoices/        # Invoice tracking (if needed)
├── MCP/                 # MCP registry snapshots + server notes
│
├── Skills/ (NEW - Gold Tier)
│   ├── whatsapp_watcher_skill.py
│   ├── linkedin_watcher_skill.py
│   ├── twitter_watcher_skill.py
│   ├── odoo_watcher_skill.py (optional)
│   ├── brain_execute_social_with_mcp_skill.py
│   ├── brain_execute_odoo_with_mcp_skill.py
│   ├── brain_mcp_registry_refresh_skill.py
│   ├── brain_handle_mcp_failure_skill.py
│   ├── brain_social_generate_summary_skill.py
│   ├── brain_generate_weekly_ceo_briefing_skill.py
│   ├── brain_generate_accounting_audit_skill.py (optional)
│   ├── brain_ralph_loop_orchestrator_skill.py
│   └── mcp_helpers.py  # Shared: rate_limit_and_backoff, PII redaction, etc.
│
├── Scheduled/ (EXTEND - Gold Tier adds 7 tasks)
│   ├── whatsapp_watcher_task.xml
│   ├── linkedin_watcher_task.xml
│   ├── twitter_watcher_task.xml
│   ├── odoo_watcher_task.xml
│   ├── mcp_registry_refresh_task.xml
│   ├── social_daily_summary_task.xml
│   └── weekly_ceo_briefing_task.xml
│
├── Logs/
│   ├── whatsapp_watcher.log
│   ├── linkedin_watcher.log
│   ├── twitter_watcher.log
│   ├── odoo_watcher.log
│   ├── ralph_loop.log
│   ├── mcp_tools_snapshot_whatsapp.json (gitignored)
│   ├── mcp_tools_snapshot_linkedin.json (gitignored)
│   ├── mcp_tools_snapshot_twitter.json (gitignored)
│   └── mcp_tools_snapshot_odoo.json (gitignored)
│
├── Docs/ (EXTEND - Gold Tier adds 8 docs)
│   ├── mcp_whatsapp_setup.md
│   ├── mcp_linkedin_setup.md
│   ├── mcp_twitter_setup.md
│   ├── mcp_odoo_setup.md
│   ├── gold_demo_script.md
│   ├── gold_completion_checklist.md
│   ├── architecture_gold.md
│   └── lessons_learned_gold.md
│
├── .secrets/ (gitignored)
│   ├── whatsapp_credentials.json
│   ├── linkedin_credentials.json
│   ├── twitter_credentials.json
│   └── odoo_credentials.json
│
├── Dashboard.md         # EXTEND: Add Gold sections
├── system_log.md        # EXTEND: Continue append-only logging
└── [Silver Tier files remain unchanged]
```

**Structure Decision**: Single project structure (no backend/frontend split). All agent skills in root `Skills/` directory. Cross-domain vault expansion (Social/, Business/, MCP/) extends existing Needs_Action/, Pending_Approval/, etc. No UI components (backend-first).

---

## Complexity Tracking

**No complexity violations**. Gold Tier follows established Silver patterns:
- BaseWatcher pattern for all watchers
- Plan-first workflow for all external actions
- File-based HITL approvals
- MCP tool abstraction (same pattern as Gmail MCP)
- Agent skills for all AI functionality

---

## Milestone Breakdown

### G-M1: Vault + Domain Expansion

**Objective**: Create cross-domain vault structure (Social/, Business/, MCP/) and define YAML frontmatter schemas for all intake wrapper types.

**Duration**: 2-3 hours

**Tasks** (atomic):
1. Create directory structure: `Social/Inbox/`, `Social/Summaries/`, `Social/Analytics/`, `Business/Goals/`, `Business/Briefings/`, `Business/Accounting/`, `MCP/`
2. Create `templates/social_intake_wrapper_template.md` with YAML frontmatter schema
3. Create `templates/ceo_briefing_template.md` with required sections
4. Update `.gitignore` to add `Logs/mcp_tools_snapshot_*.json`
5. Create README.md files in each new directory explaining purpose
6. Update Dashboard.md template to include Gold section placeholders

**Files to Create**:
- `Social/Inbox/README.md`
- `Social/Summaries/README.md`
- `Social/Analytics/README.md`
- `Business/Goals/README.md`
- `Business/Briefings/README.md`
- `Business/Accounting/README.md` (optional)
- `MCP/README.md`
- `templates/social_intake_wrapper_template.md`
- `templates/ceo_briefing_template.md`

**Files to Modify**:
- `.gitignore` (add MCP snapshot patterns)
- `Dashboard.md` (add section headers for Gold)

**Agent Skills Involved**: None (infrastructure setup only)

**Approval Requirements**: None (no external actions)

**Test Steps**:
1. Verify all directories created: `ls -la Social/ Business/ MCP/`
2. Verify templates exist: `cat templates/social_intake_wrapper_template.md`
3. Verify gitignore updated: `grep "mcp_tools_snapshot" .gitignore`
4. Create test intake wrapper using template, verify YAML frontmatter parses correctly

**Failure Simulations**: N/A (infrastructure cannot fail)

**Definition of Done**:
- [ ] All directories exist with README.md files
- [ ] YAML frontmatter templates created and validated
- [ ] `.gitignore` updated
- [ ] Dashboard.md has Gold section placeholders
- [ ] Manual test: Create one sample social intake wrapper from template

**Git Commit**: `feat(gold): G-M1 vault expansion + templates`

**Rollback**: `git revert <commit>` (safe, no dependencies)

---

### G-M2: MCP Registry + Reliability Core

**Objective**: Implement MCP tool discovery, failure handling, and rate limiting infrastructure before integrating any MCP servers.

**Duration**: 4-5 hours

**Tasks** (atomic):
1. Create `mcp_helpers.py` with shared functions:
   - `redact_pii(text)` — PII redaction (emails, phones)
   - `rate_limit_and_backoff(func, max_retries=4)` — HTTP 429 handling
   - `check_disk_space(min_free_mb=100)` — Disk space check
2. Implement `brain_mcp_registry_refresh_skill.py`:
   - Queries all configured MCP servers for tool lists
   - Saves snapshots to `Logs/mcp_tools_snapshot_<server>.json`
   - Updates Dashboard.md with "MCP Registry Status" table
3. Implement `brain_handle_mcp_failure_skill.py`:
   - Standard failure contract (log + remediation task + continue)
   - Failure types: connection_timeout, auth_failure, rate_limit, server_error
4. Create `Docs/mcp_tools_snapshot_example.json` (example snapshot format)
5. Create `Scheduled/mcp_registry_refresh_task.xml` (daily at 2 AM UTC)

**Files to Create**:
- `mcp_helpers.py`
- `brain_mcp_registry_refresh_skill.py`
- `brain_handle_mcp_failure_skill.py`
- `Docs/mcp_tools_snapshot_example.json`
- `Scheduled/mcp_registry_refresh_task.xml`

**Files to Modify**:
- `Dashboard.md` (add MCP Registry Status table logic)

**Agent Skills Involved**:
- `brain_mcp_registry_refresh`
- `brain_handle_mcp_failure`

**Approval Requirements**: None (query-only operations)

**Test Steps**:
1. Unit test `mcp_helpers.redact_pii()` with known PII patterns
2. Unit test `rate_limit_and_backoff()` with mock HTTP 429 responses
3. Mock MCP server, run `brain_mcp_registry_refresh --dry-run`, verify snapshot created
4. Simulate MCP server down, run `brain_handle_mcp_failure`, verify remediation task created in `Needs_Action/`
5. Verify Dashboard.md updates correctly with server status

**Failure Simulations**:
- MCP server unreachable → verify graceful degradation (log + continue)
- Rate limit (HTTP 429) → verify exponential backoff applied
- Disk space low → verify watcher skips file creation

**Definition of Done**:
- [ ] `mcp_helpers.py` implemented with 100% test coverage for PII redaction
- [ ] `brain_mcp_registry_refresh` works with mock MCP server
- [ ] `brain_handle_mcp_failure` creates remediation tasks
- [ ] Dashboard.md shows "MCP Registry Status: No servers configured"
- [ ] Scheduled task XML validated

**Git Commit**: `feat(gold): G-M2 MCP registry + reliability core`

**Rollback**: `git revert <commit>` (safe, no external dependencies)

---

### G-M3: Social Watchers (WhatsApp, LinkedIn, Twitter)

**Objective**: Implement 3 social watchers following BaseWatcher pattern, with mock mode for testing and real API integration (optional).

**Duration**: 8-10 hours (2.5-3 hours per watcher)

**Tasks** (atomic):
1. **WhatsApp Watcher**:
   - Implement `whatsapp_watcher_skill.py` following `filesystem_watcher_skill.py` pattern
   - CLI flags: `--once`, `--dry-run`, `--mock`
   - Mock mode: Read fixture from `tests/fixtures/whatsapp_mock.json`
   - Creates intake wrappers in `Social/Inbox/` with YAML frontmatter
   - Redacts PII (phone numbers)
   - Logs to `Logs/whatsapp_watcher.log` + `system_log.md`
   - Checkpoint: `Logs/whatsapp_watcher_checkpoint.json`

2. **LinkedIn Watcher**:
   - Implement `linkedin_watcher_skill.py`
   - Same CLI flags
   - Mock mode: Read fixture from `tests/fixtures/linkedin_mock.json`
   - Detects notifications, posts, comments, messages
   - LinkedIn-specific metadata (post_id, comment_id, profile_url)
   - Logs to `Logs/linkedin_watcher.log`

3. **Twitter Watcher**:
   - Implement `twitter_watcher_skill.py`
   - Same CLI flags
   - Mock mode: Read fixture from `tests/fixtures/twitter_mock.json`
   - Searches mentions, DMs, keywords
   - Excerpt max 280 chars
   - Logs to `Logs/twitter_watcher.log`

4. Create mock fixtures for all 3 watchers
5. Create `Scheduled/` XML tasks for each watcher (5-10 min intervals)
6. Update Dashboard.md with "Social Channel Status" table

**Files to Create**:
- `whatsapp_watcher_skill.py`
- `linkedin_watcher_skill.py`
- `twitter_watcher_skill.py`
- `tests/fixtures/whatsapp_mock.json`
- `tests/fixtures/linkedin_mock.json`
- `tests/fixtures/twitter_mock.json`
- `Scheduled/whatsapp_watcher_task.xml`
- `Scheduled/linkedin_watcher_task.xml`
- `Scheduled/twitter_watcher_task.xml`

**Files to Modify**:
- `Dashboard.md` (add Social Channel Status table)

**Agent Skills Involved**:
- `whatsapp_watcher`
- `linkedin_watcher`
- `twitter_watcher`

**Approval Requirements**: None (perception-only)

**Test Steps**:
1. Run each watcher with `--mock --once`, verify intake wrapper created in `Social/Inbox/`
2. Verify YAML frontmatter matches schema (id, source, received_at, sender/handle, channel, thread_id, excerpt, status, plan_required, pii_redacted)
3. Verify PII redacted (search for email/phone patterns in excerpt)
4. Verify checkpoint file updated (prevents duplicates)
5. Verify logs written to `Logs/<watcher>.log` and `system_log.md`
6. Run with `--dry-run`, verify no files created
7. Import scheduled tasks, verify they run without errors (mock mode)

**Failure Simulations**:
- Mock fixture missing → verify graceful fallback (log error + exit)
- Invalid JSON in fixture → verify validation error + exit
- Disk space low → verify file creation skipped + remediation task

**Definition of Done**:
- [ ] All 3 watchers implemented with mock mode working
- [ ] Intake wrappers created with correct YAML frontmatter
- [ ] PII redaction working (100% for mock data)
- [ ] Checkpoints prevent duplicates
- [ ] Scheduled tasks import successfully
- [ ] Dashboard.md shows Social Channel Status with mock data

**Git Commit**: `feat(gold): G-M3 social watchers (WhatsApp, LinkedIn, Twitter)`

**Rollback**: `git revert <commit>` (safe, watchers are independent)

---

### G-M4: Social MCP Execution Layer

**Objective**: Implement social MCP executor with dry-run default, approval gates, and multi-channel support (WhatsApp, LinkedIn, Twitter).

**Duration**: 6-8 hours

**Tasks** (atomic):
1. Extend `brain_create_plan` skill to detect social actions:
   - Detect `whatsapp.send_message`, `linkedin.create_post`, `twitter.create_post`
   - Generate plans with social MCP tool references
   - Risk assessment: social actions = Medium risk (public visibility)

2. Implement `brain_execute_social_with_mcp_skill.py`:
   - Supports LinkedIn, Twitter, WhatsApp actions
   - Dry-run default (`--dry-run` mode shows preview)
   - Explicit `--execute` flag required for real actions
   - Logs to `Logs/mcp_actions.log` (JSON format)
   - Updates plan status: `Approved` → `Executed` (or `Failed`)
   - MCP tool abstraction (similar to `brain_execute_with_mcp` for Gmail)

3. Create MCP tool contract documentation:
   - `specs/001-gold-tier-full/contracts/mcp_whatsapp.yaml`
   - `specs/001-gold-tier-full/contracts/mcp_linkedin.yaml`
   - `specs/001-gold-tier-full/contracts/mcp_twitter.yaml`

4. Create setup documentation:
   - `Docs/mcp_whatsapp_setup.md` (credentials, API keys, session management)
   - `Docs/mcp_linkedin_setup.md` (OAuth2 flow, API access)
   - `Docs/mcp_twitter_setup.md` (API v2 credentials, rate limits)

5. Create `.secrets/` templates (gitignored):
   - `.secrets/whatsapp_credentials_template.json`
   - `.secrets/linkedin_credentials_template.json`
   - `.secrets/twitter_credentials_template.json`

**Files to Create**:
- `brain_execute_social_with_mcp_skill.py`
- `specs/001-gold-tier-full/contracts/mcp_whatsapp.yaml`
- `specs/001-gold-tier-full/contracts/mcp_linkedin.yaml`
- `specs/001-gold-tier-full/contracts/mcp_twitter.yaml`
- `Docs/mcp_whatsapp_setup.md`
- `Docs/mcp_linkedin_setup.md`
- `Docs/mcp_twitter_setup.md`
- `.secrets/whatsapp_credentials_template.json`
- `.secrets/linkedin_credentials_template.json`
- `.secrets/twitter_credentials_template.json`

**Files to Modify**:
- `brain_create_plan_skill.py` (add social action detection)
- `Dashboard.md` (add "Last External Action" table)

**Agent Skills Involved**:
- `brain_create_plan` (extended)
- `brain_execute_social_with_mcp` (new)

**Approval Requirements**: ALL social actions require approval (whatsapp.send_message, linkedin.create_post, twitter.create_post, etc.)

**Test Steps**:
1. Create social intake wrapper manually
2. Run `brain_create_plan`, verify plan generated with `whatsapp.reply_message` tool
3. Run `brain_request_approval`, verify ACTION file created in `Pending_Approval/`
4. Manually move to `Approved/`
5. Run `brain_execute_social_with_mcp --dry-run`, verify preview shown (no real action)
6. Run `brain_execute_social_with_mcp --execute` (IF MCP servers configured), verify action executed + logged
7. Verify plan status updated to `Executed`
8. Verify JSON log in `Logs/mcp_actions.log` with full parameters

**Failure Simulations**:
- MCP server down → verify `brain_handle_mcp_failure` invoked + remediation task
- Rate limit (HTTP 429) → verify backoff applied + retry
- Auth failure (401/403) → verify error logged + remediation task
- Execute without approval → verify ERROR (approval gate enforced)

**Definition of Done**:
- [ ] `brain_execute_social_with_mcp` implemented with dry-run default
- [ ] Social action detection added to `brain_create_plan`
- [ ] MCP tool contracts documented (3 YAML files)
- [ ] Setup docs created (3 markdown files)
- [ ] Dry-run test passes (preview shown, no real action)
- [ ] Approval gate cannot be bypassed (test: execute without approval → FAIL)
- [ ] Dashboard.md shows "Last External Action: (none yet)"

**Git Commit**: `feat(gold): G-M4 social MCP execution layer`

**Rollback**: `git revert <commit>` (safe, no real actions executed in testing)

---

### G-M5: Odoo MCP Integration (Query → Action)

**Objective**: Implement Odoo accounting integration via JSON-RPC MCP server, supporting both query operations (unpaid invoices, revenue, AR aging) and action operations (create invoice, post invoice, register payment).

**Duration**: 6-8 hours

**Tasks** (atomic):
1. Implement `odoo_watcher_skill.py` (optional but recommended):
   - Queries Odoo via MCP for unpaid invoices, overdue payments
   - Creates intake wrappers in `Business/Accounting/` (or `Needs_Action/`)
   - Logs to `Logs/odoo_watcher.log`
   - Query-only (no invoice creation/posting)
   - CLI flags: `--once`, `--dry-run`, `--mock`

2. Extend `brain_create_plan` to detect Odoo actions:
   - Detect `odoo.create_invoice`, `odoo.post_invoice`, `odoo.register_payment`
   - Generate plans with Odoo MCP tool references
   - Risk assessment: Odoo actions = High risk (financial impact)

3. Implement `brain_execute_odoo_with_mcp_skill.py`:
   - Supports Odoo accounting actions
   - Dry-run default
   - Explicit `--execute` flag required
   - Approval required for all ACTION tools
   - JSON-RPC error handling (401/403 auth failures, 500 server errors)
   - Logs to `Logs/mcp_actions.log`

4. Create Odoo MCP tool contract:
   - `specs/001-gold-tier-full/contracts/mcp_odoo.yaml`
   - Document JSON-RPC patterns (xmlrpc/2/common, xmlrpc/2/object)
   - Example model/method: `account.move`, `res.partner`

5. Create Odoo setup documentation:
   - `Docs/mcp_odoo_setup.md` (JSON-RPC setup, database config, model/method reference)
   - Document base URL: `http://localhost:8069`
   - Document authentication flow

6. Create `.secrets/odoo_credentials_template.json`

7. Create `Scheduled/odoo_watcher_task.xml` (daily or hourly)

**Files to Create**:
- `odoo_watcher_skill.py` (optional)
- `brain_execute_odoo_with_mcp_skill.py`
- `specs/001-gold-tier-full/contracts/mcp_odoo.yaml`
- `Docs/mcp_odoo_setup.md`
- `.secrets/odoo_credentials_template.json`
- `Scheduled/odoo_watcher_task.xml`
- `tests/fixtures/odoo_mock.json` (for watcher testing)

**Files to Modify**:
- `brain_create_plan_skill.py` (add Odoo action detection)
- `Dashboard.md` (add "Accounting Status" table)

**Agent Skills Involved**:
- `odoo_watcher` (new, optional)
- `brain_create_plan` (extended)
- `brain_execute_odoo_with_mcp` (new)

**Approval Requirements**: ALL Odoo ACTION tools require approval (create_invoice, post_invoice, register_payment, etc.). Query tools (list_unpaid_invoices, revenue_summary) do NOT require approval.

**Test Steps**:
1. (Optional) Run `odoo_watcher --mock --once`, verify intake wrapper created
2. Create plan for `odoo.create_invoice`, verify plan generated
3. Run `brain_request_approval`, verify ACTION file created
4. Manually approve
5. Run `brain_execute_odoo_with_mcp --dry-run`, verify preview shown
6. (IF Odoo configured) Run with `--execute`, verify invoice created in Odoo
7. Verify JSON log with full parameters
8. Simulate Odoo auth failure (401), verify remediation task created

**Failure Simulations**:
- Odoo server down → verify graceful degradation (log + remediation task + continue)
- Auth failure (401/403) → verify error logged + remediation task "Refresh Odoo credentials"
- Invalid JSON-RPC response → verify parsing error handled
- Execute without approval → verify ERROR

**Definition of Done**:
- [ ] `brain_execute_odoo_with_mcp` implemented with dry-run default
- [ ] Odoo action detection added to `brain_create_plan`
- [ ] Odoo MCP tool contract documented (YAML)
- [ ] Setup doc created with JSON-RPC examples
- [ ] Dry-run test passes (mock Odoo query/action)
- [ ] Approval gate enforced for ACTION tools
- [ ] Dashboard.md shows "Accounting Status: Odoo connection not configured"

**Git Commit**: `feat(gold): G-M5 Odoo MCP integration (query + action)`

**Rollback**: `git revert <commit>` (safe, no real Odoo operations in testing)

---

### G-M6: Weekly CEO Briefing + Accounting Audit

**Objective**: Implement weekly CEO briefing generation that synthesizes Business/Goals, system_log.md, Social/Analytics, and Odoo queries into executive summary.

**Duration**: 5-6 hours

**Tasks** (atomic):
1. Implement `brain_social_generate_summary_skill.py`:
   - Aggregates social intake wrappers from `Social/Inbox/` (daily or weekly)
   - Queries LinkedIn/Twitter analytics via MCP (if available)
   - Generates `Social/Summaries/YYYY-MM-DD_daily.md` or `YYYY-MM-DD_weekly.md`
   - Includes: message count per channel, top conversations, engagement metrics
   - Links to intake wrappers

2. Implement `brain_generate_weekly_ceo_briefing_skill.py`:
   - Reads data sources:
     - `Business/Goals/*` (strategic objectives)
     - `system_log.md` (activity log)
     - Task completions from `Done/` (weekly count)
     - `Social/Analytics/*` (social performance)
     - Odoo MCP queries: `odoo.revenue_summary`, `odoo.ar_aging_summary`, `odoo.list_unpaid_invoices`
   - Writes `Business/Briefings/YYYY-MM-DD_Monday_Briefing.md`
   - Sections: KPIs, Wins, Risks, Outstanding Invoices + AR Aging, Social Performance, Next Week Priorities, Pending Approvals
   - Handles missing data gracefully (e.g., "Odoo metrics unavailable (server unreachable)")

3. (Optional) Implement `brain_generate_accounting_audit_skill.py`:
   - Queries Odoo for detailed metrics
   - Generates `Business/Accounting/YYYY-MM-DD_audit.md`
   - Includes: revenue breakdown, expense summary, AR aging, late fees

4. Create sample Business Goal:
   - `Business/Goals/2026_Q1_goals.md` (example strategic objectives)

5. Create scheduled tasks:
   - `Scheduled/social_daily_summary_task.xml` (daily at 11 PM UTC)
   - `Scheduled/weekly_ceo_briefing_task.xml` (weekly on Sunday at 11:59 PM UTC)

6. Update Dashboard.md with briefing links

**Files to Create**:
- `brain_social_generate_summary_skill.py`
- `brain_generate_weekly_ceo_briefing_skill.py`
- `brain_generate_accounting_audit_skill.py` (optional)
- `Business/Goals/2026_Q1_goals.md` (sample)
- `Scheduled/social_daily_summary_task.xml`
- `Scheduled/weekly_ceo_briefing_task.xml`

**Files to Modify**:
- `Dashboard.md` (add "Latest Social Summary" and "Latest CEO Briefing" links)

**Agent Skills Involved**:
- `brain_social_generate_summary`
- `brain_generate_weekly_ceo_briefing`
- `brain_generate_accounting_audit` (optional)

**Approval Requirements**: None (reporting only, no external actions)

**Test Steps**:
1. Create sample social intake wrappers (3-5 files)
2. Run `brain_social_generate_summary`, verify summary generated in `Social/Summaries/`
3. Create sample Business Goal in `Business/Goals/`
4. Run `brain_generate_weekly_ceo_briefing`, verify briefing generated in `Business/Briefings/`
5. Verify all 8 sections present: KPIs, Wins, Risks, Outstanding Invoices + AR Aging, Social Performance, Next Week Priorities, Pending Approvals
6. Simulate Odoo down, verify briefing still generates with "Odoo metrics unavailable" note
7. Verify Dashboard.md links to latest briefing

**Failure Simulations**:
- Odoo server down → verify briefing generates with graceful degradation note
- No social summaries exist → verify briefing includes "No social activity this week"
- No Business Goals exist → verify briefing includes "No strategic goals configured"

**Definition of Done**:
- [ ] Social summary generator working (aggregates intake wrappers)
- [ ] CEO briefing generator working (all 8 sections)
- [ ] Graceful degradation for missing data sources
- [ ] Scheduled tasks created (daily social summary, weekly CEO briefing)
- [ ] Dashboard.md links to latest briefing
- [ ] Manual test: Generate briefing with mock data, verify all sections populated

**Git Commit**: `feat(gold): G-M6 weekly CEO briefing + accounting audit`

**Rollback**: `git revert <commit>` (safe, reporting only)

---

### G-M7: Ralph Loop Autonomous Orchestrator

**Objective**: Implement Ralph Wiggum loop for autonomous multi-step task completion with bounded iterations, approval gates respected, and remediation task creation on failure.

**Duration**: 6-8 hours

**Tasks** (atomic):
1. Implement `brain_ralph_loop_orchestrator_skill.py`:
   - Parameters:
     - `--task-description` (what to accomplish)
     - `--max-iterations` (default 10, max 50)
     - `--max-plans-per-iteration` (default 5, prevents runaway)
     - `--completion-file` (optional, file to check in `Done/`)
   - Behavior:
     - Reads task, begins execution
     - Loops: check status → act → log → check completion
     - Stops when:
       - Approval required (does not bypass HITL)
       - Max iterations reached
       - Completion file appears in `Done/`
       - Critical error (server down, auth failure)
     - Creates remediation tasks on failure
     - Bounded retries: max 3 retries per step
     - Timeout: max 5 minutes per iteration
   - Logs to `Logs/ralph_loop.log` (one line per iteration with status)

2. Create Ralph loop state tracker:
   - Internal state: task_description, max_iterations, current_iteration, status, completion_file, plans_created, last_action
   - State persisted between iterations (optional: JSON file in `Logs/`)

3. Create test scenarios:
   - Low-risk multi-step task: "Read 3 inbox items, create plans, request approvals"
   - Approval-blocking scenario: Loop stops when approval pending, resumes after approval
   - Max iterations scenario: Loop stops at 10 iterations, creates summary
   - Failure scenario: MCP timeout → remediation task created

4. Create documentation:
   - `Docs/ralph_loop_usage.md` (examples, parameters, safety features)

**Files to Create**:
- `brain_ralph_loop_orchestrator_skill.py`
- `Logs/ralph_loop.log` (log file)
- `Docs/ralph_loop_usage.md`
- `tests/fixtures/ralph_loop_test_task.md` (test scenario)

**Files to Modify**:
- `Dashboard.md` (add "Ralph Loop Status" section: running/stopped/complete)

**Agent Skills Involved**:
- `brain_ralph_loop_orchestrator` (new)
- All existing skills (loop calls them)

**Approval Requirements**: Loop MUST stop when any skill requests approval. It CANNOT bypass HITL approval gates.

**Test Steps**:
1. Create low-risk test task in `Needs_Action/`
2. Run `brain_ralph_loop_orchestrator --task-description "Process all items in Needs_Action/" --max-iterations 5`
3. Verify loop reads task, creates plans, requests approvals
4. Verify loop stops when approval pending (log: "Waiting for approval")
5. Manually approve
6. Re-run loop, verify it detects approval, executes action, continues
7. Test max iterations: Run with `--max-iterations 3`, verify it stops after 3 iterations
8. Test max plans per iteration: Create scenario with 10+ items, verify loop stops at 5 plans
9. Verify logs written to `Logs/ralph_loop.log`

**Failure Simulations**:
- MCP timeout → verify remediation task created + loop moves to next step
- Critical error (server down) → verify loop exits gracefully + logs error
- Runaway loop (100 plans) → verify `--max-plans-per-iteration` prevents it

**Definition of Done**:
- [ ] Ralph loop orchestrator implemented with all safety features
- [ ] Loop stops when approval required (HITL enforced)
- [ ] Max iterations enforced (stops at 10)
- [ ] Max plans per iteration enforced (stops at 5)
- [ ] Remediation tasks created on failure
- [ ] Logs written to `Logs/ralph_loop.log`
- [ ] Manual test: Run 3-step workflow, verify stops for approval, resumes after

**Git Commit**: `feat(gold): G-M7 Ralph loop autonomous orchestrator`

**Rollback**: `git revert <commit>` (safe, loop is bounded + approval gates enforced)

---

### G-M8: End-to-End Testing + Demo Documentation

**Objective**: Validate all Gold Tier features with end-to-end tests, create demo script, completion checklist, architecture documentation, and lessons learned.

**Duration**: 6-8 hours

**Tasks** (atomic):
1. **End-to-End Testing** (18 acceptance criteria from spec):
   - AC-001: WhatsApp watcher creates intake wrappers (mock mode)
   - AC-002: LinkedIn watcher creates intake wrappers
   - AC-003: Twitter watcher creates intake wrappers
   - AC-004: LinkedIn posting via MCP (plan → approval → execute dry-run)
   - AC-005: Twitter posting/reply via MCP (dry-run)
   - AC-006: WhatsApp reply/send via MCP (dry-run)
   - AC-007: Odoo MCP queries (mock or real)
   - AC-008: Odoo MCP actions with approval (dry-run)
   - AC-009: Weekly CEO briefing (all sections)
   - AC-010: Ralph loop (low-risk task → approval → continue)
   - AC-011: Ralph loop max iterations
   - AC-012: Ralph loop remediation tasks
   - AC-013: Dashboard.md Gold sections
   - AC-014: Audit trails (no secrets in git)
   - AC-015: MCP registry refresh
   - AC-016: Graceful degradation (Twitter down → others continue)
   - AC-017: Social daily summary
   - AC-018: Scheduled tasks import successfully

2. Create `Docs/gold_demo_script.md` (10-minute demo):
   - Minute 1-2: Show vault structure (Social/, Business/, MCP/)
   - Minute 3-4: Run social watchers (mock mode), show intake wrappers
   - Minute 5-6: Create plan → request approval → execute (dry-run)
   - Minute 7-8: Generate CEO briefing, show all sections
   - Minute 9: Run Ralph loop, show autonomous execution
   - Minute 10: Show Dashboard.md Gold sections

3. Create `Docs/gold_completion_checklist.md`:
   - Maps to all 18 acceptance criteria
   - Includes test evidence (log snippets, file paths)

4. Create `Docs/architecture_gold.md`:
   - Architecture diagram (Perception → Plan → Approval → Action → Logging)
   - Component overview (4 watchers, 4 MCP servers, 16 skills)
   - Data flow diagrams (social intake → plan → approval → execution)
   - Cross-domain vault architecture

5. Create `Docs/lessons_learned_gold.md`:
   - What worked well (graceful degradation, bounded Ralph loop)
   - What was challenging (MCP server integration, rate limiting)
   - Future improvements (performance optimization, more MCP servers)

6. Run all scheduled tasks once to verify imports:
   - Import all 7 new Gold scheduled tasks
   - Run each task with `schtasks /Run /TN <task_name>`
   - Verify no errors

7. Audit git history:
   - Verify `.secrets/` never committed
   - Verify `Logs/*.log` gitignored
   - Verify MCP snapshots gitignored

8. Update main README.md:
   - Add Gold Tier status: "✅ Complete"
   - Link to Gold docs

**Files to Create**:
- `Docs/gold_demo_script.md`
- `Docs/gold_completion_checklist.md`
- `Docs/architecture_gold.md`
- `Docs/lessons_learned_gold.md`
- `tests/test_report_gold_e2e.md` (test results)

**Files to Modify**:
- `README.md` (update tier status)
- `Dashboard.md` (final polish)

**Agent Skills Involved**: All Gold skills (tested end-to-end)

**Approval Requirements**: None (testing only)

**Test Steps**:
1. Run all 18 acceptance criteria tests sequentially
2. Document results in `tests/test_report_gold_e2e.md`
3. Verify all scheduled tasks import successfully
4. Run demo script dry-run (ensure 10-minute timing)
5. Review architecture docs for accuracy
6. Audit git history: `git log --all --full-history -- .secrets/` (should be empty)

**Failure Simulations**: N/A (this milestone validates previous milestones)

**Definition of Done**:
- [ ] All 18 acceptance criteria PASS
- [ ] Demo script created (10 min, covers P1+P2 user stories)
- [ ] Completion checklist created (maps to all ACs)
- [ ] Architecture docs created (diagrams + component overview)
- [ ] Lessons learned documented
- [ ] All 7 scheduled tasks import successfully
- [ ] Git audit clean (no secrets committed)
- [ ] README.md updated: Gold Tier ✅ Complete

**Git Commit**: `feat(gold): G-M8 e2e testing + demo docs + completion`

**Rollback**: `git revert <commit>` (safe, documentation only)

---

## Git Strategy & Commit Discipline

**Branch Strategy**:
- Work on `001-gold-tier-full` branch (already created)
- One commit per milestone (G-M1 through G-M8)
- Merge to `main` after all milestones complete + reviewed

**Commit Naming Convention**:
```
feat(gold): G-M<N> <milestone-name>

Examples:
feat(gold): G-M1 vault expansion + templates
feat(gold): G-M2 MCP registry + reliability core
feat(gold): G-M3 social watchers (WhatsApp, LinkedIn, Twitter)
feat(gold): G-M4 social MCP execution layer
feat(gold): G-M5 Odoo MCP integration (query + action)
feat(gold): G-M6 weekly CEO briefing + accounting audit
feat(gold): G-M7 Ralph loop autonomous orchestrator
feat(gold): G-M8 e2e testing + demo docs + completion
```

**Commit Body Template**:
```
<milestone-objective>

Tasks completed:
- <task-1>
- <task-2>
- ...

Files created:
- <file-1>
- <file-2>
- ...

Files modified:
- <file-1>
- <file-2>

Tests passing:
- <test-1>
- <test-2>

Definition of Done:
[X] All checklist items

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Pre-Commit Checklist** (for each milestone):
- [ ] All tasks complete
- [ ] All files created/modified as specified
- [ ] Tests passing (unit + integration)
- [ ] No secrets committed (`.secrets/` check)
- [ ] Logs gitignored
- [ ] Definition of Done checklist complete

**Merge Strategy**:
- After G-M8 complete, create PR: `001-gold-tier-full` → `main`
- PR title: "Gold Tier — Multi-Channel Social + Odoo Accounting + CEO Briefing + Ralph Loop"
- PR body includes:
  - Link to spec.md
  - Link to plan.md
  - Link to gold_completion_checklist.md
  - Demo script summary
  - Test results summary (18/18 ACs passing)

---

## Critical Path Analysis

**Critical Path** (longest dependency chain):
```
G-M1 (Vault) → G-M2 (MCP Registry) → G-M3 (Social Watchers) → G-M4 (Social MCP Executor) → G-M6 (CEO Briefing) → G-M8 (E2E Testing)
```

**Parallel Opportunities** (AVOIDED per user request):
- G-M5 (Odoo) could technically run parallel to G-M3/G-M4, BUT we avoid parallelization to prevent chaos
- G-M7 (Ralph Loop) could run parallel to G-M6, BUT we avoid parallelization

**Total Estimated Duration**:
- G-M1: 2-3 hours
- G-M2: 4-5 hours
- G-M3: 8-10 hours
- G-M4: 6-8 hours
- G-M5: 6-8 hours
- G-M6: 5-6 hours
- G-M7: 6-8 hours
- G-M8: 6-8 hours

**Total**: 43-56 hours (optimistic: 43h, realistic: 50h, pessimistic: 56h)

**Critical Path Duration**: 37-48 hours (G-M1 + G-M2 + G-M3 + G-M4 + G-M6 + G-M8)

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| **MCP Server Unavailability**: WhatsApp/LinkedIn/Twitter/Odoo MCP servers not available | HIGH | Use mock mode + fixture testing for all watchers/executors. Document MCP tool contracts. Graceful degradation ensures system continues without one server. |
| **API Rate Limits**: LinkedIn/Twitter APIs hit rate limits during testing | MEDIUM | Implement `rate_limit_and_backoff` helper (G-M2). Use mock mode for most testing. Document rate limits in setup docs. |
| **Odoo Setup Complexity**: Local Odoo installation difficult on WSL2 | MEDIUM | Provide detailed setup docs (G-M5). Use Docker for Odoo if needed. Mock mode allows testing without real Odoo. |
| **Ralph Loop Runaway**: Loop creates 100+ plans, exhausts resources | LOW | Bounded iterations (`--max-iterations 10`). Max plans per iteration (5). Timeout per iteration (5 min). |
| **Approval Gate Bypass**: Bug allows execution without approval | HIGH | Extensive testing (AC-004, AC-006, AC-008). Code review required. File-based approvals cannot be bypassed (OS-enforced). |
| **PII Leakage**: Sensitive data (emails, phones) appears in logs | HIGH | PII redaction in `mcp_helpers.py` (G-M2). Unit tests for all regex patterns. Manual audit of all logs before commit. |
| **Schedule Task Failure**: Windows Task Scheduler tasks fail to run | MEDIUM | Test all 7 tasks in G-M8. Provide import instructions. Log errors to `Logs/scheduler.log`. |
| **Disk Space Exhaustion**: 1000+ intake wrappers fill disk | LOW | Disk space check in `mcp_helpers.py`. Remediation task created when <100MB free. |

---

## Phase 0: Research (SKIPPED - No NEEDS CLARIFICATION)

**Research Status**: ✅ COMPLETE (all technical context known from Silver Tier)

All technology choices resolved:
- ✅ Python 3.10+ (Silver baseline)
- ✅ BaseWatcher pattern (Silver baseline)
- ✅ Plan-first workflow (Silver baseline)
- ✅ File-based HITL approvals (Silver baseline)
- ✅ MCP tool abstraction (Silver baseline)
- ✅ Windows Task Scheduler (Silver baseline)
- ✅ JSON-RPC for Odoo (industry standard)
- ✅ OAuth2 for LinkedIn/Twitter (industry standard)

No research.md required.

---

## Phase 1: Design & Contracts

### Data Model

See `specs/001-gold-tier-full/data-model.md` (to be created during implementation):

**Entities**:
1. **Social Intake Wrapper** (markdown + YAML)
2. **CEO Briefing Report** (markdown)
3. **MCP Tool Snapshot** (JSON)
4. **Ralph Loop Task** (internal state)
5. **Remediation Task** (markdown)

(Details in spec.md, section "Key Entities")

### API Contracts

See `specs/001-gold-tier-full/contracts/` (to be created in G-M4 and G-M5):
- `mcp_whatsapp.yaml` (WhatsApp MCP tool contract)
- `mcp_linkedin.yaml` (LinkedIn MCP tool contract)
- `mcp_twitter.yaml` (Twitter MCP tool contract)
- `mcp_odoo.yaml` (Odoo MCP tool contract with JSON-RPC examples)

### Quickstart

See `specs/001-gold-tier-full/quickstart.md` (to be created after G-M8):

**Quick Setup**:
1. Complete Silver Tier setup (prerequisite)
2. Create vault structure (G-M1)
3. Configure MCP servers (G-M4, G-M5)
4. Import scheduled tasks (G-M3, G-M6)
5. Run demo script (G-M8)

---

## Next Steps

**First Milestone to Implement**: G-M1 (Vault + Domain Expansion)

**Estimated Time**: 2-3 hours

**Command to Start**:
```bash
# Ensure on correct branch
git checkout 001-gold-tier-full

# Begin G-M1 implementation
# (Create directories, templates, update .gitignore, update Dashboard.md)
```

**Ready for**: `/sp.tasks` to generate detailed task breakdown for G-M1

---

## Summary

**Total Estimated Hours**: 43-56 hours (realistic: 50h)

**Critical Path**: G-M1 → G-M2 → G-M3 → G-M4 → G-M6 → G-M8 (37-48h)

**First Milestone**: G-M1 (Vault + Domain Expansion, 2-3h)

**Confirmation**: ✅ Plan complete and ready for `/sp.tasks` command to generate task breakdown.

---

**End of Implementation Plan**
