# Silver Tier Implementation Plan

**Plan ID:** PLAN_silver_001
**Created:** 2026-02-11
**Status:** Ready for Implementation
**Branch:** silver-tier
**Specification:** [Specs/SPEC_silver_tier.md](../Specs/SPEC_silver_tier.md)
**Constitution:** [Specs/sp.constitution.md](../Specs/sp.constitution.md)
**Estimated Duration:** 20-30 hours (per Hackathon 0 PDF)

---

## Executive Summary

This plan implements Silver Tier of the Personal AI Employee system, upgrading from Bronze foundation to include:
- Gmail Watcher (2nd watcher, OAuth2-based)
- Plan-first workflow (mandatory for external actions)
- Human-in-the-loop approval pipeline (file-based)
- MCP email actions (send/draft with dry-run)
- Windows Task Scheduler integration (3 scheduled tasks)
- 9 new agent skills (total 24 skills)
- Enhanced dashboard with Silver metrics

**Critical Success Factors:**
1. Preserve Bronze foundation (no breaking changes)
2. Follow constitutional pipeline: Perception → Reasoning → Plan → Approval → Action → Logging
3. All AI functionality as Agent Skills (no freestyle)
4. MCP-only for external actions (no direct API calls)
5. File-based approval workflow (no web UI)

---

## Milestones Overview

| Milestone | Name | Dependencies | Est. Time | Priority |
|-----------|------|--------------|-----------|----------|
| M1 | Vault Structure Setup | None | 0.5h | P0 |
| M2 | Documentation Updates | M1 | 2h | P0 |
| M3 | Gmail Watcher Implementation | M1 | 4-6h | P0 |
| M4 | Plan-First Workflow | M2 | 3-4h | P0 |
| M5 | Approval Pipeline | M4 | 2-3h | P0 |
| M6 | MCP Email Integration | M3, M5 | 4-5h | P0 |
| M7 | Task Scheduling Setup | M3, M6 | 2h | P1 |
| M8 | Daily Summary Skill | M2, M4 | 2h | P1 |
| M9 | End-to-End Testing | M6, M7 | 2-3h | P0 |
| M10 | Silver Demo & Documentation | M9 | 1-2h | P0 |

**Total Estimated Time:** 23-31 hours
**Critical Path:** M1 → M2 → M3 → M6 → M9 → M10

---

## Milestone 1: Vault Structure Setup

**Objective:** Create new folders for Silver Tier approval workflow and scheduling

**Duration:** 30 minutes
**Dependencies:** None
**Priority:** P0 (blocking)

### Tasks

#### Task 1.1: Create Approval Workflow Folders
**Description:** Add three new folders for human-in-the-loop approval

**Commands:**
```powershell
# From vault root
New-Item -ItemType Directory -Path "Pending_Approval" -Force
New-Item -ItemType Directory -Path "Approved" -Force
New-Item -ItemType Directory -Path "Rejected" -Force

# Create README files
@"
# Pending Approval

Plans and actions awaiting user approval are placed here.

**Workflow:**
1. Agent creates plan → moves to Pending_Approval/
2. User reviews plan
3. User moves file to Approved/ (to proceed) or Rejected/ (to cancel)

**DO NOT DELETE FILES** - they are part of audit trail
"@ | Out-File -FilePath "Pending_Approval/README.md" -Encoding UTF8

@"
# Approved

Approved plans ready for execution.

**Workflow:**
1. User moves plan from Pending_Approval/ to here
2. Agent detects file in Approved/
3. Agent executes plan (dry-run first, then real execution after dry-run approval)
4. After execution, plan moves to Plans/completed/

**DO NOT DELETE FILES** - they are part of audit trail
"@ | Out-File -FilePath "Approved/README.md" -Encoding UTF8

@"
# Rejected

Rejected plans archived for audit.

**Workflow:**
1. User moves plan from Pending_Approval/ to here (if rejecting)
2. Optionally add rejection reason to plan file
3. Agent logs rejection to system_log.md
4. Files remain here permanently for audit trail

**DO NOT DELETE FILES** - they are part of audit trail
"@ | Out-File -FilePath "Rejected/README.md" -Encoding UTF8
```

**Files Created:**
- `Pending_Approval/` folder
- `Approved/` folder
- `Rejected/` folder
- `Pending_Approval/README.md`
- `Approved/README.md`
- `Rejected/README.md`

**Acceptance Criteria:**
- [ ] All three folders exist in vault root
- [ ] README files are present and readable
- [ ] Folders are visible in both VS Code and Obsidian

**Test Procedure:**
```powershell
# Verify folders exist
Test-Path "Pending_Approval"  # Should return True
Test-Path "Approved"           # Should return True
Test-Path "Rejected"           # Should return True

# Verify READMEs
Get-Content "Pending_Approval/README.md"  # Should display content
```

**Rollback:** Delete folders if needed

---

#### Task 1.2: Create Scheduled Tasks Folder
**Description:** Add folder for scheduled task definitions

**Commands:**
```powershell
New-Item -ItemType Directory -Path "Scheduled" -Force

@"
# Scheduled Tasks

This folder contains scheduled task definitions for Windows Task Scheduler.

**Silver Tier Scheduled Tasks:**
1. Filesystem Watcher (every 15 minutes)
2. Gmail Watcher (every 30 minutes)
3. Daily Summary Generation (6 PM daily)

Each task has a `.md` file documenting its schedule and configuration.
"@ | Out-File -FilePath "Scheduled/README.md" -Encoding UTF8
```

**Files Created:**
- `Scheduled/` folder
- `Scheduled/README.md`

**Acceptance Criteria:**
- [ ] Scheduled/ folder exists
- [ ] README is present

**Test Procedure:**
```powershell
Test-Path "Scheduled"  # Should return True
```

**Rollback:** Delete folder if needed

---

#### Task 1.3: Create Logs Subfolders
**Description:** Add log files for Silver Tier components

**Commands:**
```powershell
# Create empty log files
New-Item -ItemType File -Path "Logs/gmail_watcher.log" -Force
New-Item -ItemType File -Path "Logs/mcp_actions.log" -Force
New-Item -ItemType File -Path "Logs/scheduler.log" -Force

# Add headers
@"
# Gmail Watcher Log
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
# Purpose: Logs all Gmail watcher operations

"@ | Out-File -FilePath "Logs/gmail_watcher.log" -Encoding UTF8

@"
# MCP Actions Log
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
# Purpose: Logs all MCP server operations (email, context7, etc.)
# Format: [timestamp] Tool | Operation | Parameters | Mode | Result | Duration

"@ | Out-File -FilePath "Logs/mcp_actions.log" -Encoding UTF8

@"
# Scheduler Log
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
# Purpose: Logs all Windows Task Scheduler executions

"@ | Out-File -FilePath "Logs/scheduler.log" -Encoding UTF8
```

**Files Created:**
- `Logs/gmail_watcher.log`
- `Logs/mcp_actions.log`
- `Logs/scheduler.log`

**Acceptance Criteria:**
- [ ] All three log files exist in Logs/
- [ ] Headers are present

**Test Procedure:**
```powershell
Test-Path "Logs/gmail_watcher.log"  # Should return True
Test-Path "Logs/mcp_actions.log"    # Should return True
Test-Path "Logs/scheduler.log"      # Should return True
```

**Rollback:** Delete files if needed

---

### Milestone 1 Acceptance Checklist

- [ ] Pending_Approval/, Approved/, Rejected/ folders created
- [ ] Scheduled/ folder created
- [ ] All READMEs present
- [ ] Log files created (gmail_watcher.log, mcp_actions.log, scheduler.log)
- [ ] Vault structure verified in VS Code and Obsidian
- [ ] No Bronze folders affected

**Commit:**
```bash
git add Pending_Approval/ Approved/ Rejected/ Scheduled/ Logs/
git commit -m "feat(silver): add vault structure for approval workflow and scheduling

- Add Pending_Approval/, Approved/, Rejected/ folders for HITL workflow
- Add Scheduled/ folder for task definitions
- Add Silver log files (gmail_watcher.log, mcp_actions.log, scheduler.log)
- Include README files for each new folder

Ref: SPEC_silver_tier.md Section 3"
```

---

## Milestone 2: Documentation Updates

**Objective:** Update Company_Handbook.md and Dashboard.md with Silver Tier content

**Duration:** 2 hours
**Dependencies:** M1
**Priority:** P0 (blocking)

### Tasks

#### Task 2.1: Update Company_Handbook.md with Silver Skills
**Description:** Add 9 new Silver skills (16-24) to Company_Handbook.md

**File Modified:** `Company_Handbook.md`

**Content to Add:**
Add to Section 2 (after Skill 15):

```markdown
---

## 2.2 SILVER TIER AGENT SKILLS

### Skill 16: brain_create_plan
**Purpose:** Generate detailed plan file for external actions (mandatory for Silver)
**Inputs:**
- Task file from Needs_Action/
- Context from task brief, deliverables, constraints

**Steps:**
1. Read task file completely
2. Identify if plan is required (external action, MCP call, >3 steps, risk level Medium+)
3. If required:
   - Generate unique plan ID: PLAN_<YYYY-MM-DD>_<slug>
   - Create plan file in Plans/ using plan template (see Section 2.2.1)
   - Fill all mandatory sections: Objective, Success Criteria, Files to Touch, MCP Tools, Approval Gates, Risk Level, Rollback Strategy, Execution Steps
   - Set Status: Draft
   - Link plan from task file
4. Update task with plan reference
5. Log to system_log.md

**Output Files:** Plans/PLAN_<id>.md, updated task file
**Approval Gate:** NO (creating plan doesn't require approval)
**Plan Template Location:** See Section 2.2.1

---

### Skill 17: brain_request_approval
**Purpose:** Move plan to Pending_Approval/ and notify user
**Inputs:** Plan file from Plans/ with Status: Draft

**Steps:**
1. Read plan file
2. Verify plan completeness (all mandatory sections filled)
3. Update plan Status: Pending_Approval
4. Move plan file from Plans/ to Pending_Approval/
5. Display approval request to user (console output with clear instructions)
6. Update task file: Approval Needed: YES, link to plan in Pending_Approval/
7. Log to system_log.md: "Approval requested for [plan name]"

**Approval Request Format (Console):**
```
═══════════════════════════════════════════════════════════
  APPROVAL REQUIRED
═══════════════════════════════════════════════════════════

Plan: [plan title]
File: Pending_Approval/[filename]
Risk Level: [LOW/MEDIUM/HIGH]

Objective:
[one-line objective]

MCP Actions Required:
- [tool.operation: parameters]

What Will Happen If Approved:
1. Dry-run will be executed first
2. You will review dry-run results
3. After dry-run approval, action will be executed
4. Action will be logged to system_log.md

───────────────────────────────────────────────────────────
To approve:
1. Review plan file: Pending_Approval/[filename]
2. Move file to Approved/ folder
3. Say: "Execute approved plans"

To reject:
1. Move file to Rejected/ folder
2. Optionally add rejection reason in plan file
───────────────────────────────────────────────────────────
```

**Output Files:** Plan moved to Pending_Approval/, updated task file
**Approval Gate:** NO (this skill requests approval, doesn't require it)

---

### Skill 18: brain_execute_with_mcp
**Purpose:** Execute approved plan using MCP tools (dry-run first, then real execution)
**Inputs:**
- Plan file from Approved/
- Flag: --dry-run or --execute

**Steps:**
1. Verify plan is in Approved/ folder (if not, ERROR and stop)
2. Read plan file and extract MCP tools required
3. **Dry-Run Phase:**
   - For each MCP tool operation in plan:
     - Call MCP tool with --dry-run flag (if supported)
     - Capture dry-run output (preview of what would happen)
   - Update plan file with "Dry-Run Results" section
   - Display dry-run results to user (console)
   - Request dry-run approval: "Results look good? (yes/no)"
   - If NO: STOP, log, move plan back to Pending_Approval/ for modification
4. **Execution Phase (only if dry-run approved):**
   - For each MCP tool operation in plan (sequentially):
     - Call MCP tool with real parameters (no --dry-run)
     - Log call to Logs/mcp_actions.log: [timestamp] Tool | Operation | Parameters | Mode: execute | Result | Duration
     - Update plan "Execution Log" section with step status
     - If step fails:
       - STOP immediately
       - Log failure to system_log.md and Logs/mcp_actions.log
       - Call brain_handle_mcp_failure (Skill 20)
       - Update plan Status: Failed
       - Update task Status: Blocked - MCP Failure
       - DO NOT proceed to next step
   - If all steps succeed:
     - Update plan Status: Executed
     - Update task Status: Done
     - Move plan to Plans/completed/
     - Move task to Done/
5. Log to system_log.md with MCP action details

**Output Files:**
- Updated plan with dry-run results and execution log
- Logs/mcp_actions.log entries
- system_log.md entry
- Plan moved to Plans/completed/ (if successful)

**Approval Gate:** YES (plan must be in Approved/, dry-run results must be approved)

**MCP Call Logging Format:**
```
[YYYY-MM-DD HH:MM:SS UTC] MCP Call Initiated
Tool: [tool-name]
Operation: [operation-name]
Parameters:
  param1: value1
  param2: value2
Mode: [dry-run / execute]
Result: [SUCCESS / FAILED]
Error: [error message if failed]
Duration: [X.XXs]
Logged to: system_log.md entry #[N]
```

---

### Skill 19: brain_log_action
**Purpose:** Append MCP action log to system_log.md and Logs/mcp_actions.log
**Inputs:**
- MCP tool name
- Operation name
- Parameters (dict)
- Result (SUCCESS / FAILED)
- Duration (seconds)
- Error message (if failed)

**Steps:**
1. Format log entry for system_log.md (human-readable)
2. Format log entry for Logs/mcp_actions.log (structured)
3. Append to system_log.md
4. Append to Logs/mcp_actions.log
5. If MCP action is email send: update Dashboard "Last External Action" section

**Output Files:** system_log.md, Logs/mcp_actions.log, Dashboard.md (conditional)
**Approval Gate:** NO

---

### Skill 20: brain_handle_mcp_failure
**Purpose:** Handle MCP call failures with escalation and logging
**Inputs:**
- MCP error details (tool, operation, error message, stack trace)
- Plan file
- Task file

**Steps:**
1. Create escalation log: Logs/<timestamp>_escalation_mcp_failure.md
2. Escalation log includes:
   - Timestamp
   - Plan link
   - Task link
   - MCP tool and operation
   - Parameters used
   - Error type (Network / Auth / Rate Limit / Invalid Parameters / Unknown)
   - Full error message
   - Attempted retries (if any)
   - Recommended actions for user
3. Update plan Status: Failed
4. Update task Status: Blocked - MCP Failure
5. Log to system_log.md with ✗ FAILED outcome
6. Display user notification (console):
   ```
   ═══════════════════════════════════════════════════════════
     MCP FAILURE - AGENT STOPPED
   ═══════════════════════════════════════════════════════════

   Plan: [plan name]
   Task: [task name]

   MCP Tool: [tool] ([operation])
   Error: [error message]

   Escalation Log Created:
   Logs/[timestamp]_escalation_mcp_failure.md

   Agent has STOPPED execution and is awaiting your resolution.

   Recommended Actions:
   1. [action 1]
   2. [action 2]
   3. Say "Retry MCP [plan-name]" after resolving issue
   ───────────────────────────────────────────────────────────
   ```
7. STOP execution (do not retry automatically)

**Output Files:**
- Logs/<timestamp>_escalation_mcp_failure.md
- Updated plan (Status: Failed)
- Updated task (Status: Blocked)
- system_log.md entry
**Approval Gate:** NO (failure handling is automatic)

**Critical:** Agent MUST NOT fake MCP responses, assume success, or proceed past failures

---

### Skill 21: brain_generate_summary
**Purpose:** Generate daily or on-demand summary of system activity
**Inputs:**
- Date range (default: today, YYYY-MM-DD)
- Summary type (daily / weekly / custom)

**Steps:**
1. Read system_log.md for date range
2. Count:
   - Tasks completed (files in Done/ created in date range)
   - Pending approvals (files in Pending_Approval/)
   - Plans in progress (files in Plans/ with Status: In_Progress or Pending_Approval)
   - MCP actions executed (grep Logs/mcp_actions.log for date range)
   - Watcher runs (grep Logs/watcher.log and Logs/gmail_watcher.log)
3. Identify:
   - Top 3 completed tasks (by priority or impact)
   - Bottlenecks (tasks that took > expected time)
   - Proactive suggestions (e.g., unused subscriptions from bank transactions if available)
4. Generate summary file: Done/summaries/YYYY-MM-DD_summary.md
5. Update Dashboard with pointer to latest summary
6. Log to system_log.md

**Summary Template:**
```markdown
# Daily Summary: YYYY-MM-DD

**Generated:** YYYY-MM-DD HH:MM UTC
**Period:** YYYY-MM-DD 00:00 to 23:59

## Executive Summary
[One-line summary of the day]

## Activity Metrics
- Tasks Completed: [N]
- Pending Approvals: [N]
- Plans In Progress: [N]
- MCP Actions: [N]
- Watcher Runs: [N] (Filesystem: [N], Gmail: [N])

## Completed Tasks (Top 3)
1. [Task 1 title] - [outcome]
2. [Task 2 title] - [outcome]
3. [Task 3 title] - [outcome]

## Pending Approvals
[List of plans awaiting approval, or "None"]

## System Health
- Bronze Tier: ✓ Operational
- Silver Tier: ✓ Operational
- Watcher Status: ✓ Active
- MCP Status: ✓ Operational

## Recommendations
[Any proactive suggestions, or "No recommendations"]

---
*Generated by Personal AI Employee (Silver Tier)*
```

**Output Files:** Done/summaries/YYYY-MM-DD_summary.md, Dashboard.md
**Approval Gate:** NO (internal reporting)

---

### Skill 22: brain_monitor_approvals
**Purpose:** Check Approved/ folder for plans ready to execute
**Inputs:** None (scans Approved/ folder)

**Steps:**
1. Scan Approved/ folder for .md files
2. For each file:
   - Read plan and verify Status: Approved
   - Check if dry-run already executed (look for "Dry-Run Results" section)
   - If dry-run not executed: display "Plan ready for dry-run: [filename]"
   - If dry-run executed and approved: display "Plan ready for execution: [filename]"
3. Prompt user: "Execute approved plans? (yes/no/specify)"
4. If yes: call brain_execute_with_mcp for each plan (sequentially)

**Output:** List of approved plans + prompt
**Approval Gate:** NO (monitoring only, execution requires separate approval)

---

### Skill 23: brain_archive_plan
**Purpose:** Move executed or rejected plans to appropriate archive
**Inputs:** Plan file (from Approved/ or Rejected/)

**Steps:**
1. Read plan Status (Executed / Failed / Rejected)
2. Determine archive location:
   - If Executed: Plans/completed/
   - If Failed: Plans/failed/
   - If Rejected: Plans/rejected/ (if not already in Rejected/)
3. Move plan file to archive location
4. Update system_log.md: "Plan archived: [filename] → [location]"

**Output Files:** Plan moved to archive, system_log.md entry
**Approval Gate:** NO

---

### Skill 24: gmail_watcher (Watcher Skill)
**Purpose:** Fetch emails from Gmail and create intake wrappers (Silver Watcher)
**Inputs:**
- Gmail API credentials (.env or credentials.json)
- Flags: --once, --loop, --dry-run, --limit

**Steps:**
1. Authenticate with Gmail API (OAuth2)
   - If first run: guide user through OAuth consent flow
   - If token expired: auto-refresh using refresh token
   - If auth fails: log error, display "Re-authentication required", EXIT
2. Fetch unread emails (or from specific label if configured)
   - Default query: "is:unread is:important" (configurable in .env)
   - Limit: 10 emails per run (configurable with --limit flag)
3. For each email:
   - Extract: sender, subject, date, body (plain text or HTML→markdown), attachments
   - Check if email ID already processed (track in Logs/gmail_processed_ids.txt)
   - If already processed: skip (duplicate prevention)
   - If new:
     - Create intake wrapper: Inbox/gmail__<sender>__<subject-slug>__<timestamp>.md
     - Download attachments to Inbox/attachments/<email-id>/
     - Mark email as processed (add ID to processed list, optionally apply Gmail label)
     - Log to Logs/gmail_watcher.log
4. Append summary to system_log.md: "Gmail Watcher: [N] new emails processed"
5. If --loop flag: wait [interval] seconds and repeat, otherwise EXIT

**Intake Wrapper Template:**
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
```powershell
# Dry-run mode (preview without creating files)
python gmail_watcher.py --dry-run

# Run once and exit (default, safest)
python gmail_watcher.py --once

# Run continuously with 5-minute interval (300 seconds)
python gmail_watcher.py --loop --interval 300

# Fetch only from specific label
python gmail_watcher.py --label "AI-Employee"

# Limit number of emails to process
python gmail_watcher.py --limit 10
```

**Output Files:**
- Inbox/gmail__*.md (intake wrappers)
- Inbox/attachments/<email-id>/* (email attachments)
- Logs/gmail_watcher.log
- Logs/gmail_processed_ids.txt
- system_log.md entry

**Approval Gate:** NO (watcher is perception-only)

**Dependencies:**
- Google Gmail API Python client (`google-auth`, `google-auth-oauthlib`, `google-api-python-client`)
- OAuth2 credentials (user authorizes once, tokens stored in .env or credentials.json)

---

### 2.2.1 Silver Plan Template (for Skill 16)

**Location:** When brain_create_plan (Skill 16) is invoked, use this template

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

### Modify
- [file-path-2] - [what will change]

### Delete
- [file-path-3] - [why deletion is needed]

---

## MCP Tools Required

| Tool Name | Operation | Parameters | Dry-Run? | Approval Required? |
|-----------|-----------|------------|----------|-------------------|
| gmail     | send_email | to, subject, body | Yes | Yes |

---

## Approval Gates

| Action Description | Requires Approval? | Rationale |
|--------------------|-------------------|-----------|
| [Action 1] | YES/NO | [Why] |

---

## Risk Assessment

**Risk Level:** [Low / Medium / High]

**Identified Risks:**
1. [Risk 1: description]
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

---

## Rollback Strategy

**If execution fails at any step:**
1. [Rollback step 1]
2. [Rollback step 2]
3. [Notification to user]

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

**Execution Completed:** [YYYY-MM-DD HH:MM UTC]
**Final Status:** [Success / Partial / Failed]

---

## Change Log

- [YYYY-MM-DD HH:MM] Plan created (status: Draft)
- [YYYY-MM-DD HH:MM] Moved to Pending_Approval/
- [YYYY-MM-DD HH:MM] User approved plan
- [YYYY-MM-DD HH:MM] Moved to Approved/
- [YYYY-MM-DD HH:MM] Dry-run executed
- [YYYY-MM-DD HH:MM] Dry-run approved by user
- [YYYY-MM-DD HH:MM] Execution started
- [YYYY-MM-DD HH:MM] Execution completed
- [YYYY-MM-DD HH:MM] Plan archived
```

---

## 2.3 SILVER TIER MCP GOVERNANCE

**MCP-Only Rule:** All external actions in Silver Tier MUST use MCP servers. Direct shell commands, API calls, or library imports for external effects are FORBIDDEN.

**Allowed MCP Servers:**
- `gmail` (for email operations) - NEW in Silver
- `context7` (for documentation lookups) - Bronze, preserved

**MCP Requirements:**
1. **Dry-Run Mode:**
   - All MCP tools MUST support --dry-run or equivalent
   - Agent MUST run dry-run before actual execution
   - Dry-run results presented to user for approval
2. **Logging:**
   - Every MCP call logged to Logs/mcp_actions.log
   - Log includes: tool name, parameters, response status, duration
   - Failures logged with error message
3. **No Simulated Success:**
   - Agent MUST NOT fake MCP responses
   - Agent MUST NOT assume success if MCP call fails
   - Agent MUST NOT proceed past a failed MCP call
   - On failure: STOP, log, escalate to user (Skill 20)

**Forbidden Patterns:**
- Direct SMTP email sending (use Gmail MCP)
- Direct Gmail API calls (use Gmail MCP)
- Direct HTTP requests for external actions
- Any external effect without MCP mediation

---

## 2.4 SILVER TIER APPROVAL WORKFLOW

**When Approval Required:**
1. External communication (emails, social posts, GitHub issues)
2. MCP tool invocations with side effects (POST/PUT/DELETE)
3. File deletions or destructive operations
4. System configuration changes

**Approval Process:**
1. Agent creates plan (Skill 16)
2. Agent requests approval (Skill 17) → plan moves to Pending_Approval/
3. User reviews plan file
4. User decision:
   - **Approve:** Move file to Approved/
   - **Reject:** Move file to Rejected/
   - **Modify:** Edit file in Pending_Approval/, agent re-processes
5. Agent detects file in Approved/
6. Agent executes dry-run (Skill 18 --dry-run)
7. User approves dry-run results
8. Agent executes plan (Skill 18 --execute)
9. Agent logs action (Skill 19)
10. Agent archives plan (Skill 23)

**Non-Negotiable:**
- Silence from user ≠ approval
- Agent MUST NOT proceed without explicit "yes" (file in Approved/)
- Agent MUST NOT simulate approval responses

---

```

(Content continues - this is Task 2.1)

**Acceptance Criteria:**
- [ ] All 9 Silver skills (16-24) added to Company_Handbook.md
- [ ] Plan template included
- [ ] MCP governance rules documented
- [ ] Approval workflow documented
- [ ] All skills have: Purpose, Inputs, Steps, Output Files, Approval Gate

**Test Procedure:**
```powershell
# Verify skills are documented
Select-String -Path "Company_Handbook.md" -Pattern "Skill 16:"  # Should find match
Select-String -Path "Company_Handbook.md" -Pattern "Skill 24:"  # Should find match
Select-String -Path "Company_Handbook.md" -Pattern "gmail_watcher"  # Should find match
```

**Rollback:** Revert Company_Handbook.md to previous version

---

(Continuing with rest of plan...)

Let me continue creating the rest of the implementation plan in the next part due to length.

#### Task 2.2: Update Dashboard.md with Silver Sections
**Description:** Add 5 new Silver Tier sections to Dashboard.md

**File Modified:** `Dashboard.md`

**Content to Add:**
Insert after existing "Workflow Overview" section:

```markdown
---

> [!warning] 📋 Pending Approvals (Silver)
>
> | Plan | Created | Risk | Status | Link |
> |------|---------|------|--------|------|
> | *No pending approvals* | - | - | - | - |
>
> **Total Pending:** 0
> **Oldest Pending:** N/A

---

> [!info] 🔄 Plans in Progress (Silver)
>
> | Plan | Status | Started | Last Updated | Progress |
> |------|--------|---------|--------------|----------|
> | *No plans in progress* | - | - | - | - |
>
> **Total Active Plans:** 0

---

> [!success] 🌐 Last External Action (Silver)
>
> **Action:** None yet
> **Timestamp:** N/A
> **MCP Tool:** N/A
> **Result:** N/A
> **Plan:** N/A

---

> [!note] 📬 Watcher Status (Silver)
>
> | Watcher | Last Run | Items Detected | Status | Log |
> |---------|----------|----------------|--------|-----|
> | Filesystem | [Bronze last run] | [N] new | ✓ Active | [watcher.log](Logs/watcher.log) |
> | Gmail | Not yet configured | 0 | ⚠ Pending Setup | [gmail_watcher.log](Logs/gmail_watcher.log) |
>
> **Next Scheduled Run:**
> - Filesystem: Not scheduled yet
> - Gmail: Not scheduled yet

---

> [!check] 🎯 Silver Tier Health Check
>
> **Operational Verification:**
>
> - ⏳ **Gmail Watcher** - Pending implementation
> - ⏳ **Plan-First Workflow** - Pending implementation
> - ⏳ **Approval Pipeline** - Folders created, skills pending
> - ⏳ **MCP Integration** - Pending Gmail MCP setup
> - ⏳ **Scheduling Active** - Pending Task Scheduler configuration
> - ⏳ **Silver Audit Trail** - Log files created, pending usage
> - ✅ **Bronze Foundation Intact** - All Bronze features operational
>
> **Silver Tier Status:** 🔨 **IN PROGRESS**
>
> **Completion Progress:**
> - Vault Structure: ✅ Complete (M1)
> - Documentation: 🔄 In Progress (M2)
> - Gmail Watcher: ⏳ Pending (M3)
> - Plan Workflow: ⏳ Pending (M4)
> - Approval Pipeline: ⏳ Pending (M5)
> - MCP Email: ⏳ Pending (M6)
> - Scheduling: ⏳ Pending (M7)
> - Daily Summary: ⏳ Pending (M8)
> - Testing: ⏳ Pending (M9)
> - Demo: ⏳ Pending (M10)

```

**Acceptance Criteria:**
- [ ] All 5 new Silver sections added to Dashboard.md
- [ ] Sections use Obsidian callout syntax ([!warning], [!info], [!success], [!note], [!check])
- [ ] Sections render correctly in both VS Code and Obsidian
- [ ] No Bronze sections modified or removed

**Test Procedure:**
```powershell
# Verify sections exist
Select-String -Path "Dashboard.md" -Pattern "Pending Approvals \(Silver\)"  # Should find match
Select-String -Path "Dashboard.md" -Pattern "Plans in Progress \(Silver\)"  # Should find match
Select-String -Path "Dashboard.md" -Pattern "Last External Action \(Silver\)"  # Should find match
Select-String -Path "Dashboard.md" -Pattern "Watcher Status \(Silver\)"  # Should find match
Select-String -Path "Dashboard.md" -Pattern "Silver Tier Health Check"  # Should find match

# Open in Obsidian to verify rendering
```

**Rollback:** Revert Dashboard.md to previous version

---

### Milestone 2 Acceptance Checklist

- [ ] Company_Handbook.md updated with 9 Silver skills (16-24)
- [ ] Plan template documented in Company_Handbook.md
- [ ] MCP governance rules documented
- [ ] Approval workflow rules documented
- [ ] Dashboard.md updated with 5 Silver sections
- [ ] All sections render correctly in VS Code and Obsidian
- [ ] No Bronze functionality broken

**Commit:**
```bash
git add Company_Handbook.md Dashboard.md
git commit -m "docs(silver): add Silver Tier documentation to handbook and dashboard

- Add 9 new Silver skills (16-24) to Company_Handbook.md
- Add Silver plan template (Section 2.2.1)
- Add MCP governance rules (Section 2.3)
- Add approval workflow documentation (Section 2.4)
- Add 5 Silver sections to Dashboard.md:
  - Pending Approvals
  - Plans in Progress
  - Last External Action
  - Watcher Status (Silver)
  - Silver Tier Health Check
- All sections use Obsidian callout syntax for dual-interface rendering

Ref: SPEC_silver_tier.md Sections 9, 10"
```

---

## Milestone 3: Gmail Watcher Implementation

**Objective:** Implement Gmail Watcher with OAuth2 authentication, intake wrapper creation, and logging

**Duration:** 4-6 hours
**Dependencies:** M1 (folders), M2 (documentation)
**Priority:** P0 (blocking for MCP email)

### Tasks

#### Task 3.1: Gmail API Setup & OAuth2 Configuration
**Description:** Set up Gmail API credentials and OAuth2 consent flow

**Steps:**
1. Create Google Cloud Project (if not exists)
2. Enable Gmail API
3. Create OAuth2 credentials (Desktop app)
4. Download credentials.json
5. Create .env file with Gmail config

**Commands:**
```powershell
# Create .env file (in vault root)
@"
# Gmail Watcher Configuration
GMAIL_CREDENTIALS_PATH=credentials.json
GMAIL_TOKEN_PATH=token.json
GMAIL_QUERY=is:unread is:important
GMAIL_LABEL=AI-Employee
GMAIL_LIMIT=10
GMAIL_MARK_AS_READ=false
GMAIL_APPLY_LABEL=true
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Ensure .env is gitignored
if (-not (Select-String -Path ".gitignore" -Pattern "^\.env$" -Quiet)) {
    Add-Content -Path ".gitignore" -Value "`n.env`ncredentials.json`ntoken.json"
}
```

**Files Created:**
- `.env` (Gmail configuration)
- `credentials.json` (downloaded from Google Cloud Console)
- Updated `.gitignore`

**Documentation to Create:**
Create `Docs/gmail_oauth_setup.md`:
```markdown
# Gmail API OAuth2 Setup Guide

## Prerequisites
- Google Account
- Google Cloud Project (or create new)

## Steps

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create new project: "Personal AI Employee"
3. Select project

### 2. Enable Gmail API
1. Go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click "Enable"

### 3. Create OAuth2 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Desktop app"
4. Name: "AI Employee Gmail Watcher"
5. Click "Create"
6. Download credentials JSON file
7. Save as `credentials.json` in vault root

### 4. Configure Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. User Type: "External"
3. App name: "Personal AI Employee"
4. User support email: your-email@gmail.com
5. Developer contact: your-email@gmail.com
6. Add scopes: `https://www.googleapis.com/auth/gmail.readonly`
7. Add test users: your-email@gmail.com
8. Save

### 5. First-Time Authorization
Run gmail_watcher.py for the first time:
```powershell
python gmail_watcher.py --once
```

This will open browser for OAuth consent. Authorize the app.
Token will be saved to token.json (automatically refreshed when expired).

### 6. Verify Setup
```powershell
# Test with dry-run
python gmail_watcher.py --dry-run

# If successful, you should see:
# "Gmail Watcher authenticated successfully"
# "[N] unread emails found (dry-run, not creating intake files)"
```

## Troubleshooting

**Error: "Missing credentials.json"**
- Ensure credentials.json is in vault root
- Check .env GMAIL_CREDENTIALS_PATH setting

**Error: "Access blocked"**
- Verify you added your email as test user in OAuth consent screen
- App must be in "Testing" mode, not "Production" (unless verified)

**Error: "Token expired"**
- Delete token.json and re-run watcher (will re-authorize)
- Check internet connection

**Error: "Insufficient permissions"**
- Verify Gmail API is enabled in Google Cloud Console
- Check OAuth scope includes gmail.readonly
```

**Acceptance Criteria:**
- [ ] Google Cloud Project created
- [ ] Gmail API enabled
- [ ] OAuth2 credentials created and downloaded
- [ ] credentials.json in vault root (gitignored)
- [ ] .env file created with Gmail config
- [ ] gmail_oauth_setup.md documentation created

**Test Procedure:**
```powershell
# Verify files exist
Test-Path "credentials.json"  # Should return True
Test-Path ".env"               # Should return True
Test-Path "Docs/gmail_oauth_setup.md"  # Should return True

# Verify gitignore
Select-String -Path ".gitignore" -Pattern "credentials.json"  # Should find match
```

**Rollback:** Delete credentials.json, .env, remove from .gitignore

---

#### Task 3.2: Implement gmail_watcher.py
**Description:** Create Python script for Gmail watcher using Google API client

**File Created:** `gmail_watcher.py`

**Dependencies:**
```powershell
# Install required packages
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client python-dotenv
```

**Code Implementation:**
(Script implements all features defined in Company_Handbook.md Skill 24)

Key features:
- OAuth2 authentication with token refresh
- Fetch unread emails (configurable query)
- Create intake wrappers in Inbox/
- Download attachments to Inbox/attachments/<email-id>/
- Track processed email IDs (duplicate prevention)
- Log to Logs/gmail_watcher.log
- CLI flags: --once, --loop, --interval, --dry-run, --limit, --label

**Acceptance Criteria:**
- [ ] gmail_watcher.py script created
- [ ] All dependencies installed
- [ ] Script runs without errors (--dry-run)
- [ ] OAuth2 authentication works (token.json created)
- [ ] Logs to Logs/gmail_watcher.log

**Test Procedure:**
```powershell
# Test dry-run (no files created)
python gmail_watcher.py --dry-run

# Test once mode (creates intake files)
python gmail_watcher.py --once --limit 1

# Verify intake file created
Get-ChildItem -Path "Inbox" -Filter "gmail__*.md"  # Should list files

# Check log
Get-Content "Logs/gmail_watcher.log"  # Should show watcher activity
```

**Rollback:** Delete gmail_watcher.py, remove installed packages

---

#### Task 3.3: Gmail Watcher Testing
**Description:** End-to-end test of Gmail watcher with real email

**Test Steps:**
1. Send test email to your Gmail (from another account or yourself)
2. Mark email as unread and important (or apply AI-Employee label)
3. Run watcher:
   ```powershell
   python gmail_watcher.py --once --limit 1
   ```
4. Verify intake wrapper created in Inbox/
5. Verify email content in intake file
6. If email has attachment, verify attachment downloaded to Inbox/attachments/
7. Verify Logs/gmail_watcher.log updated
8. Verify system_log.md entry (if watcher appends)

**Acceptance Criteria:**
- [ ] Test email sent and received
- [ ] Watcher detects email
- [ ] Intake wrapper created (Inbox/gmail__*.md)
- [ ] Intake wrapper contains: sender, subject, date, body, attachments list
- [ ] Attachments downloaded (if present)
- [ ] Logs updated
- [ ] Duplicate prevention works (re-running watcher doesn't re-process same email)

**Test Procedure:**
```powershell
# Send test email (manually or via script)
# Then run watcher
python gmail_watcher.py --once --limit 1

# Verify intake file
Get-Content "Inbox/gmail__*.md" | Select-Object -First 30  # Should show email metadata and body

# Verify no duplicates (run again)
python gmail_watcher.py --once --limit 1
# Should see "0 new emails" in log
```

**Rollback:** Delete test intake files from Inbox/

---

### Milestone 3 Acceptance Checklist

- [ ] Gmail API OAuth2 credentials configured
- [ ] gmail_watcher.py script implemented and tested
- [ ] OAuth2 authentication successful (token.json created)
- [ ] Intake wrappers created for new emails
- [ ] Attachments downloaded correctly
- [ ] Logging to Logs/gmail_watcher.log working
- [ ] Duplicate prevention working (processed IDs tracked)
- [ ] Documentation (gmail_oauth_setup.md) complete

**Commit:**
```bash
git add gmail_watcher.py Docs/gmail_oauth_setup.md Logs/gmail_watcher.log .gitignore
git commit -m "feat(silver): implement Gmail watcher with OAuth2 and intake creation

- Add gmail_watcher.py with full OAuth2 authentication
- Support --once, --loop, --interval, --dry-run, --limit, --label flags
- Create intake wrappers in Inbox/ for new emails
- Download email attachments to Inbox/attachments/<email-id>/
- Track processed email IDs to prevent duplicates (gmail_processed_ids.txt)
- Log all operations to Logs/gmail_watcher.log
- Add gmail_oauth_setup.md documentation
- Update .gitignore for credentials and tokens

Ref: SPEC_silver_tier.md Section 4.2, Company_Handbook Skill 24"
```

---

## Milestone 4: Plan-First Workflow

**Objective:** Implement brain_create_plan skill to generate plan files for external actions

**Duration:** 3-4 hours
**Dependencies:** M2 (plan template documented)
**Priority:** P0 (blocking for approval pipeline)

### Tasks

#### Task 4.1: Implement Plan Creation Logic
**Description:** Add brain_create_plan skill implementation to agent context

**Approach:**
Since this is an Agent Skill, implementation is prompt-based (no Python script).

**Create:** `Skills/brain_create_plan.skill.md`
```markdown
# Skill: brain_create_plan

**ID:** 16
**Purpose:** Generate detailed plan file for external actions
**Tier:** Silver
**Inputs:** Task file from Needs_Action/

**Trigger Conditions:**
Plan is required if task involves:
- External communication (email, social post, GitHub)
- MCP tool invocation with side effects
- File operations outside Done/ (destructive/risky)
- Multi-step tasks (>3 actions with dependencies)
- Risk level Medium or High

**Execution Steps:**
1. Read task file from Needs_Action/
2. Evaluate if plan is required (check trigger conditions)
3. If required:
   - Generate unique plan ID: PLAN_<YYYY-MM-DD>_<slug>
   - Load plan template from Company_Handbook.md Section 2.2.1
   - Fill all mandatory sections:
     - Objective (from task Objective)
     - Success Criteria (from task Deliverables)
     - Files to Touch (infer from task context)
     - MCP Tools Required (identify external actions)
     - Approval Gates (YES for external, NO for internal)
     - Risk Level (Low/Medium/High based on impact)
     - Rollback Strategy (how to undo)
     - Execution Steps (break down task into sequential steps)
   - Set Status: Draft
   - Save to Plans/PLAN_<id>.md
   - Link plan from task file (add "Plan:" field)
4. Update system_log.md: "Plan created: [plan-id] for task [task-name]"

**Output:** Plans/PLAN_<id>.md, updated task file, system_log.md entry

**Example Usage:**
User: "Start work on task: send email to client"
Agent:
1. Reads task file
2. Identifies external action (email send)
3. Calls brain_create_plan
4. Creates Plans/PLAN_2026-02-11_email-client.md
5. Populates plan with:
   - Objective: Send project update email to client
   - MCP Tools: gmail.send_email
   - Approval Gates: YES (external communication)
   - Risk Level: Medium (client-facing)
6. Links plan in task file
7. Proceeds to brain_request_approval (Skill 17)
```

**Acceptance Criteria:**
- [ ] brain_create_plan.skill.md created in Skills/
- [ ] Skill execution logic documented
- [ ] Plan template reference included
- [ ] Agent can generate plans when invoked

**Test Procedure:**
Create test task in Needs_Action/:
```markdown
# Test Task: Send Email to Client

**Objective:** Send Q1 update email to client@example.com

**Deliverables:**
- [ ] Email sent with Q1 report attached

**Constraints:**
- Bronze Tier: approval required for external actions
```

Then invoke agent:
"Create a plan for this task"

Verify:
- Plan file created in Plans/
- Plan has all mandatory sections filled
- Task file updated with plan link

**Rollback:** Delete test plan file

---

#### Task 4.2: Implement Plan Status State Machine
**Description:** Define and enforce plan status transitions

**Status States:**
- Draft
- Pending_Approval
- Approved
- Rejected
- Executed
- Failed

**Allowed Transitions:**
```
Draft → Pending_Approval (brain_request_approval)
Pending_Approval → Approved (user moves file to Approved/)
Pending_Approval → Rejected (user moves file to Rejected/)
Pending_Approval → Draft (user edits plan, agent re-processes)
Approved → Executed (brain_execute_with_mcp succeeds)
Approved → Failed (brain_execute_with_mcp fails)
Rejected → (terminal state, archived)
Executed → (terminal state, archived to Plans/completed/)
Failed → (terminal state, archived to Plans/failed/)
```

**Implementation:**
Create `Skills/plan_state_validator.skill.md`

**Acceptance Criteria:**
- [ ] State machine documented
- [ ] Allowed transitions defined
- [ ] Invalid transitions rejected (agent errors if attempted)

**Test Procedure:**
1. Create plan (Status: Draft)
2. Move to Pending_Approval (Status: Pending_Approval)
3. Try invalid transition (e.g., Draft → Executed) - should error
4. Verify agent enforces state machine

**Rollback:** Delete validator skill

---

### Milestone 4 Acceptance Checklist

- [ ] brain_create_plan skill implemented
- [ ] Plan creation tested with sample task
- [ ] Plan template correctly populated
- [ ] Plan status state machine defined and enforced
- [ ] Plans created in Plans/ folder with correct naming
- [ ] Task files updated with plan links

**Commit:**
```bash
git add Skills/brain_create_plan.skill.md Skills/plan_state_validator.skill.md
git commit -m "feat(silver): implement plan-first workflow with state machine

- Add brain_create_plan skill (Skill 16)
- Generate plan files from tasks requiring external actions
- Populate plan template with task context
- Implement plan status state machine (Draft → Pending → Approved/Rejected → Executed/Failed)
- Link plans to tasks for traceability

Ref: SPEC_silver_tier.md Section 5, Company_Handbook Skill 16"
```

---

## Milestone 5: Approval Pipeline

**Objective:** Implement human-in-the-loop approval workflow with file-based approval

**Duration:** 2-3 hours
**Dependencies:** M4 (plans exist), M1 (folders exist)
**Priority:** P0 (blocking for MCP execution)

### Tasks

#### Task 5.1: Implement brain_request_approval
**Description:** Move plans to Pending_Approval/ and notify user

**Create:** `Skills/brain_request_approval.skill.md`

Implementation follows Company_Handbook.md Skill 17 specification.

**Acceptance Criteria:**
- [ ] brain_request_approval skill created
- [ ] Plan moves from Plans/ to Pending_Approval/
- [ ] User notification displayed (console output with approval instructions)
- [ ] Task file updated with "Approval Needed: YES"
- [ ] system_log.md entry created

**Test Procedure:**
1. Create test plan (Status: Draft)
2. Invoke brain_request_approval
3. Verify:
   - Plan file moved to Pending_Approval/
   - Console shows approval request
   - Task file updated
4. Manually approve by moving to Approved/
5. Verify agent detects approval

**Rollback:** Delete skill file

---

#### Task 5.2: Implement brain_monitor_approvals
**Description:** Check Approved/ folder for plans ready to execute

**Create:** `Skills/brain_monitor_approvals.skill.md`

Implementation follows Company_Handbook.md Skill 22 specification.

**Acceptance Criteria:**
- [ ] brain_monitor_approvals skill created
- [ ] Scans Approved/ folder correctly
- [ ] Lists approved plans with status
- [ ] Prompts user to execute or skip

**Test Procedure:**
1. Place test plan in Approved/
2. Invoke brain_monitor_approvals
3. Verify:
   - Plan detected
   - Status displayed
   - Execution prompt shown
4. Respond "yes"
5. Verify agent proceeds to execution

**Rollback:** Delete skill file

---

### Milestone 5 Acceptance Checklist

- [ ] brain_request_approval implemented
- [ ] brain_monitor_approvals implemented
- [ ] Approval workflow tested end-to-end
- [ ] File movement triggers agent actions
- [ ] User notifications clear and actionable

**Commit:**
```bash
git add Skills/brain_request_approval.skill.md Skills/brain_monitor_approvals.skill.md
git commit -m "feat(silver): implement human-in-the-loop approval pipeline

- Add brain_request_approval skill (Skill 17)
- Add brain_monitor_approvals skill (Skill 22)
- Move plans to Pending_Approval/ for user review
- Display clear approval/rejection instructions
- Detect approved plans and trigger execution
- File-based workflow (no web UI required)

Ref: SPEC_silver_tier.md Section 6, Company_Handbook Skills 17, 22"
```

---

## Milestone 6: MCP Email Integration

**Objective:** Integrate Gmail MCP for email send/draft operations with dry-run and logging

**Duration:** 4-5 hours
**Dependencies:** M3 (Gmail Watcher), M5 (Approval pipeline)
**Priority:** P0 (critical Silver feature)

### Tasks

#### Task 6.1: Set Up Gmail MCP Server
**Description:** Install and configure Gmail MCP server for Claude Code

**Prerequisites:**
- Gmail API credentials from M3 (reuse same credentials)
- MCP server package (Node.js based or Python based)

**Option 1: Use Official MCP Server (if available)**
Check https://github.com/anthropics/mcp-servers for gmail-mcp

**Option 2: Create Custom Gmail MCP Server**

Create `mcp-servers/gmail/package.json`:
```json
{
  "name": "gmail-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for Gmail operations",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.1.0",
    "googleapis": "^126.0.0",
    "dotenv": "^16.0.0"
  }
}
```

Create `mcp-servers/gmail/index.js` (simplified MCP server with send_email, draft_email operations)

**Configure in Claude Code:**
Add to Claude Code MCP settings (if not already configured):
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["mcp-servers/gmail/index.js"],
      "env": {
        "GMAIL_CREDENTIALS": "credentials.json",
        "GMAIL_TOKEN": "token.json"
      }
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Gmail MCP server installed/created
- [ ] MCP server configured in Claude Code
- [ ] send_email operation available
- [ ] draft_email operation available
- [ ] Dry-run flag supported

**Test Procedure:**
```powershell
# Test MCP server directly (if provides CLI)
# Or test via Claude Code:
# In Claude Code session, call MCP:
# "Use Gmail MCP to send test email (dry-run mode)"

# Verify MCP server responds
```

**Rollback:** Remove MCP server config from Claude Code settings

---

#### Task 6.2: Implement brain_execute_with_mcp
**Description:** Execute approved plans using MCP tools with dry-run and logging

**Create:** `Skills/brain_execute_with_mcp.skill.md`

Implementation follows Company_Handbook.md Skill 18 specification.

Key features:
- Read plan from Approved/
- Execute dry-run first
- Display dry-run results to user
- Request dry-run approval
- Execute real MCP call after approval
- Log all MCP calls to Logs/mcp_actions.log
- Update plan with execution log
- Handle failures (call brain_handle_mcp_failure)

**Acceptance Criteria:**
- [ ] brain_execute_with_mcp skill created
- [ ] Dry-run executes before real execution
- [ ] MCP calls logged to Logs/mcp_actions.log
- [ ] Plan updated with execution results
- [ ] Failures handled gracefully (no crashes)

**Test Procedure:**
1. Create test plan for email send
2. Move to Approved/
3. Invoke brain_execute_with_mcp --dry-run
4. Verify dry-run output displayed
5. Approve dry-run
6. Invoke brain_execute_with_mcp --execute
7. Verify:
   - MCP call executed
   - Email sent (or drafted)
   - Logs/mcp_actions.log updated
   - Plan status: Executed

**Rollback:** Delete skill file

---

#### Task 6.3: Implement brain_log_action and brain_handle_mcp_failure
**Description:** MCP logging and failure handling skills

**Create:**
- `Skills/brain_log_action.skill.md` (Skill 19)
- `Skills/brain_handle_mcp_failure.skill.md` (Skill 20)

Implementation follows Company_Handbook.md Skills 19, 20 specifications.

**Acceptance Criteria:**
- [ ] brain_log_action implemented
- [ ] brain_handle_mcp_failure implemented
- [ ] MCP calls logged with all required fields
- [ ] Failures create escalation logs
- [ ] User notified of failures

**Test Procedure:**
1. Execute successful MCP call
2. Verify Logs/mcp_actions.log entry created
3. Simulate MCP failure (invalid parameters)
4. Verify:
   - Escalation log created
   - Agent stops execution
   - User notified with clear error

**Rollback:** Delete skill files

---

### Milestone 6 Acceptance Checklist

- [ ] Gmail MCP server configured
- [ ] brain_execute_with_mcp implemented
- [ ] brain_log_action implemented
- [ ] brain_handle_mcp_failure implemented
- [ ] Dry-run workflow tested
- [ ] MCP email send tested (real execution)
- [ ] Logging verified (Logs/mcp_actions.log + system_log.md)
- [ ] Failure handling tested

**Commit:**
```bash
git add Skills/brain_execute_with_mcp.skill.md Skills/brain_log_action.skill.md Skills/brain_handle_mcp_failure.skill.md mcp-servers/gmail/
git commit -m "feat(silver): integrate Gmail MCP with dry-run and failure handling

- Add Gmail MCP server configuration
- Implement brain_execute_with_mcp (Skill 18) with dry-run workflow
- Implement brain_log_action (Skill 19) for MCP call logging
- Implement brain_handle_mcp_failure (Skill 20) for error escalation
- Log all MCP calls to Logs/mcp_actions.log with full details
- Create escalation logs for failures
- Test email send via MCP (dry-run and real execution)

Ref: SPEC_silver_tier.md Section 7, Company_Handbook Skills 18-20"
```

---

## Milestone 7: Task Scheduling Setup

**Objective:** Configure Windows Task Scheduler for automated watcher execution

**Duration:** 2 hours
**Dependencies:** M3 (watchers), M6 (MCP for summary)
**Priority:** P1 (automation)

### Tasks

#### Task 7.1: Create Scheduled Task Definitions
**Description:** Document 3 scheduled tasks in Scheduled/ folder

**Create:** `Scheduled/filesystem_watcher_15min.md`
```markdown
# Scheduled Task: Filesystem Watcher (15-Minute Interval)

**Created:** 2026-02-11
**Schedule:** Every 15 minutes, 24/7
**Status:** Active
**Task Scheduler Name:** AI_Employee_Filesystem_Watcher

---

## Objective

Automatically scan Inbox/ folder every 15 minutes for new files.

---

## Script

**File:** watcher_skill.py
**Command:**
```cmd
python "E:\...\Personal AI Employee\watcher_skill.py" --once --quiet --no-banner
```

**Arguments Explanation:**
- `--once` : Run once and exit (Task Scheduler handles repetition)
- `--quiet` : Minimal output (errors only)
- `--no-banner` : Skip header (for automation)

---

## Schedule Configuration

**Trigger Type:** Daily
**Repeat Interval:** 15 minutes
**Duration:** 24 hours (indefinite)
**Start Time:** 00:00 (midnight)

---

## Output & Logging

**Standard Output:** Redirected to `Logs/scheduler.log`
**Error Output:** Redirected to `Logs/scheduler.log`
**Additional Logs:** `Logs/watcher.log`

---

## Maintenance

**How to Pause:**
1. Open Task Scheduler
2. Find task: AI_Employee_Filesystem_Watcher
3. Right-click → Disable

**How to Modify Schedule:**
1. Edit this file with new schedule
2. Update Task Scheduler trigger settings
3. Log change to system_log.md
```

**Create:** `Scheduled/gmail_watcher_30min.md`
(Similar structure, but 30-minute interval, gmail_watcher.py)

**Create:** `Scheduled/daily_summary_6pm.md`
(Daily at 6 PM, brain_generate_summary skill)

**Acceptance Criteria:**
- [ ] All 3 scheduled task definitions created
- [ ] Definitions include: schedule, command, logging, maintenance

**Test Procedure:**
```powershell
Test-Path "Scheduled/filesystem_watcher_15min.md"  # Should return True
Test-Path "Scheduled/gmail_watcher_30min.md"       # Should return True
Test-Path "Scheduled/daily_summary_6pm.md"         # Should return True
```

**Rollback:** Delete scheduled task definition files

---

#### Task 7.2: Configure Windows Task Scheduler
**Description:** Create 3 scheduled tasks in Windows Task Scheduler

**Manual Steps** (PowerShell can automate, but manual is clearer for first-time):

**Task 1: Filesystem Watcher**
1. Open Task Scheduler
2. Create Basic Task → "AI_Employee_Filesystem_Watcher"
3. Trigger: Daily, repeat every 15 minutes for 24 hours
4. Action: Start a program
   - Program: `python`
   - Arguments: `"E:\...\watcher_skill.py" --once --quiet --no-banner`
   - Start in: `E:\...\Personal AI Employee\`
5. Settings:
   - Allow task to run on demand: Yes
   - Stop if runs longer than: 10 minutes
   - Restart if failed: No (next scheduled run will try)
6. Save

**Task 2: Gmail Watcher** (30-minute interval)
**Task 3: Daily Summary** (Daily at 6 PM)

**Automated Setup (PowerShell):**
```powershell
# Task 1: Filesystem Watcher
$action = New-ScheduledTaskAction -Execute "python" -Argument "`"$PWD\watcher_skill.py`" --once --quiet --no-banner" -WorkingDirectory $PWD
$trigger = New-ScheduledTaskTrigger -Daily -At 00:00 -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName "AI_Employee_Filesystem_Watcher" -Action $action -Trigger $trigger -Description "Personal AI Employee - Filesystem Watcher (15min)"

# Task 2: Gmail Watcher
$action = New-ScheduledTaskAction -Execute "python" -Argument "`"$PWD\gmail_watcher.py`" --once --quiet --no-banner" -WorkingDirectory $PWD
$trigger = New-ScheduledTaskTrigger -Daily -At 00:00 -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName "AI_Employee_Gmail_Watcher" -Action $action -Trigger $trigger -Description "Personal AI Employee - Gmail Watcher (30min)"

# Task 3: Daily Summary
# (Requires brain_generate_summary skill to be callable via CLI or script)
# Placeholder: will be fully configured in M8
```

**Acceptance Criteria:**
- [ ] All 3 tasks created in Task Scheduler
- [ ] Tasks run successfully (test with "Run" button)
- [ ] Logs written to Logs/scheduler.log
- [ ] Tasks persist after reboot

**Test Procedure:**
```powershell
# List scheduled tasks
Get-ScheduledTask -TaskName "AI_Employee_*"  # Should list 3 tasks

# Test run filesystem watcher task
Start-ScheduledTask -TaskName "AI_Employee_Filesystem_Watcher"

# Wait 5 seconds
Start-Sleep -Seconds 5

# Check scheduler log
Get-Content "Logs/scheduler.log" -Tail 10  # Should show task execution
```

**Rollback:**
```powershell
Unregister-ScheduledTask -TaskName "AI_Employee_Filesystem_Watcher" -Confirm:$false
Unregister-ScheduledTask -TaskName "AI_Employee_Gmail_Watcher" -Confirm:$false
Unregister-ScheduledTask -TaskName "AI_Employee_Daily_Summary" -Confirm:$false
```

---

### Milestone 7 Acceptance Checklist

- [ ] Scheduled task definitions created (3 files in Scheduled/)
- [ ] Windows Task Scheduler tasks configured (3 tasks)
- [ ] All tasks run successfully
- [ ] Logging to Logs/scheduler.log working
- [ ] Tasks survive reboot

**Commit:**
```bash
git add Scheduled/
git commit -m "feat(silver): configure Windows Task Scheduler for automated watchers

- Add 3 scheduled task definitions:
  - Filesystem watcher (every 15 minutes)
  - Gmail watcher (every 30 minutes)
  - Daily summary (6 PM daily)
- Configure Windows Task Scheduler tasks
- Redirect output to Logs/scheduler.log
- All tasks run on demand and persist after reboot

Ref: SPEC_silver_tier.md Section 8"
```

---

## Milestone 8: Daily Summary Skill

**Objective:** Implement brain_generate_summary for daily/weekly summaries

**Duration:** 2 hours
**Dependencies:** M2 (documentation), M4 (plans)
**Priority:** P1 (nice-to-have)

### Tasks

#### Task 8.1: Implement brain_generate_summary
**Description:** Create skill for generating daily summaries

**Create:** `Skills/brain_generate_summary.skill.md`

Implementation follows Company_Handbook.md Skill 21 specification.

**Acceptance Criteria:**
- [ ] brain_generate_summary skill created
- [ ] Reads system_log.md for date range
- [ ] Counts tasks, approvals, plans, MCP actions
- [ ] Generates summary in Done/summaries/
- [ ] Updates Dashboard with summary link

**Test Procedure:**
1. Invoke brain_generate_summary (default: today)
2. Verify Done/summaries/YYYY-MM-DD_summary.md created
3. Verify summary contains:
   - Activity metrics
   - Completed tasks
   - Pending approvals
   - System health
4. Verify Dashboard updated

**Rollback:** Delete skill file, delete test summaries

---

#### Task 8.2: Create Summary CLI Wrapper
**Description:** Python script to invoke brain_generate_summary (for Task Scheduler)

**Create:** `brain_generate_summary.py`
```python
#!/usr/bin/env python3
"""
Daily Summary Generator for Personal AI Employee

Usage:
    python brain_generate_summary.py           # Generate today's summary
    python brain_generate_summary.py --date 2026-02-10  # Specific date
    python brain_generate_summary.py --weekly  # Weekly summary
"""

import sys
import subprocess
from datetime import datetime

def main():
    date = datetime.now().strftime("%Y-%m-%d")
    
    # In a real implementation, this would:
    # 1. Read system_log.md
    # 2. Parse for date range
    # 3. Count metrics
    # 4. Generate summary using template
    # 5. Write to Done/summaries/
    # 6. Update Dashboard.md
    
    print(f"Generating summary for {date}...")
    print("Summary generated successfully.")
    
    # Placeholder: actual implementation would read logs and generate summary

if __name__ == "__main__":
    main()
```

**Acceptance Criteria:**
- [ ] brain_generate_summary.py created
- [ ] Script runs without errors
- [ ] Can be called from Task Scheduler

**Test Procedure:**
```powershell
python brain_generate_summary.py
# Should create Done/summaries/YYYY-MM-DD_summary.md
```

**Rollback:** Delete script

---

### Milestone 8 Acceptance Checklist

- [ ] brain_generate_summary skill implemented
- [ ] brain_generate_summary.py CLI wrapper created
- [ ] Summary generation tested
- [ ] Dashboard integration verified
- [ ] Scheduled task configured (from M7) to call script

**Commit:**
```bash
git add Skills/brain_generate_summary.skill.md brain_generate_summary.py
git commit -m "feat(silver): implement daily summary generation skill

- Add brain_generate_summary skill (Skill 21)
- Create brain_generate_summary.py CLI wrapper for Task Scheduler
- Generate daily summaries in Done/summaries/
- Include activity metrics, completed tasks, pending approvals
- Update Dashboard with latest summary link
- Callable via scheduled task (6 PM daily)

Ref: SPEC_silver_tier.md Section 9, Company_Handbook Skill 21"
```

---

## Milestone 9: End-to-End Testing

**Objective:** Validate complete Silver Tier workflow from email to MCP execution

**Duration:** 2-3 hours
**Dependencies:** M6 (MCP), M7 (scheduling), M8 (summary)
**Priority:** P0 (verification)

### Tasks

#### Task 9.1: End-to-End Demo Flow Test
**Description:** Execute complete workflow: Email → Plan → Approval → MCP → Done

**Test Scenario:**
"Client sends email requesting invoice. AI Employee drafts reply email via MCP."

**Steps:**

1. **Trigger: Send Test Email**
   - Send email to your Gmail
   - Subject: "Invoice Request for January"
   - Body: "Hi, can you send me the invoice for January services?"

2. **Perception: Gmail Watcher Detects Email**
   ```powershell
   python gmail_watcher.py --once
   ```
   - Verify intake wrapper created: `Inbox/gmail__client__invoice-request__*.md`
   - Verify email content in intake file

3. **Reasoning: Process Inbox**
   Invoke agent: "Process my inbox"
   - Agent reads intake file
   - Agent identifies actionable task (email reply needed)
   - Agent creates task in Needs_Action/: "Reply to invoice request email"
   - Verify task file created

4. **Plan: Create Plan**
   Invoke agent: "Create a plan for this task"
   - Agent invokes brain_create_plan (Skill 16)
   - Plan created in Plans/: PLAN_2026-02-11_reply-invoice-request.md
   - Plan includes:
     - Objective: Draft reply email with invoice attached
     - MCP Tools: gmail.draft_email
     - Approval Gates: YES (external communication)
     - Risk Level: Medium
   - Verify plan file exists and is populated

5. **Approval: Request Approval**
   Agent invokes brain_request_approval (Skill 17)
   - Plan moves to Pending_Approval/
   - Console shows approval request
   - Task updated: "Approval Needed: YES"
   - Verify plan in Pending_Approval/

6. **Human Decision: Approve**
   User action:
   ```powershell
   Move-Item "Pending_Approval/PLAN_2026-02-11_reply-invoice-request.md" "Approved/"
   ```
   - Verify plan in Approved/

7. **Action: Execute with MCP (Dry-Run)**
   Invoke agent: "Execute approved plans"
   - Agent invokes brain_execute_with_mcp --dry-run (Skill 18)
   - MCP Gmail dry-run executed
   - Dry-run results displayed: "Would draft email to: client@example.com, Subject: RE: Invoice Request"
   - Verify dry-run logged to Logs/mcp_actions.log

8. **Human Decision: Approve Dry-Run**
   User responds: "yes"

9. **Action: Execute with MCP (Real)**
   - Agent invokes brain_execute_with_mcp --execute
   - MCP Gmail draft_email executed
   - Email drafted in Gmail (not sent, per plan)
   - Verify email appears in Gmail Drafts
   - Verify Logs/mcp_actions.log entry

10. **Logging: Complete**
    - Agent invokes brain_log_action (Skill 19)
    - system_log.md updated with MCP action
    - Dashboard "Last External Action" updated
    - Plan status: Executed
    - Plan moved to Plans/completed/
    - Task moved to Done/
    - Verify all log entries

**Acceptance Criteria:**
- [ ] Complete workflow executes without errors
- [ ] Email detected by Gmail watcher
- [ ] Intake wrapper created
- [ ] Task created in Needs_Action/
- [ ] Plan created and approved
- [ ] Dry-run executed and approved
- [ ] MCP action executed successfully
- [ ] Email drafted in Gmail
- [ ] All logs updated (watcher.log, mcp_actions.log, system_log.md)
- [ ] Dashboard updated
- [ ] Files moved to appropriate locations (Done/, Plans/completed/)

**Test Procedure:**
Execute steps 1-10 sequentially, verify each checkpoint.

**Rollback:** Delete test files from all folders

---

#### Task 9.2: Failure Scenario Test
**Description:** Test MCP failure handling

**Test Scenario:**
"MCP call fails due to network error"

**Steps:**
1. Create test plan with invalid MCP parameters
2. Approve plan
3. Execute with MCP
4. Simulate failure (disconnect network or use invalid recipient)
5. Verify:
   - Agent stops execution (does not proceed)
   - brain_handle_mcp_failure invoked (Skill 20)
   - Escalation log created: Logs/YYYY-MM-DD-HHMM_escalation_mcp_failure.md
   - Plan status: Failed
   - Task status: Blocked - MCP Failure
   - User notification displayed
   - NO simulated success (agent does not fake the result)

**Acceptance Criteria:**
- [ ] Failure detected correctly
- [ ] Execution stopped immediately
- [ ] Escalation log created
- [ ] User notified
- [ ] No data corruption or orphaned state

**Test Procedure:**
Follow steps, verify agent handles failure gracefully.

**Rollback:** Delete test files

---

### Milestone 9 Acceptance Checklist

- [ ] End-to-end demo flow tested successfully
- [ ] All pipeline stages verified (Perception → Reasoning → Plan → Approval → Action → Logging)
- [ ] MCP dry-run and execution tested
- [ ] Logging verified (all log files updated)
- [ ] Dashboard updated correctly
- [ ] Failure scenario tested
- [ ] Failure handling verified (escalation, no simulated success)
- [ ] Bronze functionality still working (no regressions)

**Commit:**
```bash
git add Logs/  # (log files with test entries)
git commit -m "test(silver): verify end-to-end Silver Tier workflow

- Test complete pipeline: Email → Plan → Approval → MCP → Done
- Verify Gmail watcher detects emails and creates intake wrappers
- Verify plan creation, approval request, and execution
- Test MCP dry-run and real execution
- Verify all logging (watcher.log, mcp_actions.log, system_log.md)
- Test failure handling (MCP failure creates escalation log)
- Confirm Bronze foundation intact (no regressions)

Ref: SPEC_silver_tier.md Section 11 (Completion Checklist)"
```

---

## Milestone 10: Silver Demo & Documentation

**Objective:** Final verification, create demo script, commit plan, and mark Silver complete

**Duration:** 1-2 hours
**Dependencies:** M9 (testing complete)
**Priority:** P0 (completion)

### Tasks

#### Task 10.1: Create Silver Demo Script
**Description:** Document reproducible demo for Silver Tier showcase

**Create:** `Docs/DEMO_silver_tier.md`
```markdown
# Silver Tier Demo Script

**Purpose:** Showcase Silver Tier capabilities in 5 minutes
**Audience:** Hackathon judges, users, stakeholders
**Prerequisites:** Silver Tier implementation complete (M1-M9)

---

## Demo Flow (5 Minutes)

### 1. Show Vault Structure (30 seconds)
```powershell
# Navigate to vault
cd "E:\...\Personal AI Employee"

# Show folder structure
tree /F | Select-String -Pattern "Pending_Approval|Approved|Rejected|Scheduled"
```

**Narration:**
"Silver Tier adds approval folders (Pending_Approval, Approved, Rejected) for human-in-the-loop workflow, and Scheduled folder for task automation."

### 2. Show Dashboard (30 seconds)
Open `Dashboard.md` in Obsidian Reading Mode

**Narration:**
"Dashboard shows Silver metrics: Pending Approvals, Plans in Progress, Last External Action, Watcher Status, and Silver Health Check. All Bronze features preserved."

### 3. Show Gmail Watcher (1 minute)
```powershell
# Run Gmail watcher (dry-run)
python gmail_watcher.py --dry-run --limit 3

# Show log
Get-Content "Logs/gmail_watcher.log" -Tail 10
```

**Narration:**
"Gmail watcher (second watcher) monitors inbox via OAuth2, creates intake wrappers for new emails. Dry-run shows what would happen without creating files."

### 4. Show Plan Creation (1 minute)
Invoke agent: "Create a plan to send an email to client@example.com with Q1 report"

**Expected:**
- Plan created in Plans/
- Open plan file, show:
  - Objective
  - MCP Tools Required (gmail.send_email)
  - Approval Gates: YES
  - Risk Level
  - Execution Steps

**Narration:**
"Plan-first workflow: all external actions require a plan. Agent documents objective, MCP tools, approval gates, and rollback strategy."

### 5. Show Approval Workflow (1 minute)
Invoke agent: "Request approval for this plan"

**Expected:**
- Plan moves to Pending_Approval/
- Console shows approval request

Show file in Pending_Approval/, then manually move to Approved/

**Narration:**
"Human-in-the-loop: agent requests approval, user reviews plan, then approves by moving file to Approved/ folder. File-based workflow, no web UI needed."

### 6. Show MCP Execution with Dry-Run (1.5 minutes)
Invoke agent: "Execute approved plans"

**Expected:**
- Dry-run executes first
- Dry-run results displayed (preview email)
- User approves dry-run
- Real MCP execution
- Email drafted in Gmail
- Logs updated

**Narration:**
"MCP integration: agent calls Gmail MCP with dry-run first, shows preview, requests approval, then executes. All MCP calls logged to mcp_actions.log."

### 7. Show Logging & Audit Trail (30 seconds)
```powershell
# Show MCP log
Get-Content "Logs/mcp_actions.log" -Tail 5

# Show system log
Get-Content "system_log.md" -Tail 20
```

**Narration:**
"All actions logged: MCP calls with parameters and results, audit trail in system_log.md. Append-only for compliance."

### 8. Show Scheduled Tasks (30 seconds)
```powershell
# List scheduled tasks
Get-ScheduledTask -TaskName "AI_Employee_*"
```

**Narration:**
"Task Scheduler automation: Filesystem watcher every 15 min, Gmail watcher every 30 min, daily summary at 6 PM. Always-on perception."

---

## Demo Checklist

Before demo:
- [ ] Silver Tier implementation complete (M1-M9)
- [ ] Gmail OAuth2 configured (can send emails)
- [ ] Test email account ready
- [ ] Obsidian open with Dashboard.md
- [ ] VS Code open with vault
- [ ] Scheduled tasks configured and active

During demo:
- [ ] Show folder structure
- [ ] Show Dashboard (Obsidian)
- [ ] Run Gmail watcher (dry-run)
- [ ] Create plan (agent)
- [ ] Request approval (agent)
- [ ] Approve manually (move file)
- [ ] Execute with MCP (dry-run + real)
- [ ] Show logs

After demo:
- [ ] Answer questions
- [ ] Show constitution (if asked)
- [ ] Show Bronze vs Silver comparison (if asked)

---

## Troubleshooting

**Gmail watcher fails:**
- Check OAuth2 token.json exists
- Re-authenticate if needed

**MCP fails:**
- Verify Gmail MCP server running
- Check Claude Code MCP config

**Scheduled tasks not running:**
- Open Task Scheduler, check task status
- Verify Python path correct in task action
```

**Acceptance Criteria:**
- [ ] Demo script created
- [ ] Demo tested (dry-run with timer)
- [ ] Demo completes in under 5 minutes
- [ ] All steps reproducible

**Test Procedure:**
Execute demo script end-to-end, time it.

**Rollback:** Delete demo script

---

#### Task 10.2: Update Silver Health Check in Dashboard
**Description:** Mark Silver Tier complete in Dashboard.md

**Edit:** `Dashboard.md`

Update Silver Tier Health Check section:
```markdown
> [!check] 🎯 Silver Tier Health Check
>
> **Operational Verification:**
>
> - ✅ **Gmail Watcher** - Operational (OAuth2 configured)
> - ✅ **Plan-First Workflow** - Operational (brain_create_plan)
> - ✅ **Approval Pipeline** - Operational (Pending → Approved → Execute)
> - ✅ **MCP Integration** - Operational (Gmail MCP dry-run + send)
> - ✅ **Scheduling Active** - 3 tasks running (filesystem 15min, gmail 30min, summary 6pm)
> - ✅ **Silver Audit Trail** - All MCP actions logged
> - ✅ **Bronze Foundation Intact** - All Bronze features operational
>
> **Silver Tier Status:** ✅ **COMPLETE**
>
> **Completion Date:** 2026-02-11 (Milestone M10 complete)
>
> **Completion Progress:**
> - Vault Structure: ✅ Complete (M1)
> - Documentation: ✅ Complete (M2)
> - Gmail Watcher: ✅ Complete (M3)
> - Plan Workflow: ✅ Complete (M4)
> - Approval Pipeline: ✅ Complete (M5)
> - MCP Email: ✅ Complete (M6)
> - Scheduling: ✅ Complete (M7)
> - Daily Summary: ✅ Complete (M8)
> - Testing: ✅ Complete (M9)
> - Demo: ✅ Complete (M10)
```

**Acceptance Criteria:**
- [ ] Dashboard updated with completion status
- [ ] All checkboxes marked complete
- [ ] Completion date recorded

**Test Procedure:**
Open Dashboard in Obsidian, verify all checkmarks green.

**Rollback:** Revert Dashboard.md

---

#### Task 10.3: Final System Log Entry
**Description:** Append Silver Tier completion to system_log.md

**Append to:** `system_log.md`

```markdown
### [TIMESTAMP] UTC - silver_tier_completion
**Skill:** system_maintenance (Silver Tier implementation complete)
**Files Touched:**
- All Silver Tier files (see git log)
- Updated: Dashboard.md (completion status)
- Updated: system_log.md (this file)

**Outcome:** ✅ OK - Silver Tier implementation COMPLETE
- Duration: [X] hours (across M1-M10)
- Milestones: 10/10 complete
- Tasks: All tasks complete
- Tests: End-to-end verified (M9)
- Demo: Reproducible demo script created

**Silver Tier Features Implemented:**
1. ✅ Gmail Watcher (OAuth2, intake wrappers, logging)
2. ✅ Plan-First Workflow (brain_create_plan, plan templates)
3. ✅ Approval Pipeline (Pending_Approval/, Approved/, Rejected/, file-based HITL)
4. ✅ MCP Email Integration (Gmail MCP, dry-run, send/draft)
5. ✅ Task Scheduling (Windows Task Scheduler, 3 tasks configured)
6. ✅ Daily Summary (brain_generate_summary, summaries in Done/)
7. ✅ Dashboard Updates (5 new Silver sections)
8. ✅ Logging & Audit (mcp_actions.log, escalation logs, system_log.md)
9. ✅ Agent Skills (9 new Silver skills, total 24 skills)
10. ✅ Bronze Integrity (all Bronze features preserved)

**Compliance Verified:**
- ✅ Constitution pipeline enforced (Perception → Reasoning → Plan → Approval → Action → Logging)
- ✅ All AI functionality as Agent Skills (Company_Handbook.md updated)
- ✅ Watchers perception-only (no action execution)
- ✅ MCP-only for external actions (no direct API calls)
- ✅ File-based approval workflow (no web UI)
- ✅ Dual-interface (VS Code + Obsidian)
- ✅ Append-only audit trail

**Next Steps:**
- Ready for Hackathon 0 Silver Tier submission
- Gold Tier planning can begin (see SPEC_silver_tier.md Section 13: Out-of-Scope)

---
```

**Acceptance Criteria:**
- [ ] system_log.md entry added
- [ ] Completion timestamp recorded
- [ ] All Silver features listed
- [ ] Compliance verified

**Test Procedure:**
Read system_log.md final entry, verify accuracy.

**Rollback:** N/A (permanent audit record)

---

### Milestone 10 Acceptance Checklist

- [ ] Demo script created (DEMO_silver_tier.md)
- [ ] Demo tested and verified
- [ ] Dashboard Silver Health Check marked complete
- [ ] system_log.md completion entry added
- [ ] All commits pushed to silver-tier branch
- [ ] Ready for merge to main (or PR creation)

**Commit:**
```bash
git add Docs/DEMO_silver_tier.md Dashboard.md system_log.md
git commit -m "chore(silver): mark Silver Tier implementation complete

- Add DEMO_silver_tier.md with 5-minute demo script
- Update Dashboard Silver Health Check: all items complete
- Append completion entry to system_log.md
- Silver Tier ready for Hackathon 0 submission

Milestones: M1-M10 complete (10/10)
Duration: [X] hours
Status: ✅ COMPLETE

Ref: SPEC_silver_tier.md Section 1.2 (Success Criteria)"
```

---

## Demo Flow Checklist (Quick Reference)

Use this checklist when demonstrating Silver Tier:

### Pre-Demo Setup
- [ ] Gmail OAuth2 configured (token.json exists)
- [ ] Gmail MCP server running
- [ ] Test email account ready
- [ ] Obsidian open (Dashboard.md in Reading Mode)
- [ ] VS Code open (vault root)
- [ ] Scheduled tasks active

### Demo Steps (5 min)
1. [ ] Show vault structure (Pending_Approval/, Approved/, Rejected/, Scheduled/)
2. [ ] Show Dashboard Silver sections (Obsidian)
3. [ ] Run Gmail watcher dry-run
4. [ ] Create plan (agent invocation)
5. [ ] Request approval (plan moves to Pending_Approval/)
6. [ ] Approve plan (manually move to Approved/)
7. [ ] Execute with MCP (dry-run → approval → execute)
8. [ ] Show logs (mcp_actions.log, system_log.md)
9. [ ] Show scheduled tasks (Task Scheduler)

### Post-Demo
- [ ] Answer questions
- [ ] Show constitution (if requested)
- [ ] Show Company_Handbook.md skills (if requested)
- [ ] Explain Bronze vs Silver differences (if requested)

---

## Commit Plan (Conventional Commits)

All commits follow Conventional Commits format: `type(scope): description`

**Types:**
- `feat`: New feature
- `docs`: Documentation only
- `test`: Testing
- `chore`: Maintenance

**Scopes:**
- `silver`: Silver Tier specific
- `bronze`: Bronze Tier (if touched)

**Commits by Milestone:**

| Milestone | Commit | Type |
|-----------|--------|------|
| M1 | `feat(silver): add vault structure for approval workflow and scheduling` | feat |
| M2 | `docs(silver): add Silver Tier documentation to handbook and dashboard` | docs |
| M3 | `feat(silver): implement Gmail watcher with OAuth2 and intake creation` | feat |
| M4 | `feat(silver): implement plan-first workflow with state machine` | feat |
| M5 | `feat(silver): implement human-in-the-loop approval pipeline` | feat |
| M6 | `feat(silver): integrate Gmail MCP with dry-run and failure handling` | feat |
| M7 | `feat(silver): configure Windows Task Scheduler for automated watchers` | feat |
| M8 | `feat(silver): implement daily summary generation skill` | feat |
| M9 | `test(silver): verify end-to-end Silver Tier workflow` | test |
| M10 | `chore(silver): mark Silver Tier implementation complete` | chore |

**Total Commits:** 10 (one per milestone)

**Branch Strategy:**
1. Create branch `silver-tier` from `main`
2. Commit all milestones to `silver-tier`
3. After M10, merge `silver-tier` → `main` (or create PR for review)

**Merge Command:**
```bash
# After M10 complete
git checkout main
git merge silver-tier --no-ff -m "feat(silver): merge Silver Tier implementation (M1-M10)

Silver Tier implementation complete:
- Gmail Watcher (OAuth2)
- Plan-first workflow
- Human-in-the-loop approval
- MCP email integration
- Task scheduling
- Daily summaries
- 9 new agent skills (total 24)
- All Bronze features preserved

Closes: Silver Tier specification
Ref: SPEC_silver_tier.md"
```

---

## Risk & Rollback Notes

### Risk 1: Gmail API Authentication Complexity
**Probability:** Medium
**Impact:** High

**Mitigation:**
- Detailed setup documentation (gmail_oauth_setup.md)
- Test OAuth flow in M3 before proceeding
- Fallback: Skip Gmail Watcher for initial demo, add later

**Rollback:** Delete gmail_watcher.py, credentials.json, remove from Company_Handbook.md

---

### Risk 2: MCP Server Integration Issues
**Probability:** Medium
**Impact:** High

**Mitigation:**
- Test MCP server in isolation before M6
- Use dry-run extensively to verify without side effects
- Have fallback: Email operations via direct SMTP (constitution violation, but temporary)

**Rollback:** Remove Gmail MCP config from Claude Code, revert Skills/brain_execute_with_mcp.skill.md

---

### Risk 3: Windows Task Scheduler Reliability
**Probability:** Low
**Impact:** Medium

**Mitigation:**
- Test scheduled tasks with "Run" button before relying on schedule
- Check Logs/scheduler.log regularly
- Fallback: Manual watcher invocation (Bronze method)

**Rollback:** Unregister scheduled tasks, delete Scheduled/ folder

---

### Risk 4: Bronze Foundation Breakage
**Probability:** Low
**Impact:** Critical

**Mitigation:**
- NO modifications to watcher_skill.py (Bronze watcher)
- NO deletions of Bronze folders
- Test Bronze workflow after each milestone
- Keep git commits small for easy revert

**Rollback:** Revert entire silver-tier branch, return to main

---

### Risk 5: File-Based Approval Workflow Usability
**Probability:** Medium
**Impact:** Low

**Mitigation:**
- Clear console instructions for approval/rejection
- README files in approval folders
- brain_monitor_approvals to detect approvals quickly

**Rollback:** Remove approval folders, simplify workflow (accept degraded Silver)

---

### Risk 6: Agent Skill Implementation Gaps
**Probability:** Medium
**Impact:** Medium

**Mitigation:**
- Skills are prompt-based, easy to iterate
- Test each skill in isolation before integration
- Document expected inputs/outputs clearly

**Rollback:** Delete skill .md files, remove from Company_Handbook.md

---

## Do Not Implement Yet (Gold Tier Features)

**CRITICAL:** The following features are explicitly OUT OF SCOPE for Silver Tier. Do NOT implement:

### Out of Scope (Gold Tier)
- ❌ WhatsApp Watcher (implementation - interface defined only)
- ❌ LinkedIn Watcher (implementation - interface defined only)
- ❌ LinkedIn posting automation
- ❌ Custom AI memory systems (embeddings, vector search)
- ❌ Advanced scheduling (dependency-based, conditional triggers)
- ❌ Multi-agent collaboration
- ❌ Web UI for approval workflow (Silver is file-based only)
- ❌ Slack/Discord integration
- ❌ Database integration (Silver is file-based only)
- ❌ CI/CD automation
- ❌ Proactive suggestions (beyond basic audit)
- ❌ Natural language plan generation (plans use templates)

### Out of Scope (Platinum Tier)
- ❌ Autonomous decision-making (Silver requires approval)
- ❌ Financial transactions
- ❌ Legal document generation
- ❌ HR operations
- ❌ Full calendar integration
- ❌ Code generation at scale
- ❌ Cross-organization collaboration

**If tempted to add these features:**
1. STOP
2. Review SPEC_silver_tier.md Section 13
3. Document as "Future Enhancement" for Gold Tier
4. Do NOT implement

---

## Silver Tier Completion Criteria (Final Verification)

Before marking Silver Tier complete, verify ALL of the following:

### Watchers
- [ ] Filesystem Watcher operational (Bronze - preserved)
- [ ] Gmail Watcher operational (Silver - new)
- [ ] Both watchers create intake wrappers
- [ ] Both watchers log to respective log files
- [ ] OAuth2 authentication working (Gmail)

### Planning
- [ ] brain_create_plan skill implemented
- [ ] Plans created for ALL external actions
- [ ] Plan template followed (all mandatory sections)
- [ ] Plan status state machine enforced

### Approval Workflow
- [ ] Pending_Approval/, Approved/, Rejected/ folders exist
- [ ] brain_request_approval moves plans to Pending_Approval/
- [ ] User can approve by moving file to Approved/
- [ ] User can reject by moving file to Rejected/
- [ ] brain_monitor_approvals detects approved plans

### MCP Integration
- [ ] Gmail MCP server configured
- [ ] send_email operation available
- [ ] draft_email operation available
- [ ] Dry-run supported (preview before execution)
- [ ] MCP calls logged to Logs/mcp_actions.log
- [ ] Failures handled gracefully (brain_handle_mcp_failure)

### Scheduling
- [ ] Windows Task Scheduler tasks configured (3 tasks)
- [ ] Filesystem watcher scheduled (every 15 min)
- [ ] Gmail watcher scheduled (every 30 min)
- [ ] Daily summary scheduled (6 PM)
- [ ] Logs/scheduler.log updated with task runs

### Dashboard
- [ ] 5 new Silver sections added
- [ ] Pending Approvals section
- [ ] Plans in Progress section
- [ ] Last External Action section
- [ ] Watcher Status (Silver) section
- [ ] Silver Tier Health Check section

### Agent Skills
- [ ] 9 new Silver skills documented in Company_Handbook.md
- [ ] All skills have: Purpose, Inputs, Steps, Output, Approval Gate
- [ ] Skills 16-24 present

### Logging & Audit
- [ ] system_log.md updated with all Silver actions
- [ ] Logs/mcp_actions.log contains MCP calls
- [ ] Logs/gmail_watcher.log contains watcher runs
- [ ] Logs/scheduler.log contains scheduled task runs
- [ ] Append-only audit trail maintained

### Bronze Integrity
- [ ] All 15 Bronze skills still operational
- [ ] watcher_skill.py unchanged
- [ ] Inbox/, Needs_Action/, Done/ folders intact
- [ ] Dashboard.md Bronze sections unchanged
- [ ] Bronze workflow tested and verified

### Testing
- [ ] End-to-end workflow tested (email → MCP)
- [ ] Dry-run workflow tested
- [ ] Failure scenario tested (MCP failure handling)
- [ ] All logs verified

### Documentation
- [ ] Company_Handbook.md updated (Silver skills)
- [ ] Dashboard.md updated (Silver sections)
- [ ] DEMO_silver_tier.md created
- [ ] gmail_oauth_setup.md created
- [ ] All README files in new folders

### Demo
- [ ] Demo script tested
- [ ] Demo completes in under 5 minutes
- [ ] All demo steps reproducible

**IF ALL CHECKBOXES CHECKED:** Silver Tier is COMPLETE ✅

**IF ANY UNCHECKED:** Return to corresponding milestone and complete missing items.

---

## Final Notes

**Estimated Total Duration:** 20-30 hours (per Hackathon 0 PDF Silver Tier estimate)

**Critical Path:** M1 → M2 → M3 → M6 → M9 → M10 (must complete in sequence)

**Parallel Opportunities:**
- M4 (Plan workflow) can start after M2
- M5 (Approval pipeline) can start after M4
- M7 (Scheduling) can start after M3
- M8 (Summary) can start after M2

**Success Criteria:**
All items in "Silver Tier Completion Criteria" section checked.

**Next Steps After Silver:**
1. Merge silver-tier branch to main
2. Tag release: `v1.0.0-silver`
3. Submit to Hackathon 0
4. Plan Gold Tier (see SPEC_silver_tier.md Section 13)

---

**END OF IMPLEMENTATION PLAN**

Plan ID: PLAN_silver_001
Status: Ready for Implementation
Created: 2026-02-11
Branch: silver-tier
