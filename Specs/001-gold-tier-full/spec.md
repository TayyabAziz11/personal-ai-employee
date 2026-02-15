# Feature Specification: Gold Tier — Full Multi-Channel & Accounting Integration (No UI)

**Feature Branch**: `001-gold-tier-full`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Gold Tier — Full Implementation Spec (Phase 1 + Phase 2 Combined): WhatsApp + LinkedIn + Twitter/X + Odoo MCP + Weekly CEO Briefing + Reliability (No UI)"

**Baseline**: Silver Tier complete (Gmail watcher, plan-first workflow, HITL approvals, real Gmail API execution, scheduling, logging, daily summaries)

**Goal**: Implement complete Gold Tier with multi-channel social operations, Odoo accounting integration, weekly CEO briefings, and autonomous multi-step execution — all backend-focused, no UI components.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Channel Social Presence Management (Priority: P1)

As a business owner, I need my AI Employee to monitor and manage my social media presence across WhatsApp Business, LinkedIn, and Twitter/X, so that I can maintain consistent engagement without manual monitoring of multiple platforms.

**Why this priority**: Social media engagement is critical for modern business growth. Missing client inquiries on WhatsApp or failing to respond to LinkedIn comments can damage relationships and lose revenue. This is P1 because it directly impacts revenue generation and client satisfaction.

**Independent Test**: Can be fully tested by deploying one social channel watcher (e.g., LinkedIn), creating a test notification, verifying intake wrapper creation, generating a plan, approving it, and confirming the action execution via MCP. Delivers immediate value by automating social monitoring.

**Acceptance Scenarios**:

1. **Given** WhatsApp watcher is running with `--mock` flag, **When** a mock message arrives with keyword "pricing", **Then** an intake wrapper is created in `Social/Inbox/` with YAML frontmatter (source, sender, thread_id, excerpt, pii_redacted:true) and status is `needs_action`
2. **Given** LinkedIn watcher is running with API credentials, **When** a new comment appears on my post, **Then** an intake wrapper is created with LinkedIn-specific metadata and an entry is logged to `Logs/linkedin_watcher.log`
3. **Given** Twitter watcher is running, **When** a mention is detected, **Then** an intake wrapper is created with handle, thread_id, and excerpt (280 chars max), and PII is redacted
4. **Given** an intake wrapper exists for WhatsApp reply, **When** brain_create_plan is invoked, **Then** a plan is generated specifying `whatsapp.reply_message` MCP tool with approval gate
5. **Given** a social plan is approved, **When** brain_execute_social_with_mcp runs with `--execute`, **Then** the WhatsApp/LinkedIn/Twitter action is executed via MCP and logged to `Logs/mcp_actions.log` with full audit trail

---

### User Story 2 - Automated Accounting Integration with Odoo (Priority: P1)

As a business owner, I need my AI Employee to integrate with my local Odoo accounting system to track invoices, payments, and financial health, so that I have real-time visibility into accounts receivable and can generate automated financial reports.

**Why this priority**: Financial health monitoring is mission-critical. Late invoice follow-ups directly impact cash flow. AR aging visibility enables proactive collections. This is P1 because it automates the most time-consuming business admin tasks and prevents revenue leakage.

**Independent Test**: Can be fully tested by deploying Odoo Community locally, configuring MCP server with JSON-RPC credentials, creating a test invoice via MCP query, verifying it appears in Odoo, then creating a plan to post the invoice and confirming approval flow works. Delivers value by automating accounting workflows.

**Acceptance Scenarios**:

1. **Given** Odoo MCP server is configured with `.secrets/odoo_credentials.json`, **When** brain_mcp_registry_refresh runs, **Then** a snapshot `Logs/mcp_tools_snapshot_odoo.json` is created listing all available Odoo tools (query + action)
2. **Given** Odoo watcher is running (optional), **When** an overdue invoice is detected via `odoo.list_unpaid_invoices`, **Then** an intake wrapper is created in `Business/Accounting/` with invoice number, amount, days overdue
3. **Given** a plan to create an invoice exists, **When** brain_request_approval is invoked, **Then** an ACTION file is created in `Pending_Approval/` with invoice details (customer, line items, total)
4. **Given** an invoice creation plan is approved, **When** brain_execute_odoo_with_mcp runs with `--execute`, **Then** `odoo.create_invoice` and `odoo.post_invoice` are called via JSON-RPC and logged with full parameters
5. **Given** Odoo connection fails, **When** brain_handle_mcp_failure is invoked, **Then** a remediation task is created in `Needs_Action/`, the error is logged with retry count, and other systems continue operating

---

### User Story 3 - Weekly CEO Briefing with Business + Accounting Metrics (Priority: P2)

As a business owner, I need an automated weekly business briefing that synthesizes task completion, social performance, and accounting health into one executive summary, so that I can make informed strategic decisions without manually compiling reports.

**Why this priority**: Strategic visibility enables better decision-making. The CEO briefing is the "proof of value" for the AI Employee — it demonstrates cross-domain intelligence. This is P2 because it builds on P1 data sources but isn't blocking for core operations.

**Independent Test**: Can be fully tested by manually creating sample data (goals, social summaries, Odoo queries), running brain_generate_weekly_ceo_briefing, and verifying the output includes KPIs, wins, risks, AR aging, social performance, and next week priorities. Delivers value as an executive dashboard replacement.

**Acceptance Scenarios**:

1. **Given** it is Sunday night 11:59 PM, **When** scheduled task `weekly_ceo_briefing` runs, **Then** brain_generate_weekly_ceo_briefing reads `Business/Goals/*`, `system_log.md`, `Social/Analytics/*`, and queries Odoo via MCP
2. **Given** CEO briefing generation runs, **When** data sources are read, **Then** a markdown report is written to `Business/Briefings/YYYY-MM-DD_Monday_Briefing.md` with sections: KPIs, Wins, Risks, Outstanding Invoices + AR Aging, Social Performance, Next Week Priorities, Pending Approvals
3. **Given** the briefing is generated, **When** Dashboard.md is updated, **Then** a link to the latest briefing appears in the "Latest CEO Briefing" section
4. **Given** Odoo MCP queries are made during briefing generation, **When** `odoo.revenue_summary` and `odoo.ar_aging_summary` are called, **Then** results are embedded in the "Outstanding Invoices + AR Aging" section
5. **Given** social summaries exist in `Social/Summaries/`, **When** briefing generation reads them, **Then** top-performing posts and engagement metrics appear in the "Social Performance" section

---

### User Story 4 - Autonomous Multi-Step Task Completion (Ralph Loop) (Priority: P2)

As a user, I need my AI Employee to autonomously work through multi-step tasks without requiring constant prompting, while still respecting approval gates and stopping when human input is needed, so that I can delegate complex workflows end-to-end.

**Why this priority**: True autonomy is what elevates the AI from "assistant" to "employee". The Ralph loop enables delegating entire workflows (e.g., "monitor WhatsApp, respond to pricing questions, update CRM") rather than single actions. This is P2 because it enhances existing P1 capabilities but isn't required for basic operation.

**Independent Test**: Can be fully tested by creating a low-risk multi-step task (e.g., "read 3 inbox items, create plans, request approvals"), running brain_ralph_loop_orchestrator with max 5 iterations, verifying it stops when approvals are pending, and confirming it resumes after approval. Delivers value by eliminating the need for repeated prompting.

**Acceptance Scenarios**:

1. **Given** a multi-step task "Process all items in Needs_Action/" exists, **When** brain_ralph_loop_orchestrator starts with `--max-iterations 10`, **Then** it reads the task, begins execution, and logs each iteration to `Logs/ralph_loop.log`
2. **Given** the Ralph loop creates a plan requiring approval, **When** brain_request_approval is invoked, **Then** the loop stops, logs "Waiting for approval", and exits gracefully (no infinite loop)
3. **Given** the user approves the plan, **When** the Ralph loop is manually resumed or re-triggered, **Then** it detects the approval, executes the action, and continues to the next step
4. **Given** a step fails (e.g., MCP timeout), **When** brain_handle_mcp_failure is invoked, **Then** a remediation task is created, the failure is logged, and the loop moves to the next safe step (does not retry infinitely)
5. **Given** max iterations (10) is reached, **When** the loop completes 10 iterations, **Then** it logs "Max iterations reached", creates a summary file in `Done/`, and exits (bounded execution)

---

### User Story 5 - Reliable Operations with Graceful Degradation (Priority: P3)

As a user, I need my AI Employee to continue operating when one MCP server is down, with clear error handling and remediation task creation, so that a failure in one channel (e.g., Twitter API) doesn't block email or accounting operations.

**Why this priority**: Reliability is essential for production systems. Graceful degradation ensures the AI remains useful even when external services fail. This is P3 because it enhances robustness but isn't required for initial functionality.

**Independent Test**: Can be fully tested by intentionally disabling one MCP server (e.g., Twitter), running a multi-channel workflow, verifying that LinkedIn and WhatsApp watchers continue operating, and confirming a remediation task is created for the failed Twitter connection. Delivers value by preventing single points of failure.

**Acceptance Scenarios**:

1. **Given** LinkedIn MCP server is unreachable, **When** brain_execute_social_with_mcp attempts to call it, **Then** brain_handle_mcp_failure is invoked, a remediation task is created in `Needs_Action/`, and the error is logged with retry count
2. **Given** Odoo MCP server is down, **When** weekly CEO briefing generation attempts to query it, **Then** the briefing is generated with a note "Odoo metrics unavailable (server unreachable)", and other sections are populated normally
3. **Given** rate limit is hit on Twitter API, **When** brain_rate_limit_and_backoff detects HTTP 429, **Then** exponential backoff is applied (wait 2s, 4s, 8s), the action is retried, and backoff details are logged
4. **Given** MCP registry refresh fails for one server, **When** brain_mcp_registry_refresh runs, **Then** snapshots are created for available servers, the failed server is logged, and a warning is added to Dashboard.md ("MCP Registry Status: LinkedIn ✅, Twitter ❌")
5. **Given** multiple failures occur (e.g., 3 servers down), **When** Dashboard.md is updated, **Then** the system health status changes to "Degraded" and an alert is created in `Needs_Action/`

---

### Edge Cases

- **What happens when multiple social channels receive messages simultaneously?** Each watcher operates independently and creates separate intake wrappers. The Ralph loop (if running) processes them sequentially based on file creation time. No collisions occur because each wrapper has a unique ID.

- **What happens when Odoo JSON-RPC authentication fails mid-session?** brain_handle_mcp_failure detects the 401/403 error, logs "Odoo auth failure", creates a remediation task ("Refresh Odoo credentials"), and continues with other operations. The weekly briefing includes a note: "Odoo metrics unavailable (auth failed)".

- **What happens when a user approves a plan but the MCP server goes down before execution?** brain_execute_social_with_mcp detects the failure, logs it, moves the plan to `Plans/failed/`, and creates a remediation task. The plan status is updated to `Failed` with a retry option.

- **What happens when the Ralph loop creates 100 plans in one iteration (runaway loop)?** The `--max-iterations` parameter bounds total iterations. Additionally, a `--max-plans-per-iteration` parameter (default 5) prevents plan creation storms. If exceeded, the loop logs "Plan creation limit reached" and exits.

- **What happens when PII (phone numbers, emails) appears in social intake wrappers?** All watchers apply `_redact_pii()` during intake wrapper creation. Emails → `<REDACTED_EMAIL>`, phones → `<REDACTED_PHONE>`. The original message is never stored; only the redacted excerpt is persisted.

- **What happens when Odoo has 10,000 unpaid invoices and the query times out?** The MCP query includes pagination (e.g., `limit=100, offset=0`). The watcher logs "Large result set detected", creates a summary intake wrapper ("100 invoices retrieved, 9900+ remaining"), and the user can adjust the query or filter by date range.

- **What happens when a scheduled task (e.g., Twitter watcher) crashes?** `scheduler_runner.py` catches exceptions, logs the error to `Logs/scheduler.log`, prevents crash loops, and continues. The next scheduled run attempts again. Dashboard.md shows "Last run: Failed" with a link to the log.

- **What happens when the vault storage is full?** Watchers check disk space before creating files. If <100MB free, they log "Low disk space" and skip file creation. A remediation task is created: "Clean up old logs/summaries". The system continues operating but stops creating new files.

---

## Requirements *(mandatory)*

### Functional Requirements

#### 1. Cross-Domain Vault Structure

- **FR-001**: System MUST extend the Silver Tier vault structure without breaking existing paths (`Needs_Action/`, `Pending_Approval/`, `Approved/`, `Rejected/`, `Plans/`, `Logs/`, `Daily_Summaries/`)
- **FR-002**: System MUST create new cross-domain directories:
  - `Social/Inbox/` — Intake wrappers for WhatsApp/LinkedIn/Twitter
  - `Social/Summaries/` — Daily/weekly social engagement reports
  - `Social/Analytics/` — Aggregated metrics (engagement rate, top posts)
  - `Business/Goals/` — Strategic objectives and KPIs
  - `Business/Briefings/` — Weekly CEO briefing reports
  - `Business/Accounting/` — Odoo-related intake wrappers (optional)
  - `Business/Clients/` — Client metadata (if needed)
  - `Business/Invoices/` — Invoice tracking (if needed)
  - `MCP/` — MCP registry snapshots and server notes
- **FR-003**: System MUST use strict naming conventions for all intake wrappers:
  - WhatsApp: `inbox__whatsapp__YYYYMMDD-HHMM__<sender_or_thread_id>.md`
  - LinkedIn: `inbox__linkedin__YYYYMMDD-HHMM__<sender_or_thread_id>.md`
  - Twitter: `inbox__twitter__YYYYMMDD-HHMM__<handle_or_thread_id>.md`
  - Odoo (if watcher-based): `inbox__odoo__YYYYMMDD-HHMM__<object>.md`
- **FR-004**: System MUST define YAML frontmatter schema for each source with mandatory fields:
  - `id` (unique identifier)
  - `source` (whatsapp|linkedin|twitter|odoo)
  - `received_at` (ISO 8601 timestamp UTC)
  - `sender` or `handle` (sender identifier)
  - `channel` (personal|business|group for WhatsApp; post|comment|dm for LinkedIn/Twitter)
  - `thread_id` (conversation/thread identifier)
  - `excerpt` (first 200 chars, PII-redacted)
  - `status` (needs_action|planned|approved|executed|failed)
  - `plan_required` (true|false)
  - `pii_redacted` (always true)

#### 2. Perception Layer — 4 New Watchers

- **FR-005**: System MUST implement `whatsapp_watcher_skill.py` following the BaseWatcher pattern with:
  - CLI flags: `--once`, `--dry-run`, `--mock` (fixture-based testing)
  - Creates intake wrappers in `Social/Inbox/`
  - Redacts PII (phone numbers in sender field)
  - Logs to `Logs/whatsapp_watcher.log` + appends to `system_log.md`
  - NEVER executes actions (perception-only)
  - NEVER calls action MCP tools (may call query tools if specified)

- **FR-006**: System MUST implement `linkedin_watcher_skill.py` with:
  - Same CLI flags as FR-005
  - Detects new notifications via LinkedIn API (if available) or scraping (if approved)
  - Creates intake wrappers for posts, comments, messages
  - Logs to `Logs/linkedin_watcher.log`
  - Perception-only (no posting/replying)

- **FR-007**: System MUST implement `twitter_watcher_skill.py` with:
  - Same CLI flags as FR-005
  - Searches for mentions, DMs, and keywords via Twitter API v2
  - Creates intake wrappers with handle, excerpt (280 chars max)
  - Logs to `Logs/twitter_watcher.log`
  - Perception-only (no tweeting/replying)

- **FR-008**: System MAY implement `odoo_watcher_skill.py` (optional but recommended) with:
  - Queries Odoo via MCP for unpaid invoices, overdue payments
  - Creates intake wrappers in `Business/Accounting/` (or `Needs_Action/`)
  - Logs to `Logs/odoo_watcher.log`
  - Query-only (no invoice creation/posting)

- **FR-009**: All watchers MUST support checkpoint-based processing to prevent duplicate intake wrappers (checkpoint file: `Logs/<watcher>_checkpoint.json`)

#### 3. MCP Servers — Multi-Server Architecture

- **FR-010**: System MUST define and document 4 MCP servers with tool contracts:
  - **mcp-whatsapp**
  - **mcp-linkedin**
  - **mcp-twitter**
  - **mcp-odoo** (Odoo 19+ JSON-RPC)

- **FR-011**: **mcp-whatsapp** MUST provide minimum tools:
  - `whatsapp.send_message(to, body)` — ACTION, approval required
  - `whatsapp.reply_message(thread_id, body)` — ACTION, approval required
  - `whatsapp.list_messages(limit, since)` — QUERY, no approval
  - `whatsapp.get_message(message_id)` — QUERY, no approval
  - Optional: `whatsapp.broadcast_message(to_list, body)` — ACTION, approval required

- **FR-012**: **mcp-linkedin** MUST provide minimum tools:
  - `linkedin.create_post(text, media_urls)` — ACTION, approval required
  - `linkedin.reply_comment(comment_id, text)` — ACTION, approval required
  - `linkedin.send_message(recipient_id, text)` — ACTION, approval required
  - `linkedin.list_notifications(limit)` — QUERY, no approval
  - `linkedin.get_post_analytics(post_id)` — QUERY, no approval
  - Optional: `linkedin.schedule_post(text, scheduled_time)` — ACTION, approval required

- **FR-013**: **mcp-twitter** MUST provide minimum tools:
  - `twitter.create_post(text, media_urls)` — ACTION, approval required (tweet)
  - `twitter.reply_post(tweet_id, text)` — ACTION, approval required
  - `twitter.send_dm(user_id, text)` — ACTION, approval required
  - `twitter.search_mentions(limit, since)` — QUERY, no approval
  - `twitter.get_post_metrics(tweet_id)` — QUERY, no approval
  - Optional: `twitter.schedule_post(text, scheduled_time)` — ACTION, approval required

- **FR-014**: **mcp-odoo** MUST provide minimum tools (Odoo 19+ JSON-RPC):
  - **QUERY tools** (no approval):
    - `odoo.list_unpaid_invoices(limit, customer_id)`
    - `odoo.get_invoice(invoice_id)`
    - `odoo.get_customer(customer_id)`
    - `odoo.revenue_summary(start_date, end_date)`
    - `odoo.ar_aging_summary()`
  - **ACTION tools** (approval required):
    - `odoo.create_customer(name, email, address)`
    - `odoo.create_invoice(customer_id, line_items)`
    - `odoo.post_invoice(invoice_id)`
    - `odoo.register_payment(invoice_id, amount, payment_date)`
    - `odoo.create_credit_note(invoice_id, reason)`

- **FR-015**: System MUST document Odoo JSON-RPC patterns in `Docs/mcp_odoo_setup.md`:
  - Base URL: `http://localhost:8069` (local Odoo instance)
  - Database name, username, API token (stored in `.secrets/odoo_credentials.json`)
  - Authentication: `xmlrpc/2/common` endpoint for uid + auth
  - Method calls: `xmlrpc/2/object` endpoint with `execute_kw(model, method, args)`
  - Example model/method: `account.move` (invoices), `res.partner` (customers)

- **FR-016**: System MUST store all MCP credentials in `.secrets/` directory (gitignored):
  - `.secrets/whatsapp_credentials.json`
  - `.secrets/linkedin_credentials.json`
  - `.secrets/twitter_credentials.json`
  - `.secrets/odoo_credentials.json`
  - `.secrets/gmail_credentials.json` (Silver, already exists)

- **FR-017**: System MUST implement MCP tool discovery and snapshot caching:
  - brain_mcp_registry_refresh skill queries each MCP server for available tools
  - Snapshots saved to `Logs/mcp_tools_snapshot_<server>.json` (gitignored)
  - Example snapshot included in `Docs/mcp_tools_snapshot_example.json` (committed)
  - Refresh runs daily via scheduled task

#### 4. Gold Agent Skills — All New Functionality as Skills

##### Perception Skills
- **FR-018**: Implement `whatsapp_watcher` skill (skill file: `whatsapp_watcher_skill.py`)
- **FR-019**: Implement `linkedin_watcher` skill (skill file: `linkedin_watcher_skill.py`)
- **FR-020**: Implement `twitter_watcher` skill (skill file: `twitter_watcher_skill.py`)
- **FR-021**: Implement `odoo_watcher` skill (skill file: `odoo_watcher_skill.py`, optional)

##### Planning + Approvals Skills (Extend Silver)
- **FR-022**: Extend `brain_create_plan` skill to support social + accounting operations:
  - Detect social actions (whatsapp.send_message, linkedin.create_post, twitter.create_post)
  - Detect accounting actions (odoo.create_invoice, odoo.post_invoice)
  - Generate plans with appropriate MCP tool references
- **FR-023**: Reuse `brain_request_approval` skill (no changes needed; already supports arbitrary MCP tools)
- **FR-024**: Reuse `brain_monitor_approvals` skill (no changes needed)
- **FR-025**: Extend `brain_archive_plan` skill to handle social/accounting plan archival

##### Execution Skills (MCP Action Layer)
- **FR-026**: Implement `brain_execute_social_with_mcp` skill (skill file: `brain_execute_social_with_mcp_skill.py`):
  - Supports LinkedIn, Twitter, WhatsApp actions
  - Dry-run default (`--dry-run` mode shows preview)
  - Explicit `--execute` flag required for real actions
  - Logs to `Logs/mcp_actions.log` (JSON format)
  - Updates plan status: `Approved` → `Executed` (or `Failed`)

- **FR-027**: Implement `brain_execute_odoo_with_mcp` skill (skill file: `brain_execute_odoo_with_mcp_skill.py`):
  - Supports Odoo accounting actions
  - Dry-run default
  - Explicit `--execute` flag required
  - Approval required for all ACTION tools
  - JSON-RPC error handling (401/403 auth failures, 500 server errors)

- **FR-028**: Reuse `brain_email_query_with_mcp` skill (Silver, no changes)

##### Reliability + Governance Skills
- **FR-029**: Implement `brain_mcp_registry_refresh` skill (skill file: `brain_mcp_registry_refresh_skill.py`):
  - Queries all configured MCP servers for tool lists
  - Saves snapshots to `Logs/mcp_tools_snapshot_<server>.json`
  - Updates Dashboard.md with "MCP Registry Status" table (per server: reachable/unreachable)
  - Runs daily via scheduled task

- **FR-030**: Implement `brain_handle_mcp_failure` skill (skill file: `brain_handle_mcp_failure_skill.py`):
  - Standard failure contract:
    - Log error with server name, tool, operation, error type, retry count
    - Create remediation task in `Needs_Action/` with troubleshooting steps
    - Update Dashboard.md with warning banner (if critical)
  - Graceful degradation: continue with other operations
  - Failure types: connection timeout, auth failure, rate limit, server error

- **FR-031**: Implement `brain_rate_limit_and_backoff` helper (shared module: `mcp_helpers.py`):
  - Detects HTTP 429 (rate limit) responses from MCP servers
  - Applies exponential backoff: wait 2s, 4s, 8s, 16s (max 4 retries)
  - Logs backoff details to `Logs/mcp_actions.log`
  - Returns retry result or failure

##### Reporting Skills
- **FR-032**: Implement `brain_social_generate_summary` skill (skill file: `brain_social_generate_summary_skill.py`):
  - Aggregates social intake wrappers from `Social/Inbox/` (daily or weekly)
  - Queries LinkedIn/Twitter analytics via MCP (if available)
  - Generates `Social/Summaries/YYYY-MM-DD_daily.md` or `YYYY-MM-DD_weekly.md`
  - Includes: message count per channel, top conversations, engagement metrics
  - Links to intake wrappers

- **FR-033**: Implement `brain_generate_weekly_ceo_briefing` skill (skill file: `brain_generate_weekly_ceo_briefing_skill.py`):
  - Reads data sources:
    - `Business/Goals/*` (strategic objectives)
    - `system_log.md` (activity log)
    - Task completions from `Done/` (weekly count)
    - `Social/Analytics/*` (social performance)
    - Odoo MCP queries: `odoo.revenue_summary`, `odoo.ar_aging_summary`, `odoo.list_unpaid_invoices`
  - Writes `Business/Briefings/YYYY-MM-DD_Monday_Briefing.md`
  - Sections:
    - KPIs (tasks completed, emails sent, invoices created)
    - Wins (top achievements, revenue milestones)
    - Risks (overdue invoices, failed actions, degraded services)
    - Outstanding Invoices + AR Aging (from Odoo)
    - Social Performance (best posts, engagement trends)
    - Next Week Priorities (from `Business/Goals/`)
    - Pending Approvals (count + links)

- **FR-034**: Implement `brain_generate_accounting_audit` skill (skill file: `brain_generate_accounting_audit_skill.py`, optional):
  - Queries Odoo for detailed metrics
  - Generates `Business/Accounting/YYYY-MM-DD_audit.md`
  - Includes: revenue breakdown, expense summary, AR aging, late fees

##### Autonomy Skills
- **FR-035**: Implement `brain_ralph_loop_orchestrator` skill (skill file: `brain_ralph_loop_orchestrator_skill.py`):
  - Safe multi-step loop with parameters:
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

- **FR-036**: Each Gold skill MUST define:
  - **Trigger**: When the skill is invoked (scheduled, manual, loop-driven)
  - **Inputs**: Files + CLI parameters
  - **Output files**: Where results are written
  - **Approval gates**: Which operations require approval
  - **Logging fields**: What gets logged to `system_log.md` and JSON logs
  - **Failure modes**: What errors can occur + rollback strategy
  - **Definition of Done**: How to verify success

#### 5. Scheduling — Gold Automation

- **FR-037**: System MUST provide XML templates for Windows Task Scheduler (or cron equivalents):
  - `Scheduled/whatsapp_watcher_task.xml` — Every 5 minutes
  - `Scheduled/linkedin_watcher_task.xml` — Every 10 minutes
  - `Scheduled/twitter_watcher_task.xml` — Every 10 minutes
  - `Scheduled/odoo_watcher_task.xml` — Daily or hourly (configurable)
  - `Scheduled/mcp_registry_refresh_task.xml` — Daily at 2 AM UTC
  - `Scheduled/social_daily_summary_task.xml` — Daily at 11 PM UTC
  - `Scheduled/weekly_ceo_briefing_task.xml` — Weekly on Sunday at 11:59 PM UTC

- **FR-038**: All scheduled tasks MUST use `scheduler_runner.py` wrapper (Silver, already exists)

- **FR-039**: System MUST provide setup instructions in `Docs/gold_scheduled_tasks_setup.md` with:
  - Import steps for each XML task
  - Parameter customization (intervals, time zones)
  - Verification commands (check task status)

#### 6. Dashboard Updates — Gold Extensions

- **FR-040**: Dashboard.md MUST add new sections:
  - **Social Channel Status** table with columns: Channel, Watcher Status, Last Check, Intake Count (24h), MCP Server Status
  - **Accounting Status** table with columns: Odoo Connection, Unpaid Invoices Count, AR Aging (30/60/90), Last Refresh
  - **Pending Approvals** count (social + accounting), with links
  - **Last External Action** table: Tool, Operation, Status, Timestamp
  - **MCP Registry Status** table: Server, Reachable (✅/❌), Tool Count, Last Refresh
  - **Latest Social Summary** link
  - **Latest CEO Briefing** link

- **FR-041**: Dashboard.md MUST preserve Silver sections:
  - System status (Operational/Degraded/Critical)
  - Email Operations (Gmail watcher, last check)
  - Approval Pipeline (pending count)
  - Recent Activity (last 5 entries from system_log.md)
  - Daily Summary link

#### 7. Weekly Business + Accounting Audit + CEO Briefing

- **FR-042**: CEO Briefing format MUST include sections (in `Business/Briefings/YYYY-MM-DD_Monday_Briefing.md`):
  - **Header**: Date range (Monday–Sunday), generated timestamp
  - **KPIs**: Tasks completed, emails sent, social posts made, invoices created/posted, revenue (from Odoo)
  - **Wins**: Top 3 achievements (auto-detected: revenue milestones, high-engagement posts, on-time invoice payments)
  - **Risks**: Top 3 risks (overdue invoices, failed MCP actions, degraded services, low social engagement)
  - **Outstanding Invoices + AR Aging**: Odoo query results (total unpaid, aging buckets: 0-30, 31-60, 61-90, 90+)
  - **Social Performance**: Best posts (LinkedIn/Twitter by engagement), total impressions, engagement rate
  - **Next Week Priorities**: From `Business/Goals/` (upcoming milestones, strategic initiatives)
  - **Pending Approvals**: Count + links to `Pending_Approval/` items (social + accounting)

- **FR-043**: CEO Briefing data sources:
  - `Business/Goals/*.md` — Strategic objectives
  - `system_log.md` — Activity audit trail
  - `Done/*.md` — Task completions (count + examples)
  - `Social/Analytics/*.md` — Social metrics (generated by brain_social_generate_summary)
  - Odoo MCP queries:
    - `odoo.revenue_summary(start_date=last_monday, end_date=last_sunday)`
    - `odoo.ar_aging_summary()`
    - `odoo.list_unpaid_invoices(limit=100)`

- **FR-044**: CEO Briefing MUST handle missing data gracefully:
  - If Odoo unreachable: "Odoo metrics unavailable (server unreachable at [timestamp])"
  - If no social summaries: "No social activity this week"
  - If no goals defined: "No strategic goals configured. Add to Business/Goals/"

#### 8. Security + Compliance

- **FR-045**: `.secrets/` directory MUST be gitignored (already configured in Silver)
- **FR-046**: All watchers and executors MUST apply PII redaction:
  - Email addresses → `<REDACTED_EMAIL>`
  - Phone numbers → `<REDACTED_PHONE>`
  - Regex patterns: `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b` (email), `\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b` (US phone)

- **FR-047**: Approval gates MUST be mandatory for ALL side-effect actions:
  - Social: whatsapp.send_message, linkedin.create_post, twitter.create_post, etc.
  - Accounting: odoo.create_invoice, odoo.post_invoice, odoo.register_payment, etc.
  - Email: gmail.send_email (Silver, already implemented)

- **FR-048**: Executors MUST default to dry-run mode:
  - `brain_execute_social_with_mcp` defaults to `--dry-run`
  - `brain_execute_odoo_with_mcp` defaults to `--dry-run`
  - `--execute` flag required for real actions (no shortcuts)

- **FR-049**: System MUST implement rate limiting + backoff:
  - brain_rate_limit_and_backoff helper detects HTTP 429
  - Exponential backoff: 2s, 4s, 8s, 16s (max 4 retries)
  - Logs backoff details to `Logs/mcp_actions.log`

- **FR-050**: System MUST implement token rotation/expiry handling:
  - Document token refresh patterns in `Docs/mcp_*_setup.md`
  - Example: LinkedIn OAuth2 tokens expire after 60 days → refresh flow required
  - Watchers/executors log "Token expiry detected" and create remediation task

- **FR-051**: System MUST implement graceful degradation:
  - If one MCP server down → log, create remediation task, continue with other systems
  - If Odoo down → CEO briefing generated with note, social operations unaffected
  - If Twitter down → WhatsApp and LinkedIn continue operating
  - Dashboard.md shows per-server status (reachable/unreachable)

- **FR-052**: System MUST NOT store raw message bodies unnecessarily:
  - Intake wrappers store excerpts only (first 200 chars, PII-redacted)
  - Full message retrieval requires explicit user opt-in (e.g., `--store-full-body` flag)
  - Full bodies stored in `Social/Inbox/full_bodies/` (gitignored)

#### 9. Acceptance Criteria — Gold Completion Checklist

- **AC-001**: WhatsApp watcher creates intake wrappers (mock mode with fixture) with correct YAML frontmatter and PII redaction
- **AC-002**: LinkedIn watcher creates intake wrappers (mock or real API) with LinkedIn-specific metadata
- **AC-003**: Twitter watcher creates intake wrappers (mock or real API) with Twitter-specific metadata
- **AC-004**: LinkedIn posting via MCP works end-to-end: intake → plan → approval → execute (dry-run verified, execute optional)
- **AC-005**: Twitter posting/reply via MCP works end-to-end (dry-run verified)
- **AC-006**: WhatsApp reply/send via MCP works end-to-end (dry-run verified)
- **AC-007**: Odoo MCP queries work: `odoo.list_unpaid_invoices`, `odoo.revenue_summary` (with mock Odoo or real local instance)
- **AC-008**: Odoo MCP actions work with approval: `odoo.create_invoice`, `odoo.post_invoice` (dry-run verified)
- **AC-009**: Weekly CEO briefing generator works with at least one Odoo query + one social summary input (generates all sections)
- **AC-010**: Ralph loop can pick a low-risk task, generate plan, request approval, stop correctly when approval pending, and continue after approval
- **AC-011**: Ralph loop respects max iterations (stops at 10) and max plans per iteration (stops at 5)
- **AC-012**: Ralph loop creates remediation tasks on failure (MCP timeout, auth failure)
- **AC-013**: Dashboard.md shows Gold sections: Social Channel Status, Accounting Status, MCP Registry Status, Latest CEO Briefing
- **AC-014**: All logs show full audit trails (JSON + Markdown) with no secrets committed to git
- **AC-015**: MCP registry refresh creates snapshots for all servers and updates Dashboard.md
- **AC-016**: Graceful degradation: If Twitter MCP down, LinkedIn and WhatsApp continue, and Dashboard shows degraded status
- **AC-017**: Social daily summary generates correctly from `Social/Inbox/` intake wrappers
- **AC-018**: All scheduled tasks (7 new tasks) import successfully and run without errors

### Key Entities *(data model)*

- **Social Intake Wrapper** (markdown file with YAML frontmatter):
  - Attributes: id, source (whatsapp|linkedin|twitter), received_at (UTC), sender/handle, channel, thread_id, excerpt (200 chars, PII-redacted), status (needs_action|planned|approved|executed|failed), plan_required (bool), pii_redacted (always true)
  - Relationships: Links to Plan (via plan_id in frontmatter), links to MCP action log (via execution_log_id)

- **CEO Briefing Report** (markdown file):
  - Attributes: date_range (Monday–Sunday), generated_at (UTC), kpis (dict), wins (list), risks (list), outstanding_invoices (dict from Odoo), social_performance (dict), next_week_priorities (list), pending_approvals (count + links)
  - Relationships: References Business Goals, Social Summaries, Odoo queries, system_log.md

- **MCP Tool Snapshot** (JSON file):
  - Attributes: server_name (whatsapp|linkedin|twitter|odoo), tools (list of dicts with name, type (query|action), parameters), refreshed_at (UTC), reachable (bool)
  - Relationships: Used by brain_mcp_registry_refresh, referenced by Dashboard.md

- **Ralph Loop Task** (internal state):
  - Attributes: task_description (string), max_iterations (int), current_iteration (int), status (running|stopped|complete|failed), completion_file (path), plans_created (count), last_action (timestamp)
  - Relationships: Creates Plans, creates remediation tasks, logs to `Logs/ralph_loop.log`

- **Remediation Task** (markdown file in `Needs_Action/`):
  - Attributes: created_at (UTC), error_type (mcp_timeout|auth_failure|rate_limit|server_error), server_name, operation, troubleshooting_steps (list), retry_count, priority (low|medium|high|critical)
  - Relationships: Created by brain_handle_mcp_failure, links to original Plan

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can deploy 3 social watchers (WhatsApp, LinkedIn, Twitter) that collectively monitor 100+ messages per day and create intake wrappers within 5 minutes of message arrival
- **SC-002**: Multi-channel social response time improves by 80% (from manual monitoring every 4 hours to automated monitoring every 5-10 minutes)
- **SC-003**: Odoo accounting queries complete in under 3 seconds for datasets up to 1000 invoices
- **SC-004**: Weekly CEO briefing generation completes in under 60 seconds and includes all 8 required sections with real data
- **SC-005**: Ralph loop completes 3-step workflows (read → plan → request approval) in under 2 minutes without human intervention (excluding approval wait time)
- **SC-006**: System maintains 95% uptime across all channels over 7 days, with graceful degradation when individual MCP servers fail
- **SC-007**: PII redaction accuracy reaches 100% for known patterns (emails, phones) in all intake wrappers and logs
- **SC-008**: Approval gates prevent 100% of unauthorized external actions (no bypass loopholes)
- **SC-009**: Audit trail completeness reaches 100% (every MCP action logged with timestamp, parameters, result)
- **SC-010**: Dashboard.md provides real-time visibility into system health with updates within 30 seconds of status changes
- **SC-011**: Social engagement volume increases by 50% within 2 weeks of deployment (measured by response count)
- **SC-012**: Accounting workflow automation reduces manual invoice creation time by 70% (from 10 min per invoice to 3 min)

---

## Dependencies & Assumptions *(optional)*

### Dependencies
- **Silver Tier**: All Gold features build on Silver foundation (Gmail watcher, plan-first workflow, HITL approvals, Gmail API execution, scheduling, logging)
- **Odoo Community Edition**: Local installation required (self-hosted, version 19+)
- **MCP Servers**: WhatsApp, LinkedIn, Twitter, and Odoo MCP servers must be available (custom-built or community-provided)
- **API Access**: LinkedIn API, Twitter API v2, WhatsApp Business API (or web automation alternative)
- **Python 3.10+**: All watchers and skills implemented in Python
- **Windows Task Scheduler or cron**: For scheduled tasks
- **OAuth2 Credentials**: For LinkedIn and Twitter (user must configure)

### Assumptions
- **User has Odoo accounting needs**: The user operates a business that requires invoice tracking, AR aging, and revenue reporting
- **User actively uses social media for business**: LinkedIn, Twitter, and WhatsApp Business are primary communication channels
- **Vault storage is sufficient**: Disk space can accommodate 1000+ intake wrappers, logs, and summaries (estimated 100MB)
- **MCP servers are reliable**: WhatsApp/LinkedIn/Twitter MCP servers have >90% uptime (or graceful degradation handles failures)
- **User approves external actions within 24 hours**: The approval pipeline assumes the user checks `Pending_Approval/` at least daily
- **Network connectivity is stable**: The system assumes internet access for MCP server communication (degradation if offline)

---

## Out of Scope *(explicit exclusions)*

- **No UI Layer**: No Next.js, React, or desktop UI components in this spec (UI implementation deferred to later phase)
- **No Instagram/Facebook Integration**: These channels are excluded from Gold Tier (may add in Platinum)
- **No Cloud Deployment**: All operations are local (cloud deployment deferred to Platinum Tier)
- **No Vector DB/Embeddings/RAG**: No semantic search or AI memory features (future enhancement)
- **No CI/CD Automation**: Beyond clean git history and feature branches (no automated testing pipelines required)
- **No Multi-Agent Coordination**: Gold Tier has one AI Employee instance (multi-agent delegation in Platinum)
- **No Voice/Video Processing**: Social channels are text-only (no voice messages, video transcription)
- **No Payment Gateway Integration**: Odoo handles invoicing but not payment processing (no Stripe/PayPal integration)
- **No CRM Integration**: Client management is basic (no Salesforce/HubSpot sync)

---

## Documentation Requirements *(Gold Tier)*

System MUST include these documentation files:

- **Docs/mcp_whatsapp_setup.md**: WhatsApp MCP server configuration (credentials, API keys, session management)
- **Docs/mcp_linkedin_setup.md**: LinkedIn MCP server configuration (OAuth2 flow, API access)
- **Docs/mcp_twitter_setup.md**: Twitter MCP server configuration (API v2 credentials, rate limits)
- **Docs/mcp_odoo_setup.md**: Odoo MCP server configuration (JSON-RPC setup, database config, model/method reference)
- **Docs/gold_demo_script.md**: 10-minute demo script for judges (covers all P1+P2 user stories)
- **Docs/gold_completion_checklist.md**: Checklist mapping to all acceptance criteria (AC-001 through AC-018)
- **Docs/architecture_gold.md**: Architecture diagram and component overview (Perception → Plan → Approval → Action → Logging with multi-channel + Odoo)
- **Docs/lessons_learned_gold.md**: Lessons learned, challenges, and future improvements

---

## Open Questions & Clarifications

*All clarifications have been resolved with informed defaults documented in the Assumptions section. No blocking questions remain.*

---

## Revision History

| Date       | Version | Changes                                                     | Author    |
|------------|---------|-------------------------------------------------------------|-----------|
| 2026-02-15 | 1.0     | Initial Gold Tier specification (full Phase 1 + Phase 2 combined) | AI Agent  |

---

**End of Specification**
