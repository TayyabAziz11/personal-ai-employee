# Personal AI Employee: Silver Tier Specification

**Version:** 1.0.0
**Created:** 2026-02-11
**Status:** Specification (Implementation Pending)
**Tier Migration:** Bronze → Silver
**Alignment:** Hackathon 0 PDF Requirements

---

## 1. Overview

### 1.1 Purpose

This specification defines the Silver Tier implementation of the Personal AI Employee system. Silver Tier builds upon the Bronze foundation by adding:
- **Plan-first workflow** for all non-trivial external actions
- **Human-in-the-loop approval pipeline** with explicit approval states
- **Multiple watchers** for broader input perception
- **MCP-based external actions** (starting with email)
- **Task scheduling** for autonomous periodic operations

### 1.2 Success Criteria

Silver Tier is considered **successfully implemented** when ALL of the following are verified:

1. **Watchers:** Minimum 2 watchers operational (File System + Gmail)
2. **Planning:** All external actions preceded by plan file creation
3. **Approval Workflow:** Pending_Approval/, Approved/, Rejected/ folders exist and function correctly
4. **MCP External Action:** Email send/draft capability operational via MCP with dry-run support
5. **Scheduling:** At least one scheduled task running via Windows Task Scheduler
6. **Dashboard:** Silver metrics visible (pending approvals, plans in progress, last external action)
7. **Agent Skills:** All new Silver skills (9 total) documented and operational
8. **Audit Trail:** All external actions logged to system_log.md with MCP tool names
9. **Bronze Integrity:** All Bronze capabilities remain intact and operational

### 1.3 Core Principles (Unchanged from Bronze)

- **Perception → Reasoning → Plan → Approval → Action → Logging** (constitutional pipeline)
- **Auditable, Controllable, Reproducible** (constitutional mandate)
- **File-based, human-readable state** (no databases in Silver)
- **Dual-interface:** VS Code (execution) + Obsidian (review/presentation)
- **No Obsidian plugins, Dataview, CSS, or external frameworks**

---

## 2. Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       SILVER TIER ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

    PERCEPTION LAYER (Watchers - Read-Only)
    ┌──────────────────────────────────────────────────────┐
    │                                                       │
    │  ┌─────────────────┐        ┌──────────────────┐    │
    │  │ File System     │        │ Gmail Watcher    │    │
    │  │ Watcher         │        │ (New - Silver)   │    │
    │  │ (Bronze)        │        │                  │    │
    │  │                 │        │ - Inbox emails   │    │
    │  │ - Inbox/ folder │        │ - Attachments    │    │
    │  │ - Creates intake│        │ - Creates intake │    │
    │  │ - watcher_skill │        │ - gmail_watcher  │    │
    │  └────────┬────────┘        └────────┬─────────┘    │
    │           │                          │               │
    │           └───────────┬──────────────┘               │
    └───────────────────────┼──────────────────────────────┘
                            ↓
                     Inbox/ (intake files)
                            ↓
    ┌───────────────────────────────────────────────────────────┐
    │              REASONING LAYER (Analysis)                    │
    │                                                            │
    │  brain_process_inbox_batch                                │
    │  → Reads intake files                                     │
    │  → Identifies task type, priority, approval requirements  │
    │  → Routes to Needs_Action/ or Done/                       │
    │  → NO external actions (read-only analysis)               │
    └───────────────────────┬───────────────────────────────────┘
                            ↓
                     Needs_Action/
                            ↓
    ┌───────────────────────────────────────────────────────────┐
    │                  PLAN LAYER (Silver New)                   │
    │                                                            │
    │  brain_create_plan                                        │
    │  → Generates plan file in Plans/                          │
    │  → Documents:                                             │
    │     - Objective, success criteria                         │
    │     - Files to touch                                      │
    │     - MCP tools required                                  │
    │     - Approval gates (YES/NO for each action)             │
    │     - Risk level (Low/Medium/High)                        │
    │     - Rollback strategy                                   │
    │  → Plan MUST exist before external actions                │
    └───────────────────────┬───────────────────────────────────┘
                            ↓
                    Plans/ (plan files)
                            ↓
    ┌───────────────────────────────────────────────────────────┐
    │            APPROVAL LAYER (Human-in-the-Loop)              │
    │                                                            │
    │  brain_request_approval                                   │
    │  → Moves plan to Pending_Approval/                        │
    │  → Notifies user (console message)                        │
    │  → Waits for user decision                                │
    │                                                            │
    │  User Decision:                                           │
    │  ┌────────────┬────────────┬────────────┐                │
    │  │ Approved/  │ Rejected/  │ Modify     │                │
    │  └─────┬──────┴─────┬──────┴──────┬─────┘                │
    │        ↓            ↓             ↓                       │
    │   Execute      Archive     Update Plan & Re-submit       │
    └───────────────────────┬───────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────────────┐
    │             ACTION LAYER (MCP-Mediated Execution)          │
    │                                                            │
    │  brain_execute_with_mcp                                   │
    │  → Executes approved plan                                 │
    │  → Uses MCP servers ONLY for external actions:            │
    │     - Email (Gmail MCP) - send/draft                      │
    │     - Context7 (Documentation lookups) - read-only        │
    │  → Dry-run first (always)                                 │
    │  → Presents dry-run results to user                       │
    │  → Executes only after dry-run approval                   │
    │  → On failure: STOP, log, escalate                        │
    └───────────────────────┬───────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────────────┐
    │              LOGGING LAYER (Audit Trail)                   │
    │                                                            │
    │  brain_log_action                                         │
    │  → Appends to system_log.md                               │
    │  → Logs: timestamp, skill, MCP tool, parameters, outcome  │
    │  → Moves completed task to Done/                          │
    │  → Updates Dashboard.md                                   │
    └───────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────────────────────┐
    │            SCHEDULING LAYER (Autonomous Triggers)          │
    │                                                            │
    │  Windows Task Scheduler (External)                        │
    │  → Triggers watchers periodically                         │
    │  → Triggers summary generation                            │
    │  → NO direct execution (triggers skills only)             │
    └───────────────────────────────────────────────────────────┘
```

**Key Pipeline Enforcement Points:**
1. **Perception → Reasoning:** Watchers write to Inbox/, brain reads from Inbox/
2. **Reasoning → Plan:** External actions trigger plan creation (mandatory)
3. **Plan → Approval:** Plans requiring approval moved to Pending_Approval/
4. **Approval → Action:** Only approved plans proceed to MCP execution
5. **Action → Logging:** Every MCP call logged before task closure

---

## 3. Folder Structure Changes

### 3.1 New Folders (Silver Additions)

```
personal-ai-employee/
├── Pending_Approval/        [NEW - Silver]
│   ├── plan_<timestamp>_<slug>.md
│   └── README.md
│
├── Approved/                [NEW - Silver]
│   ├── plan_<timestamp>_<slug>.md
│   └── README.md
│
├── Rejected/                [NEW - Silver]
│   ├── plan_<timestamp>_<slug>.md
│   └── README.md
│
├── Scheduled/               [NEW - Silver]
│   ├── task_<name>.md       (scheduled task definitions)
│   └── README.md
```

### 3.2 Modified Folders (Enhanced for Silver)

**Plans/**
- **Bronze:** Simple planning documents (optional)
- **Silver:** Mandatory plan files for all external actions
- **Structure:**
  ```
  Plans/
  ├── YYYY-MM-DD_<task-slug>.md
  ├── active/                (symlinks or references to in-progress plans)
  └── completed/             (archived plans from Done/ tasks)
  ```

**Logs/**
- **Bronze:** watcher.log only
- **Silver:** watcher.log + gmail_watcher.log + mcp_actions.log
- **Structure:**
  ```
  Logs/
  ├── watcher.log            (filesystem watcher events)
  ├── gmail_watcher.log      (Gmail watcher events)
  ├── mcp_actions.log        (all MCP calls with parameters and responses)
  └── scheduler.log          (scheduled task execution history)
  ```

### 3.3 Preserved Folders (Bronze - Unchanged)

- **Inbox/** - New items awaiting triage
- **Needs_Action/** - Active tasks requiring work
- **Done/** - Completed tasks (archive)

### 3.4 Folder Ownership Rules

| Folder            | Writer                          | Reader               |
|-------------------|---------------------------------|----------------------|
| Inbox/            | Watchers (filesystem, Gmail)    | brain_process_*      |
| Needs_Action/     | brain_process_*                 | brain_start_work     |
| Plans/            | brain_create_plan               | brain_execute_*      |
| Pending_Approval/ | brain_request_approval          | User, brain_execute_*|
| Approved/         | User (manual move/edit)         | brain_execute_*      |
| Rejected/         | User (manual move/edit)         | brain_log_action     |
| Done/             | brain_finalize_and_close        | Dashboard, User      |
| Logs/             | All skills (append-only)        | User, audit tools    |
| Scheduled/        | User (manual creation)          | Scheduler, brain_*   |

---

## 4. Watcher Specifications

### 4.1 File System Watcher (Bronze - Preserved)

**Status:** Existing, operational
**Implementation:** `watcher_skill.py`
**Target:** `Inbox/` folder
**Silver Enhancements:** None required (Bronze functionality sufficient)

**Responsibilities:**
- Scan Inbox/ for new files
- Create intake markdown wrappers for non-markdown files
- Validate/wrap raw markdown files into intake format
- Log to Logs/watcher.log and system_log.md
- Preserve original files (non-destructive)

**Silver Integration:**
- Continues to operate as in Bronze
- Can be scheduled via Windows Task Scheduler for periodic scans

### 4.2 Gmail Watcher (Silver - Required New)

**Status:** New implementation required
**Implementation:** `gmail_watcher.py` (new file)
**Target:** Gmail inbox (via Gmail API or MCP)
**Trigger:** Scheduled (Windows Task Scheduler) or manual invocation

**Responsibilities:**
1. **Authenticate:** OAuth2 with Gmail (credentials stored in .env, not committed)
2. **Fetch:** Unread emails from inbox (or specific label)
3. **Process Each Email:**
   - Create intake wrapper: `Inbox/gmail__<sender>__<subject>__<timestamp>.md`
   - Extract metadata: sender, subject, date, labels
   - Extract body (plain text or HTML converted to markdown)
   - Download attachments to `Inbox/attachments/<email-id>/`
   - Mark email as processed (apply label or mark as read, configurable)
4. **Log:** All actions to Logs/gmail_watcher.log and system_log.md
5. **Error Handling:** If Gmail API fails, log error and skip (do not crash)

**Intake Wrapper Format:**
```markdown
# Email from [Sender Name]

**Source:** gmail_watcher
**Received:** [Email timestamp]
**From:** [sender@example.com]
**Subject:** [Subject line]
**Gmail ID:** [message-id]
**Labels:** [label1, label2]
**Has Attachments:** [Yes/No]

---

## Email Body

[Plain text email body or HTML converted to markdown]

---

## Attachments

[If attachments exist]
- [attachment1.pdf](Inbox/attachments/<email-id>/attachment1.pdf)
- [attachment2.jpg](Inbox/attachments/<email-id>/attachment2.jpg)

---

## Next Steps

[Auto-populated by watcher]
- [ ] Review email content
- [ ] Triage to Needs_Action if actionable
- [ ] Archive to Done if informational only

---

## Audit Trail
- [timestamp] Email detected by gmail_watcher
- [timestamp] Intake created in Inbox/
```

**CLI Usage:**
```bash
# Dry-run mode (see what would happen without making changes)
python gmail_watcher.py --dry-run

# Run once and exit (default, safest)
python gmail_watcher.py --once

# Run continuously with 5-minute interval
python gmail_watcher.py --loop --interval 300

# Fetch only from specific label
python gmail_watcher.py --label "AI-Employee"

# Limit number of emails to process
python gmail_watcher.py --limit 10
```

**Silver Safety Features:**
- Non-destructive: Emails remain in Gmail (only labeled or marked read)
- Duplicate prevention: Track processed message IDs
- Append-only logs: All actions recorded
- Dry-run mode: Preview changes before executing
- OAuth2 token refresh: Auto-refresh expired tokens

**Dependencies:**
- Google Gmail API (official Python client)
- OAuth2 credentials (user must authorize once)
- .env file for credentials (gitignored)

**Silver Completion Checklist for Gmail Watcher:**
- [ ] gmail_watcher.py implemented
- [ ] OAuth2 authentication working
- [ ] Intake wrappers created for emails
- [ ] Attachments downloaded correctly
- [ ] Logging to gmail_watcher.log and system_log.md
- [ ] Dry-run mode functional
- [ ] Error handling for API failures
- [ ] Documented in Company_Handbook.md

### 4.3 Future Watchers (Out of Scope for Silver)

**WhatsApp Watcher:** Silver tier defines the interface, Gold tier implements
**LinkedIn Watcher:** Silver tier defines the interface, Gold tier implements

**Future Watcher Interface Specification (for Gold Tier):**
```markdown
### Watcher Interface Requirements (All Tiers)

Every watcher MUST:
1. Implement CLI with --dry-run, --once, --loop, --interval flags
2. Create intake wrappers in Inbox/ following standardized format
3. Log to Logs/<watcher-name>.log and system_log.md
4. Be non-destructive (preserve original source)
5. Track processed items to prevent duplicates
6. Handle authentication failures gracefully
7. Support scheduled execution via Task Scheduler
```

---

## 5. Plan File Specification

### 5.1 When Plans Are Required

**Plans MUST be created for:**
1. External communication (emails, GitHub issues, social media posts)
2. MCP tool invocations with side effects (POST/PUT/DELETE operations)
3. File operations outside Done/ folder (destructive or risky)
4. Scheduled tasks (automation requires plan documentation)
5. Multi-step tasks (>3 actions with dependencies)

**Plans NOT required for:**
- Reading files (perception stage)
- Creating drafts in Needs_Action/ (no external effect)
- Running watchers in --dry-run mode
- Appending to system_log.md (logging stage)
- Updating Dashboard.md counts

### 5.2 Plan File Structure (Mandatory Template)

**Location:** `Plans/YYYY-MM-DD_<task-slug>.md`

**Template:**
```markdown
# Plan: [Task Title]

**Created:** [YYYY-MM-DD HH:MM UTC]
**Status:** [Draft / Pending_Approval / Approved / Rejected / Executed]
**Task Reference:** [Link to Needs_Action/<task-file>.md]
**Risk Level:** [Low / Medium / High]

---

## Objective

[One-sentence goal statement]

---

## Success Criteria

- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

---

## Files to Touch

### Create
- [file-path-1] - [purpose]
- [file-path-2] - [purpose]

### Modify
- [file-path-3] - [what will change]

### Delete
- [file-path-4] - [why deletion is needed]

---

## MCP Tools Required

| Tool Name | Operation | Parameters | Dry-Run? | Approval Required? |
|-----------|-----------|------------|----------|-------------------|
| gmail     | send_email | to, subject, body | Yes | Yes |
| context7  | query-docs | libraryId, query | N/A | No (read-only) |

---

## Approval Gates

| Action Description | Requires Approval? | Rationale |
|--------------------|-------------------|-----------|
| Send email to client | YES | External communication, reputational risk |
| Create draft in Needs_Action/ | NO | Internal, non-destructive |
| Update Dashboard.md | NO | Routine system state update |

---

## Risk Assessment

**Risk Level:** [Low / Medium / High]

**Identified Risks:**
1. [Risk 1: description]
   - **Mitigation:** [How to reduce/avoid]
   - **Blast Radius:** [What's affected if this fails]
2. [Risk 2: description]
   - **Mitigation:** [How to reduce/avoid]
   - **Blast Radius:** [What's affected if this fails]

**Kill Switch:** [How to abort if execution goes wrong]

---

## Execution Steps (Sequential)

1. [Step 1: specific action]
   - **Tool:** [Bash / MCP / Manual]
   - **Command/Call:** [Exact command or MCP invocation]
   - **Expected Outcome:** [What should happen]
   - **Rollback:** [How to undo if needed]

2. [Step 2: specific action]
   - **Tool:** [Bash / MCP / Manual]
   - **Command/Call:** [Exact command or MCP invocation]
   - **Expected Outcome:** [What should happen]
   - **Rollback:** [How to undo if needed]

3. [Continue for all steps...]

---

## Rollback Strategy

**If execution fails at any step:**
1. [Rollback step 1]
2. [Rollback step 2]
3. [Notification to user]

**Data Preservation:**
- [What data is backed up before changes]
- [Where backups are stored]

---

## Dry-Run Results (Populated After Dry-Run)

**Dry-Run Executed:** [YYYY-MM-DD HH:MM UTC]

**Results:**
```
[Dry-run output from MCP tools or preview of changes]
```

**User Approval After Dry-Run:** [Pending / Approved / Rejected]

---

## Execution Log (Populated During Execution)

**Execution Started:** [YYYY-MM-DD HH:MM UTC]

| Step | Status | Timestamp | Output | Errors |
|------|--------|-----------|--------|--------|
| 1    | ✓ OK   | [time]    | [summary] | None |
| 2    | ✓ OK   | [time]    | [summary] | None |

**Execution Completed:** [YYYY-MM-DD HH:MM UTC]
**Final Status:** [Success / Partial / Failed]

---

## Change Log

- [YYYY-MM-DD HH:MM] Plan created (status: Draft)
- [YYYY-MM-DD HH:MM] Moved to Pending_Approval/
- [YYYY-MM-DD HH:MM] User approved plan
- [YYYY-MM-DD HH:MM] Moved to Approved/
- [YYYY-MM-DD HH:MM] Dry-run executed
- [YYYY-MM-DD HH:MM] User approved dry-run results
- [YYYY-MM-DD HH:MM] Execution started
- [YYYY-MM-DD HH:MM] Execution completed (status: Success)
- [YYYY-MM-DD HH:MM] Plan archived to Plans/completed/
```

### 5.3 Plan Status State Machine

```
Draft
  ↓ (brain_request_approval)
Pending_Approval (moved to Pending_Approval/)
  ↓
  ├─ User approves → Approved (moved to Approved/)
  │   ↓ (brain_execute_with_mcp --dry-run)
  │  Dry-Run Results Added
  │   ↓
  │   ├─ User approves dry-run → Execution
  │   └─ User rejects dry-run → Back to Draft or Rejected
  │
  ├─ User rejects → Rejected (moved to Rejected/)
  │
  └─ User requests modification → Back to Draft (updated plan)

Execution (brain_execute_with_mcp --execute)
  ↓
  ├─ Success → Executed (archived to Plans/completed/)
  └─ Failure → Failed (logged to system_log.md, task blocked)
```

---

## 6. Approval Workflow Specification

### 6.1 Approval Folder Workflow

**Pending_Approval/**
- **Purpose:** Plans awaiting user decision
- **Writers:** brain_request_approval (moves plan here)
- **Readers:** User (reviews plan)
- **Lifecycle:** Temporary (plan moves to Approved/ or Rejected/)

**Approved/**
- **Purpose:** Plans approved by user, ready for execution
- **Writers:** User (manual move after approval), brain_execute_with_mcp (status updates)
- **Readers:** brain_execute_with_mcp (reads approved plans for execution)
- **Lifecycle:** Temporary (plan archived to Plans/completed/ after execution)

**Rejected/**
- **Purpose:** Plans rejected by user, archived for audit
- **Writers:** User (manual move after rejection), brain_log_action (status updates)
- **Readers:** User (audit), future planning (learn from rejections)
- **Lifecycle:** Permanent (plans remain for audit trail)

### 6.2 Approval Request Process

**Step 1: Agent Creates Plan**
- Skill: `brain_create_plan`
- Input: Task file from Needs_Action/
- Output: Plan file in Plans/ with Status = "Draft"

**Step 2: Agent Requests Approval**
- Skill: `brain_request_approval`
- Input: Plan file from Plans/
- Actions:
  1. Update plan Status = "Pending_Approval"
  2. Move plan file to Pending_Approval/
  3. Display approval request to user (console + task file update)
  4. Update task file with "Approval Needed: YES" + link to plan
  5. Log to system_log.md: "Approval requested for [plan]"

**Approval Request Format (Console Output):**
```
═══════════════════════════════════════════════════════════
  APPROVAL REQUIRED
═══════════════════════════════════════════════════════════

Plan: Send Email to Client ABC
File: Pending_Approval/2026-02-11_email-client-abc.md
Risk Level: MEDIUM

Objective:
Send project update email to client ABC with invoice attached

MCP Actions Required:
- gmail.send_email (to: client@abc.com, subject: "Q1 Update", attachment: invoice.pdf)

Approval Gates:
✓ External communication (client-facing)
✓ Attachment included (financial document)

What Will Happen If Approved:
1. Dry-run will be executed first
2. You will review dry-run results
3. After dry-run approval, email will be sent via Gmail MCP
4. Action will be logged to system_log.md

───────────────────────────────────────────────────────────
To approve:
1. Review plan file: Pending_Approval/2026-02-11_email-client-abc.md
2. Move file to Approved/ folder (manual file move)
3. Say: "Execute approved plans"

To reject:
1. Move file to Rejected/ folder (manual file move)
2. Optionally add rejection reason in plan file

To modify:
1. Edit plan file in Pending_Approval/
2. Say: "Re-submit plan [name]" (agent will re-process)
───────────────────────────────────────────────────────────
```

**Step 3: User Decision**

**Option A: Approve**
1. User moves plan file from Pending_Approval/ → Approved/
2. User says: "Execute approved plans" (or specifies plan name)
3. Agent detects file in Approved/, proceeds to dry-run

**Option B: Reject**
1. User moves plan file from Pending_Approval/ → Rejected/
2. Optionally: User adds "Rejection Reason:" section to plan
3. Agent logs rejection to system_log.md
4. Task status updated to "Rejected - Plan Declined by User"
5. Task moved to Done/ with rejection note

**Option C: Modify**
1. User edits plan file in Pending_Approval/
2. User says: "Re-submit plan [name]"
3. Agent re-processes modified plan (new change log entry)
4. Plan remains in Pending_Approval/ for re-review

**Step 4: Dry-Run (If Approved)**
- Skill: `brain_execute_with_mcp --dry-run`
- Input: Plan file from Approved/
- Actions:
  1. Run MCP tools with --dry-run flag (where supported)
  2. Capture dry-run output (preview of what would happen)
  3. Update plan file with "Dry-Run Results" section
  4. Display dry-run results to user (console)
  5. Request dry-run approval: "Results look good? (yes/no)"

**Step 5: Execute (If Dry-Run Approved)**
- Skill: `brain_execute_with_mcp --execute`
- Input: Plan file from Approved/ + user dry-run approval
- Actions:
  1. Execute MCP tools with real parameters (no --dry-run)
  2. Log each step to "Execution Log" section in plan
  3. On success: Move plan to Plans/completed/, update task to Done/
  4. On failure: STOP, log error, escalate to user, task status "Blocked"

### 6.3 Approval Gate Decision Matrix

| Action Type | Requires Approval? | Rationale |
|-------------|-------------------|-----------|
| Send email | YES | External communication, reputational risk |
| Draft email (save to Needs_Action/) | NO | Internal draft, no external effect |
| Post to social media | YES | External, public, reputational risk |
| Create GitHub issue | YES | External, public record |
| Update Dashboard.md | NO | Internal system state |
| Read file | NO | Perception, read-only |
| Delete user file | YES | Destructive, data loss risk |
| Run watcher --dry-run | NO | No side effects, preview only |
| Invoke Context7 MCP | NO | Read-only documentation lookup |
| Invoke Gmail MCP (send) | YES | External action, side effect |

---

## 7. MCP Integration Specification

### 7.1 MCP Servers (Silver Tier)

**MCP Server 1: Gmail (New - Required)**
- **Purpose:** Send/draft emails, read inbox (for Gmail Watcher)
- **Operations:**
  - `send_email` (to, subject, body, attachments) - Requires approval
  - `draft_email` (to, subject, body, attachments) - Requires approval if saved to Gmail drafts, not required if saved to local Needs_Action/
  - `read_inbox` (label, limit) - No approval (read-only, used by Gmail Watcher)
  - `mark_read` (message_id) - No approval (low-risk housekeeping)
- **Dry-Run Support:** YES (send_email and draft_email preview recipient, subject, body)
- **Authentication:** OAuth2 (user authorizes once, refresh token stored in .env)
- **Error Handling:**
  - Network errors: Retry 3x with exponential backoff, then escalate
  - Auth errors: Prompt user to re-authorize
  - Rate limits: Wait and retry (respect Gmail API quotas)

**MCP Server 2: Context7 (Existing - No Changes)**
- **Purpose:** Retrieve up-to-date documentation and code examples
- **Operations:**
  - `resolve-library-id` (libraryName, query) - No approval (read-only)
  - `query-docs` (libraryId, query) - No approval (read-only)
- **Dry-Run Support:** N/A (read-only operations)
- **Usage in Pipeline:** Reasoning stage (agent looks up docs to understand task requirements)

### 7.2 MCP Invocation Workflow

```
1. Plan Creation
   ↓
2. Plan Specifies MCP Tool + Parameters
   ↓
3. Approval Requested (if MCP operation requires it)
   ↓
4. User Approves Plan
   ↓
5. Dry-Run Executed (brain_execute_with_mcp --dry-run)
   ↓
   MCP Tool Called with --dry-run Flag
   ↓
   Dry-Run Results Captured
   ↓
6. Dry-Run Results Presented to User
   ↓
7. User Approves Dry-Run Results
   ↓
8. Execution (brain_execute_with_mcp --execute)
   ↓
   MCP Tool Called with Real Parameters
   ↓
   MCP Response Received
   ↓
   Response Logged to system_log.md + Logs/mcp_actions.log
   ↓
9. Task Completed or Failed (logged)
```

### 7.3 MCP Logging Format

**Logs/mcp_actions.log:**
```
[YYYY-MM-DD HH:MM:SS UTC] MCP Call Initiated
Tool: gmail
Operation: send_email
Parameters:
  to: client@abc.com
  subject: Q1 Project Update
  body: [truncated - see plan file for full body]
  attachments: invoice.pdf
Mode: dry-run
Result: SUCCESS (dry-run preview generated)
Duration: 1.23s

[YYYY-MM-DD HH:MM:SS UTC] MCP Call Initiated
Tool: gmail
Operation: send_email
Parameters:
  to: client@abc.com
  subject: Q1 Project Update
  body: [truncated - see plan file for full body]
  attachments: invoice.pdf
Mode: execute
Result: SUCCESS (message ID: 18f3b2c5d9e4a1b7)
Duration: 2.45s
Logged to: system_log.md entry #47

[YYYY-MM-DD HH:MM:SS UTC] MCP Call Initiated
Tool: context7
Operation: query-docs
Parameters:
  libraryId: /anthropic/claude
  query: How to use Claude API for structured output
Mode: execute (read-only, no dry-run)
Result: SUCCESS (3 docs returned)
Duration: 0.87s
Logged to: system_log.md entry #48
```

**system_log.md entry:**
```markdown
### 14:32 UTC - brain_execute_with_mcp
**Skill:** brain_execute_with_mcp (email send via Gmail MCP)
**Files Touched:**
- Read: Approved/2026-02-11_email-client-abc.md
- Updated: Done/2026-02-11_email-client-abc-task.md
- Updated: system_log.md (this file)

**MCP Actions:**
- Tool: gmail (send_email)
- Mode: dry-run → approved → execute
- Recipient: client@abc.com
- Subject: Q1 Project Update
- Attachments: invoice.pdf
- Result: SUCCESS (message ID: 18f3b2c5d9e4a1b7)

**Outcome:** ✓ OK - Email sent successfully, task completed
```

### 7.4 MCP Failure Handling

**Principle:** Agent MUST NOT proceed past a failed MCP call.

**Failure Handling Steps:**
1. **MCP Call Fails:**
   - Capture error message and stack trace
   - Log to Logs/mcp_actions.log with ERROR status
   - Append to system_log.md with ✗ FAILED outcome

2. **Agent Actions:**
   - STOP execution immediately (do not retry without user approval)
   - Update plan status to "Failed"
   - Update task status to "Blocked - MCP Failure"
   - Create escalation log: `Logs/<timestamp>_escalation_mcp_failure.md`

3. **Escalation Log Content:**
   ```markdown
   # MCP Failure Escalation

   **Timestamp:** [YYYY-MM-DD HH:MM UTC]
   **Plan:** [link to plan file]
   **Task:** [link to task file]
   **MCP Tool:** [tool name]
   **Operation:** [operation name]
   **Parameters:** [parameters used]

   ## Error Details

   **Error Type:** [Network / Auth / Rate Limit / Invalid Parameters / Unknown]
   **Error Message:**
   ```
   [full error message from MCP server]
   ```

   ## Attempted Retries

   - Attempt 1: [timestamp] - [result]
   - Attempt 2: [timestamp] - [result]
   - Attempt 3: [timestamp] - [result]

   ## Recommended Actions for User

   1. [Recommended action 1]
   2. [Recommended action 2]
   3. [Option to modify plan and retry]

   ## Agent Status

   **Status:** STOPPED (awaiting user resolution)
   **Blocked Tasks:** [list of tasks waiting on this MCP call]
   ```

4. **User Notification:**
   ```
   ═══════════════════════════════════════════════════════════
     MCP FAILURE - AGENT STOPPED
   ═══════════════════════════════════════════════════════════

   Plan: Send Email to Client ABC
   Task: 2026-02-11_email-client-abc

   MCP Tool: gmail (send_email)
   Error: Network timeout after 3 retries

   Escalation Log Created:
   Logs/2026-02-11-1432_escalation_mcp_failure.md

   Agent has STOPPED execution and is awaiting your resolution.

   Recommended Actions:
   1. Check network connection
   2. Verify Gmail API quotas
   3. Review escalation log for details
   4. Say "Retry MCP [plan-name]" after resolving issue
   ───────────────────────────────────────────────────────────
   ```

**NO Simulated Success:**
- Agent MUST NOT fake MCP responses
- Agent MUST NOT assume success if MCP call times out
- Agent MUST NOT proceed with placeholder data

### 7.5 Context7 MCP Usage (Reasoning Stage)

**Where It Fits in Pipeline:**
- **Reasoning Stage:** Agent queries Context7 to understand task requirements, look up API docs, find code examples
- **NO approval required** (read-only operation)

**How It Is Invoked:**
1. Agent reads task objective in brain_process_single_item
2. Agent identifies missing knowledge (e.g., "User wants to use Anthropic API, I need docs")
3. Agent calls Context7 resolve-library-id to find library
4. Agent calls Context7 query-docs with specific question
5. Agent uses returned docs to inform task brief and plan creation
6. Context7 call logged to system_log.md (for audit, even though read-only)

**How Failures Are Handled:**
- Context7 failure does NOT block task execution
- Agent logs warning to system_log.md
- Agent proceeds with internal knowledge + adds note to task: "Context7 unavailable, used Claude internal knowledge"
- User can review and request re-planning if Context7 docs were critical

**Example Usage:**
```markdown
## Task: Implement Anthropic API Structured Output

**Agent Reasoning:**
1. Task mentions "Anthropic API" and "structured output"
2. Agent queries Context7:
   - resolve-library-id: libraryName="anthropic", query="structured output API"
   - Result: /anthropic/anthropic-sdk
   - query-docs: libraryId="/anthropic/anthropic-sdk", query="How to use structured output with Claude API"
   - Result: Documentation snippets returned
3. Agent uses docs to create plan with correct API calls
4. Plan includes Context7 reference: "Based on Anthropic SDK docs (Context7)"
```

---

## 8. Scheduling Specification

### 8.1 Scheduling Mechanism

**Implementation:** Windows Task Scheduler (native, no third-party tools)

**Why Task Scheduler:**
- Native to Windows (no installation required)
- Reliable, well-documented
- Supports flexible schedules (cron-like)
- Logs execution history
- Can wake computer from sleep (optional)

### 8.2 Scheduled Tasks (Silver Tier)

**Scheduled Task 1: Filesystem Watcher (Periodic Scan)**
- **Script:** `watcher_skill.py --once --quiet --no-banner`
- **Schedule:** Every 15 minutes (configurable)
- **Purpose:** Automatically process new files dropped in Inbox/
- **Task Scheduler Settings:**
  - Trigger: Daily, repeat every 15 minutes for a duration of 24 hours
  - Action: Run Python script
  - Command: `python C:\path\to\watcher_skill.py --once --quiet --no-banner`
  - Output: Redirect stdout to Logs/scheduler.log
  - On failure: Log error, do not retry (next scheduled run will try again)

**Scheduled Task 2: Gmail Watcher (Periodic Email Check)**
- **Script:** `gmail_watcher.py --once --quiet --no-banner`
- **Schedule:** Every 30 minutes (configurable)
- **Purpose:** Automatically fetch new emails and create intake wrappers
- **Task Scheduler Settings:**
  - Trigger: Daily, repeat every 30 minutes for a duration of 24 hours
  - Action: Run Python script
  - Command: `python C:\path\to\gmail_watcher.py --once --quiet --no-banner`
  - Output: Redirect stdout to Logs/scheduler.log
  - On failure: Log error, continue (auth errors will be visible in next manual run)

**Scheduled Task 3: Daily Summary Generation**
- **Script:** `brain_generate_summary.py`
- **Schedule:** Daily at 6:00 PM
- **Purpose:** Generate end-of-day summary of tasks completed, pending approvals, system health
- **Task Scheduler Settings:**
  - Trigger: Daily at 18:00
  - Action: Run Python script
  - Command: `python C:\path\to\brain_generate_summary.py`
  - Output: Summary written to `Done/summaries/YYYY-MM-DD_daily-summary.md`
  - Redirect stdout to Logs/scheduler.log

### 8.3 Scheduled Task Definition Format

**Location:** `Scheduled/<task-name>.md`

**Template:**
```markdown
# Scheduled Task: [Task Name]

**Created:** [YYYY-MM-DD]
**Schedule:** [Description, e.g., "Every 15 minutes" or "Daily at 6 PM"]
**Status:** [Active / Paused / Disabled]
**Task Scheduler Name:** [Exact name in Windows Task Scheduler]

---

## Objective

[One-sentence description of what this scheduled task does]

---

## Script

**File:** [path to script, e.g., watcher_skill.py]
**Command:**
```bash
python C:\full\path\to\script.py --flag1 --flag2
```

**Arguments Explanation:**
- `--flag1` : [What this flag does]
- `--flag2` : [What this flag does]

---

## Schedule Configuration

**Trigger Type:** [Daily / Weekly / On Idle / On Event]
**Repeat Interval:** [15 minutes / 1 hour / etc.]
**Start Time:** [HH:MM if applicable]
**End Time:** [HH:MM if applicable]
**Duration:** [24 hours / indefinitely]

---

## Output & Logging

**Standard Output:** Redirected to `Logs/scheduler.log`
**Error Output:** Redirected to `Logs/scheduler.log`
**Additional Logs:** [e.g., watcher.log, gmail_watcher.log]

---

## Failure Handling

**If script fails:**
1. [What happens - e.g., error logged, next scheduled run continues]
2. [User notification - e.g., check scheduler.log for errors]
3. [Retry policy - e.g., no automatic retry, next scheduled run will try]

**If authentication fails (Gmail):**
1. [Error logged to gmail_watcher.log]
2. [User must re-authenticate manually]
3. [Scheduled task paused until auth fixed]

---

## Maintenance

**How to Pause:**
1. Open Task Scheduler
2. Find task: [Task Scheduler Name]
3. Right-click → Disable

**How to Modify Schedule:**
1. Edit this file with new schedule
2. Update Task Scheduler trigger settings
3. Log change to system_log.md

**How to Remove:**
1. Delete from Task Scheduler
2. Move this file to Scheduled/archived/
3. Log removal to system_log.md

---

## Change Log

- [YYYY-MM-DD] Created scheduled task (schedule: every 15 minutes)
- [YYYY-MM-DD] Modified schedule to every 30 minutes (user request)
- [YYYY-MM-DD] Paused task temporarily (user on vacation)
- [YYYY-MM-DD] Re-enabled task
```

### 8.4 Scheduler Logging Format

**Logs/scheduler.log:**
```
[2026-02-11 14:00:00] SCHEDULED TASK: watcher_skill
Command: python C:\...\watcher_skill.py --once --quiet --no-banner
Status: SUCCESS
Output: Processed 2 new items (1 created, 1 skipped)
Duration: 1.5s

[2026-02-11 14:15:00] SCHEDULED TASK: watcher_skill
Command: python C:\...\watcher_skill.py --once --quiet --no-banner
Status: SUCCESS
Output: No new items
Duration: 0.3s

[2026-02-11 14:30:00] SCHEDULED TASK: gmail_watcher
Command: python C:\...\gmail_watcher.py --once --quiet --no-banner
Status: FAILED
Error: Gmail API authentication failed (token expired)
Action Required: Re-authenticate with Gmail API
Duration: 0.1s

[2026-02-11 18:00:00] SCHEDULED TASK: brain_generate_summary
Command: python C:\...\brain_generate_summary.py
Status: SUCCESS
Output: Summary written to Done/summaries/2026-02-11_daily-summary.md
Duration: 3.2s
```

---

## 9. Agent Skills Definition List (Silver Tier)

### 9.1 Silver Tier Skills (New - 9 Total)

**Skill 16: brain_create_plan**
- **Purpose:** Generate a detailed plan file for external actions
- **Inputs:** Task file from Needs_Action/
- **Outputs:** Plan file in Plans/ with Status = "Draft"
- **Approval Gate:** NO (creating plan does not require approval, executing it does)

**Skill 17: brain_request_approval**
- **Purpose:** Move plan to Pending_Approval/ and notify user
- **Inputs:** Plan file from Plans/
- **Outputs:** Plan moved to Pending_Approval/, approval request displayed, task file updated
- **Approval Gate:** NO (this skill requests approval, doesn't require it)

**Skill 18: brain_execute_with_mcp**
- **Purpose:** Execute approved plan using MCP tools
- **Inputs:** Plan file from Approved/, --dry-run or --execute flag
- **Outputs:** MCP calls executed, results logged, plan status updated
- **Approval Gate:** YES (requires plan to be in Approved/ folder)

**Skill 19: brain_log_action**
- **Purpose:** Append MCP action log to system_log.md and Logs/mcp_actions.log
- **Inputs:** MCP tool name, operation, parameters, result
- **Outputs:** Log entries in system_log.md and mcp_actions.log
- **Approval Gate:** NO (logging does not require approval)

**Skill 20: brain_handle_mcp_failure**
- **Purpose:** Handle MCP call failures with escalation and logging
- **Inputs:** MCP error details, plan file, task file
- **Outputs:** Escalation log created, task blocked, user notified
- **Approval Gate:** NO (failure handling is automatic)

**Skill 21: brain_generate_summary**
- **Purpose:** Generate daily or on-demand summary of system activity
- **Inputs:** Date range (default: today)
- **Outputs:** Summary file in Done/summaries/YYYY-MM-DD_summary.md
- **Approval Gate:** NO (internal reporting, no external effect)

**Skill 22: brain_monitor_approvals**
- **Purpose:** Check Approved/ folder for plans ready to execute
- **Inputs:** None (scans Approved/ folder)
- **Outputs:** List of approved plans, prompt to execute or dry-run
- **Approval Gate:** NO (monitoring does not execute, only reports)

**Skill 23: brain_archive_plan**
- **Purpose:** Move executed or rejected plans to appropriate archive
- **Inputs:** Plan file (from Approved/ or Rejected/)
- **Outputs:** Plan moved to Plans/completed/ or Plans/rejected/
- **Approval Gate:** NO (archiving is housekeeping, no external effect)

**Skill 24: gmail_watcher (Watcher Skill)**
- **Purpose:** Fetch emails from Gmail and create intake wrappers
- **Inputs:** Gmail API credentials, --once or --loop flag
- **Outputs:** Intake wrappers in Inbox/, logs to gmail_watcher.log
- **Approval Gate:** NO (perception only, no external writes to Gmail)

### 9.2 Bronze Tier Skills (Preserved - 15 Total)

All Bronze skills (1-15) remain unchanged and operational.

**Bronze Skills List (for reference):**
1. setup_vault
2. intake_to_inbox
3. triage_inbox_item
4. update_dashboard
5. close_task_to_done
6. watcher_skill
7. brain_process_inbox_batch
8. brain_process_single_item
9. brain_write_task_brief
10. brain_set_priority_and_due_date
11. brain_generate_action_plan
12. brain_approval_gate
13. brain_start_work
14. brain_execute_task
15. brain_finalize_and_close

### 9.3 Silver Tier Skill Integration with Pipeline

| Pipeline Stage | Bronze Skills Used | Silver Skills Added |
|----------------|-------------------|---------------------|
| Perception     | watcher_skill (6) | gmail_watcher (24) |
| Reasoning      | brain_process_inbox_batch (7), brain_process_single_item (8) | (none - Bronze sufficient) |
| Plan           | brain_generate_action_plan (11) | brain_create_plan (16) |
| Approval       | brain_approval_gate (12) | brain_request_approval (17), brain_monitor_approvals (22) |
| Action         | brain_execute_task (14) | brain_execute_with_mcp (18) |
| Logging        | close_task_to_done (5), update_dashboard (4) | brain_log_action (19), brain_archive_plan (23), brain_handle_mcp_failure (20) |

**Total Silver Tier Skills:** 24 (15 Bronze + 9 Silver)

---

## 10. Dashboard Update Requirements

### 10.1 New Dashboard Sections (Silver)

**Add to Dashboard.md:**

```markdown
> [!warning] 📋 Pending Approvals
>
> | Plan | Created | Risk | Status | Link |
> |------|---------|------|--------|------|
> | Send Email to Client ABC | 2026-02-11 14:00 | MEDIUM | Awaiting User Review | [View Plan](Pending_Approval/2026-02-11_email-client-abc.md) |
> | Post LinkedIn Update | 2026-02-11 15:30 | LOW | Awaiting User Review | [View Plan](Pending_Approval/2026-02-11_linkedin-post.md) |
>
> **Total Pending:** 2
> **Oldest Pending:** 1 hour 30 minutes

---

> [!info] 🔄 Plans in Progress
>
> | Plan | Status | Started | Last Updated | Progress |
> |------|--------|---------|--------------|----------|
> | GitHub Issue Creation | Dry-Run Complete | 2026-02-11 13:00 | 2026-02-11 13:15 | Awaiting Dry-Run Approval |
> | Weekly Report Generation | Draft | 2026-02-11 10:00 | 2026-02-11 10:30 | Planning Stage |
>
> **Total Active Plans:** 2

---

> [!success] 🌐 Last External Action
>
> **Action:** Email sent to client@abc.com
> **Timestamp:** 2026-02-11 12:45 UTC
> **MCP Tool:** gmail (send_email)
> **Result:** ✅ SUCCESS (message ID: 18f3b2c5d9e4a1b7)
> **Plan:** [2026-02-11_email-client-abc.md](Done/plans/2026-02-11_email-client-abc.md)
> **Logged:** system_log.md entry #45

---

> [!note] 📬 Watcher Status (Silver)
>
> | Watcher | Last Run | Items Detected | Status | Log |
> |---------|----------|----------------|--------|-----|
> | Filesystem | 2026-02-11 14:00 UTC | 2 new | ✓ Active | [watcher.log](Logs/watcher.log) |
> | Gmail | 2026-02-11 14:30 UTC | 5 emails | ✓ Active | [gmail_watcher.log](Logs/gmail_watcher.log) |
>
> **Next Scheduled Run:**
> - Filesystem: 2026-02-11 14:15 UTC (in 2 minutes)
> - Gmail: 2026-02-11 15:00 UTC (in 32 minutes)

---

> [!check] 🎯 Silver Tier Health Check
>
> **Operational Verification:**
>
> - ✅ **Watchers Operational** - Filesystem + Gmail active
> - ✅ **Plan-First Enforced** - All external actions have plans
> - ✅ **Approval Pipeline Active** - Pending_Approval/ monitored
> - ✅ **MCP Integration Working** - Gmail MCP operational
> - ✅ **Scheduling Active** - 3 scheduled tasks running
> - ✅ **Audit Trail Complete** - All MCP actions logged
> - ✅ **Bronze Foundation Intact** - All Bronze features operational
>
> **Recent Silver Operations:**
> 1. ✅ Gmail Watcher executed (14:30 UTC) - 5 emails processed
> 2. ✅ Email sent via MCP (12:45 UTC) - Success
> 3. ✅ Plan approved by user (12:40 UTC) - Dry-run executed
> 4. ✅ Daily summary generated (18:00 UTC yesterday)
```

### 10.2 Modified Dashboard Sections (Bronze → Silver)

**Update "Workflow Overview" to include approval states:**

```markdown
> [!tip] 📥 Workflow Overview (Silver)
>
> | Stage | Count | Status | Icon |
> |-------|-------|--------|------|
> | **Inbox** | 3 | Monitoring (2 watchers active) | 📥 |
> | **Needs_Action** | 5 | Active | 🎯 |
> | **Pending_Approval** | 2 | Awaiting User Review | ⏳ |
> | **Approved** | 1 | Ready for Execution | ✅ |
> | **Rejected** | 0 | Archived | ❌ |
> | **Done** | 47 | Archive | ✓ |
>
> **Total Tasks Processed:** 58
> **Success Rate:** 98% (1 rejected, 1 failed)
```

### 10.3 Dashboard Update Triggers

**Dashboard.md must be updated after:**
1. Watcher run (update watcher status, inbox count)
2. Plan created (add to "Plans in Progress")
3. Plan moved to Pending_Approval/ (update "Pending Approvals")
4. Plan approved (remove from "Pending Approvals", add to "Approved")
5. Plan rejected (remove from "Pending Approvals", increment "Rejected" count)
6. MCP action executed (update "Last External Action")
7. Task completed (increment "Done" count, update "Recently Completed")
8. Daily summary generated (update timestamp)

---

## 11. Silver Completion Checklist

### 11.1 Implementation Checklist (Must Mirror PDF Expectations)

**Watchers:**
- [ ] Filesystem Watcher operational (Bronze - verified)
- [ ] Gmail Watcher implemented (`gmail_watcher.py`)
- [ ] Gmail Watcher OAuth2 authentication working
- [ ] Gmail Watcher creates intake wrappers in Inbox/
- [ ] Gmail Watcher logs to `Logs/gmail_watcher.log`
- [ ] Both watchers scheduled via Windows Task Scheduler
- [ ] WhatsApp and LinkedIn watchers defined as future extensions (out of scope for Silver)

**Plan-First Workflow:**
- [ ] `brain_create_plan` skill implemented
- [ ] Plans created for ALL external actions (enforced)
- [ ] Plan template includes all mandatory sections
- [ ] Plans document MCP tools, approval gates, risk level, rollback strategy
- [ ] Plan status state machine implemented (Draft → Pending → Approved/Rejected → Executed)

**Human-in-the-Loop Approval Pipeline:**
- [ ] `Pending_Approval/` folder created
- [ ] `Approved/` folder created
- [ ] `Rejected/` folder created
- [ ] `brain_request_approval` skill implemented
- [ ] Approval request displayed to user (console + task file)
- [ ] User can approve by moving plan to `Approved/`
- [ ] User can reject by moving plan to `Rejected/`
- [ ] User can modify plan and re-submit
- [ ] Dry-run executed AFTER approval, BEFORE execution
- [ ] User approves dry-run results before execution
- [ ] All approval decisions logged to `system_log.md`

**MCP External Action (Email):**
- [ ] Gmail MCP server integrated
- [ ] `send_email` operation implemented with dry-run support
- [ ] `draft_email` operation implemented (if needed)
- [ ] Dry-run displays recipient, subject, body preview
- [ ] User approves dry-run before execution
- [ ] Email sent via MCP (not direct SMTP)
- [ ] Email send logged to `Logs/mcp_actions.log` and `system_log.md`
- [ ] MCP failure handling implemented (escalation, no simulated success)

**Scheduling:**
- [ ] Windows Task Scheduler tasks created:
  - [ ] Filesystem Watcher (every 15 minutes)
  - [ ] Gmail Watcher (every 30 minutes)
  - [ ] Daily Summary Generation (6 PM daily)
- [ ] Scheduled task definitions created in `Scheduled/`
- [ ] Scheduler logs to `Logs/scheduler.log`
- [ ] Scheduled tasks survive system reboot (Task Scheduler persistence)

**Dashboard Updates:**
- [ ] "Pending Approvals" section added
- [ ] "Plans in Progress" section added
- [ ] "Last External Action" section added
- [ ] "Watcher Status (Silver)" section added
- [ ] "Silver Tier Health Check" section added
- [ ] Workflow overview updated with approval states
- [ ] Dashboard updated after each watcher run, plan creation, approval, MCP action

**New Silver Agent Skills:**
- [ ] Skill 16: brain_create_plan (implemented)
- [ ] Skill 17: brain_request_approval (implemented)
- [ ] Skill 18: brain_execute_with_mcp (implemented)
- [ ] Skill 19: brain_log_action (implemented)
- [ ] Skill 20: brain_handle_mcp_failure (implemented)
- [ ] Skill 21: brain_generate_summary (implemented)
- [ ] Skill 22: brain_monitor_approvals (implemented)
- [ ] Skill 23: brain_archive_plan (implemented)
- [ ] Skill 24: gmail_watcher (implemented)
- [ ] All 9 skills documented in `Company_Handbook.md`

**Logging & Audit:**
- [ ] All MCP calls logged to `Logs/mcp_actions.log` (tool, operation, parameters, result, duration)
- [ ] All MCP calls logged to `system_log.md` (timestamp, skill, outcome)
- [ ] All watcher runs logged to respective watcher logs
- [ ] All scheduled task executions logged to `Logs/scheduler.log`
- [ ] All plan status changes logged in plan file change logs
- [ ] All approval decisions logged to `system_log.md`

**Context7 MCP Usage:**
- [ ] Context7 used in Reasoning stage (Bronze - verified)
- [ ] Context7 failures handled gracefully (no blocking)
- [ ] Context7 calls logged to `system_log.md` (even though read-only)

**Bronze Foundation Integrity:**
- [ ] All Bronze folders preserved (Inbox/, Needs_Action/, Done/, Logs/)
- [ ] All 15 Bronze skills operational
- [ ] Dashboard.md structure preserved (only additions, no breaking changes)
- [ ] system_log.md format unchanged (only new entry types added)
- [ ] watcher_skill.py unchanged (Bronze filesystem watcher)
- [ ] Company_Handbook.md updated (Silver skills added, Bronze skills preserved)

---

## 12. Risk Assessment

### 12.1 Implementation Risks (Silver Tier)

**Risk 1: Gmail API Authentication Complexity**
- **Description:** OAuth2 flow requires user to authorize app, handle token refresh, store credentials securely
- **Probability:** Medium
- **Impact:** High (without Gmail Watcher, Silver tier is incomplete)
- **Mitigation:**
  - Use official Google Python client library (well-documented)
  - Store credentials in `.env` file (gitignored)
  - Implement token refresh logic (auto-renew before expiration)
  - Provide clear setup instructions for user (one-time authorization)
  - Test authentication with dry-run before implementing watcher
- **Contingency:** If Gmail API proves too complex, defer Gmail Watcher to Gold tier, implement a simpler IMAP-based watcher for Silver
- **Blast Radius:** Gmail Watcher only (other Silver features unaffected)

**Risk 2: MCP Server Dry-Run Support Gaps**
- **Description:** Not all MCP operations support dry-run mode; some may require custom dry-run logic
- **Probability:** Medium
- **Impact:** Medium (dry-run preview quality may vary)
- **Mitigation:**
  - For `send_email`: Display full email preview (to, subject, body, attachments) as dry-run result
  - For operations without native dry-run: Log parameters and display "Dry-run not supported, here's what will execute: [params]"
  - Document which MCP operations support dry-run vs. parameter preview only
  - Always require user approval before execution, regardless of dry-run quality
- **Contingency:** If dry-run is unavailable, fall back to detailed parameter preview + user approval
- **Blast Radius:** MCP execution confidence (does not block execution, only reduces preview quality)

**Risk 3: Windows Task Scheduler Reliability**
- **Description:** Task Scheduler may fail silently, miss runs, or have permission issues
- **Probability:** Low
- **Impact:** Medium (scheduled tasks won't run, but manual invocation still works)
- **Mitigation:**
  - Test Task Scheduler setup thoroughly during Silver implementation
  - Log all scheduled task runs to `Logs/scheduler.log` (absence of log = task didn't run)
  - Implement `brain_monitor_scheduler` skill to check last run timestamps and alert if stale
  - Document Task Scheduler troubleshooting in README
  - Provide fallback: User can manually run watcher scripts if scheduler fails
- **Contingency:** If Task Scheduler unreliable, provide PowerShell script for user to run watchers on-demand
- **Blast Radius:** Scheduled automation only (manual workflow unaffected)

**Risk 4: Approval Workflow Usability (File Moves)**
- **Description:** Requiring user to manually move files between folders (Pending → Approved) may be cumbersome
- **Probability:** Medium
- **Impact:** Low (usability friction, but functionally correct)
- **Mitigation:**
  - Provide clear console instructions: "Move file to Approved/ folder to approve"
  - Implement `brain_monitor_approvals` to auto-detect file moves and proceed
  - Consider adding CLI command: `approve-plan <plan-name>` that moves file automatically (Gold tier enhancement)
  - Document approval workflow with examples in README
- **Contingency:** If file moves prove too cumbersome, add CLI convenience commands in Gold tier
- **Blast Radius:** User experience only (approval workflow still functions correctly)

**Risk 5: MCP Failure Cascades**
- **Description:** If Gmail MCP fails repeatedly (rate limits, auth issues), multiple tasks may get blocked
- **Probability:** Low-Medium
- **Impact:** High (system appears "stuck" until user resolves MCP issue)
- **Mitigation:**
  - Implement `brain_handle_mcp_failure` with clear escalation logs
  - Group blocked tasks in Dashboard ("Blocked: Gmail MCP Unavailable")
  - Provide retry mechanism: User says "Retry MCP [plan-name]" after resolving issue
  - Rate limit handling: Detect Gmail API rate limits, auto-pause gmail_watcher until reset
  - Document MCP troubleshooting (auth, network, rate limits) in README
- **Contingency:** If MCP server becomes unavailable, user can manually perform external actions and log them
- **Blast Radius:** All MCP-dependent tasks (email sending, drafting)

**Risk 6: Bronze Foundation Breakage**
- **Description:** Silver additions might inadvertently break existing Bronze workflows
- **Probability:** Low
- **Impact:** Critical (if Bronze breaks, Silver cannot function)
- **Mitigation:**
  - **Test Bronze workflows after Silver implementation:**
    - Filesystem watcher still detects files
    - Inbox → Needs_Action → Done flow intact
    - brain_process_inbox_batch still works
    - Dashboard updates correctly
    - system_log.md appends correctly
  - **Follow constitution rule:** NO removal of Bronze folders, skills, or file formats
  - **Only add, never modify:** New folders, new skills, new log files (no changes to existing)
  - **Regression testing:** Run Bronze test cases after Silver implementation
- **Contingency:** If Bronze breaks, revert Silver changes immediately (Git rollback)
- **Blast Radius:** Entire system (Bronze is foundation)

### 12.2 Operational Risks (Post-Implementation)

**Risk 7: Approval Backlog**
- **Description:** User doesn't review Pending_Approval/ regularly, plans accumulate, tasks stall
- **Probability:** Medium
- **Impact:** Medium (system waits indefinitely for approvals)
- **Mitigation:**
  - Dashboard prominently displays "Pending Approvals" count with age
  - Daily summary includes pending approvals reminder
  - Implement age-based alerts: "Plan X has been pending for 24 hours"
  - Provide bulk approval option (Gold tier): "Approve all low-risk plans"
- **Contingency:** User manually reviews Pending_Approval/ folder weekly
- **Blast Radius:** Task throughput (non-approval tasks unaffected)

**Risk 8: MCP Cost Overruns (Gmail API Quotas)**
- **Description:** Gmail API has free tier quotas; high email volume could hit limits
- **Probability:** Low
- **Impact:** Medium (MCP calls fail, tasks blocked)
- **Mitigation:**
  - Document Gmail API quotas in README
  - Implement quota monitoring: Log daily API call count
  - Warn user if approaching quota limit
  - Provide quota usage in daily summary
- **Contingency:** User upgrades to paid Gmail API tier or reduces email frequency
- **Blast Radius:** Gmail MCP operations only

---

## 13. Out-of-Scope (Gold/Platinum Features)

### 13.1 Explicitly Excluded from Silver Tier

**Gold Tier Features (Do NOT Implement in Silver):**
- Custom AI memory systems (embeddings, vector search, semantic memory)
- Advanced scheduling (dependency-based, conditional triggers)
- Multi-agent collaboration (multiple AI agents working together)
- Custom MCP servers (beyond Gmail, Context7)
- Web UI for approval workflow (file-based approval is Silver limit)
- Slack/Discord integration (messaging platform watchers)
- Database integration (Silver is file-based only)
- CI/CD automation (build pipelines, deployments)
- Proactive suggestions ("I noticed you often...")
- Natural language plan generation (user describes task in prose, agent generates plan)

**Platinum Tier Features (Do NOT Implement in Silver):**
- Autonomous decision-making (agent decides without approval)
- Financial transactions (payments, invoices, purchases)
- Legal document generation (contracts, agreements)
- HR operations (hiring, terminations, performance reviews)
- Full calendar integration (scheduling meetings, managing calendar)
- Code generation at scale (auto-generating entire features)
- Cross-organization collaboration (working with external teams)

### 13.2 Silver Tier Boundaries (What's Included)

**Silver Tier IS:**
- Plan-first workflow (ALL external actions require plans)
- Human-in-the-loop approval (ALL external actions require approval)
- Dual watchers (Filesystem + Gmail)
- MCP-based external actions (Gmail send/draft only)
- Basic scheduling (Windows Task Scheduler, time-based only)
- File-based state (Markdown, no databases)
- Audit trails (all actions logged)

**Silver Tier IS NOT:**
- Autonomous (agent always waits for approval)
- Intelligent scheduling (Gold tier: dependency-aware, adaptive)
- Multi-channel (Gold tier: Slack, WhatsApp, LinkedIn)
- Proactive (Gold tier: agent suggests actions before asked)
- Database-backed (Silver is file-based, Gold can use DBs)

---

## 14. Specification Completion Statement

This specification defines the **complete requirements for Silver Tier implementation** of the Personal AI Employee system. It is:

- ✅ **Aligned with Hackathon 0 PDF requirements** (all Silver tier features covered)
- ✅ **Structured and precise** (13 numbered sections, detailed subsections)
- ✅ **Implementation-ready** (templates, formats, examples provided)
- ✅ **Strict and enforceable** (checklists, rules, boundaries defined)
- ✅ **Bronze-preserving** (all Bronze capabilities intact)
- ✅ **Constitution-compliant** (follows Perception → Reasoning → Plan → Approval → Action → Logging pipeline)

**Implementation Readiness:** This specification can be handed to an implementation team (or AI agent) and Silver Tier can be built without further clarification.

**Next Step:** Create implementation plan (`/sp.plan`) to break down Silver Tier development into executable tasks.

---

**End of Specification**

**Version:** 1.0.0
**Status:** Approved for Implementation
**Created:** 2026-02-11
**Author:** Personal AI Employee (Claude Sonnet 4.5)
**Reviewed:** Awaiting User Review
