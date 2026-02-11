# Company Handbook - Personal AI Employee (Bronze)

**Version:** 2.0
**Last Updated:** 2026-02-09 20:00 UTC
**Tier:** Bronze (Foundation + Execution)

---

## 1. GOVERNANCE RULES

### 1.1 Approval Points
- **Automatic Approval:** Intake to Inbox, Dashboard updates, triaging standard tasks
- **User Approval Required:**
  - Deleting any user-created content
  - Moving items backward in workflow (Done → Needs_Action)
  - Executing destructive file operations
  - Changing core vault structure

### 1.2 Do's
- ✓ Always update Dashboard.md after workflow changes
- ✓ Preserve all user content (append-only or versioned)
- ✓ Write clear audit trails in task markdown files
- ✓ Use skills as defined procedures (no freestyling)
- ✓ Make reasonable assumptions when ambiguous, document them here
- ✓ Keep files lightweight and readable (markdown format)

### 1.3 Don'ts
- ✗ Never delete original dropped files without user confirmation
- ✗ Never overwrite user content without preserving history
- ✗ Never skip Dashboard updates after workflow changes
- ✗ Never execute undefined skills (must be documented here first)
- ✗ Never make assumptions about urgency without evidence

### 1.4 Definition of "Done"
A task is considered **Done** when:
1. The stated objective is completed
2. A completion note is added to the task file
3. Completion date is recorded
4. File is moved to `Done/` folder
5. Dashboard.md is updated to reflect completion

---

## 2. AGENT SKILLS (Bronze Tier)

### Skill 1: setup_vault
**Purpose:** Initialize or repair vault structure
**Inputs:** None (checks current filesystem state)
**Steps:**
1. Check for existence of required folders: `Inbox/`, `Needs_Action/`, `Done/`, `Logs/`
2. Create missing folders
3. Check for `Dashboard.md` and `Company_Handbook.md`
4. Create from templates if missing
5. Log setup completion

**Output Files:** All vault structure + `Dashboard.md`, `Company_Handbook.md`

---

### Skill 2: intake_to_inbox
**Purpose:** Convert raw input into structured inbox item
**Inputs:**
- Raw content (text, file, user message)
- Source identifier (user/file_drop/system)

**Steps:**
1. Generate unique filename: `YYYY-MM-DD_HHMM_brief-title.md`
2. Create markdown file in `Inbox/` with structure:
   ```markdown
   # [Title]

   **Source:** [user/file_drop/system]
   **Received:** [timestamp]
   **Type:** [task/question/idea/document]
   **Urgency:** [low/medium/high]

   ## Raw Content
   [original content preserved exactly]

   ## Initial Assessment
   - Next Step: [best guess]
   - Estimated Effort: [quick/moderate/extended]

   ## Audit Trail
   - [timestamp] Created in Inbox
   ```
3. Update Dashboard.md with new Inbox count

**Output Files:** `Inbox/[item].md`, `Dashboard.md`

---

### Skill 3: triage_inbox_item
**Purpose:** Process inbox item and route to appropriate stage
**Inputs:** Filename of item in `Inbox/`

**Steps:**
1. Read the inbox item file
2. Determine routing:
   - If actionable → move to `Needs_Action/`
   - If already complete → move to `Done/`
   - If needs clarification → keep in Inbox, add clarification request
3. If moving to `Needs_Action/`, enrich with:
   - **Owner:** me (Bronze AI Employee)
   - **Next Step:** Clear action statement
   - **Due Date:** [inferred or "not set"]
   - **Priority:** [P0/P1/P2/P3]
4. Update audit trail in file
5. Update Dashboard.md

**Output Files:** Moved file, `Dashboard.md`

---

### Skill 4: update_dashboard
**Purpose:** Refresh Dashboard.md with current system state
**Inputs:** None (scans filesystem)

**Steps:**
1. Count files in `Inbox/`, `Needs_Action/`, `Done/`
2. Read all `Needs_Action/` items and extract priorities
3. Sort by priority (P0 > P1 > P2 > P3) and select top 3
4. Read last 3 items from `Done/` (by date)
5. Update timestamp
6. Rewrite Dashboard.md with fresh data

**Output Files:** `Dashboard.md`

---

### Skill 5: close_task_to_done
**Purpose:** Mark task as complete and archive
**Inputs:** Filename of item in `Needs_Action/`

**Steps:**
1. Read the task file
2. Add completion section:
   ```markdown
   ## Completion
   **Completed:** [timestamp]
   **Outcome:** [brief description]
   **Notes:** [any relevant details]
   ```
3. Move file from `Needs_Action/` to `Done/`
4. Update Dashboard.md
5. Optional: Create log entry in `Logs/` if significant

**Output Files:** Moved file to `Done/`, `Dashboard.md`

---

### Skill 6: watcher_skill (Filesystem Watcher)
**Purpose:** Automated monitoring of `Inbox/` folder to detect and process new items
**Inputs:** None (scans `Inbox/` folder for new files)

**Steps:**
1. Scan `Inbox/` folder for files not previously processed
2. For each new file:
   - **If non-markdown file** (pdf, jpg, docx, etc.):
     - Create intake markdown wrapper: `inbox__<filename>__<timestamp>.md`
     - Preserve original file (non-destructive)
     - Intake file includes: source, timestamp, type, file location, action needed placeholder
   - **If markdown file**:
     - Check if already in intake format (has Source/Received/Type fields)
     - If not: wrap raw content into intake format (preserve under "Raw Content")
     - If yes: mark as verified, no action needed
3. Log each action to `Logs/watcher.log`
4. Append run summary to `system_log.md`
5. Track processed files to avoid duplicates

**Output Files:** `Inbox/intake__*.md` files, `Logs/watcher.log`, `system_log.md`

**CLI Usage:**
```bash
# Dry-run mode (see what would happen without making changes)
python watcher_skill.py --dry-run

# Run once and exit (default, safest for Bronze)
python watcher_skill.py --once

# Run continuously with 10-second interval
python watcher_skill.py --loop --interval 10

# Run from different directory
python watcher_skill.py --vault /path/to/vault
```

**Bronze Safety Features:**
- Non-destructive: Never deletes original files
- Duplicate prevention: Tracks processed files across runs
- Append-only logs: All actions recorded
- Dry-run mode: Preview changes before executing

**Implementation:** Python script using standard library only (`watcher_skill.py`)

---

## 2.2 SILVER TIER AGENT SKILLS (MCP-First)

**Silver Skills Pack Location:** `.claude/skills/`

The Silver Tier extends Bronze foundation with human-in-the-loop (HITL) approval workflow and MCP integration for external actions.

### Silver Skills Overview

All Silver skills follow the mandatory approval workflow:
**Perception → Reasoning → Plan → Approval → Action → Logging**

### Silver Skills Reference Table

| Skill # | Skill Name | Doc Path | Purpose |
|---------|------------|----------|---------|
| **Meta** | silver_operating_loop | [.claude/skills/silver_operating_loop.md](.claude/skills/silver_operating_loop.md) | Complete Silver Tier workflow |
| **S16** | brain_create_plan | [.claude/skills/brain_create_plan.md](.claude/skills/brain_create_plan.md) | Generate plan files for external actions |
| **S17** | brain_request_approval | [.claude/skills/brain_request_approval.md](.claude/skills/brain_request_approval.md) | Move plans to Pending_Approval/ with notification |
| **S18** | brain_execute_with_mcp | [.claude/skills/brain_execute_with_mcp.md](.claude/skills/brain_execute_with_mcp.md) | Execute approved plans via MCP (dry-run first) |
| **S19** | brain_log_action | [.claude/skills/brain_log_action.md](.claude/skills/brain_log_action.md) | Log MCP actions to audit trail |
| **S20** | brain_handle_mcp_failure | [.claude/skills/brain_handle_mcp_failure.md](.claude/skills/brain_handle_mcp_failure.md) | Handle MCP failures with escalation |
| **S21** | brain_generate_summary | [.claude/skills/brain_generate_summary.md](.claude/skills/brain_generate_summary.md) | Generate daily/weekly summaries |
| **S22** | brain_monitor_approvals | [.claude/skills/brain_monitor_approvals.md](.claude/skills/brain_monitor_approvals.md) | Check Approved/ folder for ready plans |
| **S23** | brain_archive_plan | [.claude/skills/brain_archive_plan.md](.claude/skills/brain_archive_plan.md) | Archive executed/rejected plans |
| **S24** | watcher_gmail | [.claude/skills/watcher_gmail.md](.claude/skills/watcher_gmail.md) | Gmail OAuth2 watcher (perception-only) |

### MCP Governance (CRITICAL)

For ANY external action (email, calendar, file ops):

✅ **MUST:**
- Have approved plan in Approved/ folder
- Support dry-run mode (preview before execution)
- Log to Logs/mcp_actions.log AND system_log.md
- STOP immediately on MCP failure (no retries without approval)

❌ **MUST NOT:**
- Execute MCP calls without approved plan
- Skip dry-run phase
- Continue execution after MCP failure
- Modify plan after approval

### Silver State Transitions

```
Draft → Pending_Approval → Approved → Executed → Archived
                        ↓
                    Rejected → Archived
```

### Human-in-the-Loop (HITL) Approval Workflow

**Core Principle:** No external action without approved plan + approved file.

**Workflow Steps:**
1. **Plan Creation (brain_create_plan):**
   - Agent detects need for external action (email, calendar, file ops)
   - Generates plan file in `Plans/` with Status: Draft
   - Plan includes: Objective, MCP tools, risk level, rollback strategy

2. **Approval Request (brain_request_approval):**
   - Plan status updated to: Pending_Approval
   - Plan file moved from `Plans/` → `Pending_Approval/`
   - Console displays approval request with plan details
   - **User action required:** Review plan file

3. **User Decision (Manual File Move):**
   - **To Approve:** User moves plan file to `Approved/` folder
   - **To Reject:** User moves plan file to `Rejected/` folder
   - No command-line approval (file-based only for audit trail)

4. **Approval Monitoring (brain_monitor_approvals):**
   - Runs every 15 minutes (scheduled) or on-demand
   - Checks `Approved/` folder for plans
   - Triggers execution for approved plans

5. **Dry-Run Phase (brain_execute_with_mcp --dry-run):**
   - Executes MCP calls with `--dry-run` flag
   - Displays preview of what will happen
   - **CRITICAL:** No actual external actions taken
   - Requests user confirmation: "Results look good? (yes/no)"

6. **Execution Phase (brain_execute_with_mcp --execute):**
   - Only runs if dry-run approved
   - Executes real MCP calls
   - Logs all operations to `Logs/mcp_actions.log`
   - If any step fails: STOP immediately (no retry without new approval)

7. **Archival (brain_archive_plan):**
   - Executed plans → `Plans/completed/`
   - Failed plans → `Plans/failed/`
   - Rejected plans → kept in `Rejected/` (already archived)

### MCP Governance + Dry-Run + Failure Handling

**Dry-Run Requirements:**
- **MANDATORY** for all MCP calls before real execution
- Must display preview/results to user for inspection
- User must explicitly approve dry-run results ("yes/no")
- If dry-run fails or shows wrong results: plan moves back to `Pending_Approval/`

**Failure Handling Rules:**
1. **STOP Immediately:** On any MCP failure, halt execution (no further operations)
2. **Create Escalation Log:** `Logs/mcp_failures/{timestamp}_failure.log`
3. **Update Plan Status:** Status → Failed, move to `Plans/failed/`
4. **Notify User:** Display failure details in console
5. **No Simulated Success:** NEVER claim execution succeeded if MCP call failed
6. **No Auto-Retry:** Retries require new plan and new approval

**Logging Requirements:**
- **All MCP Calls:** Logged to `Logs/mcp_actions.log` (dry-run + execute modes)
- **Format:** `[timestamp] Tool | Operation | Parameters | Mode | Result | Duration`
- **System Log:** Significant actions logged to `system_log.md`
- **Append-Only:** Never overwrite logs (audit trail integrity)

**For complete Silver Tier documentation, see:** `.claude/skills/README.md`

---

## 3. WATCHER SYSTEM

### Bronze Tier: Filesystem Watcher (watcher_skill)

**Type:** Python-based filesystem monitoring
**Implementation:** `watcher_skill.py` (vault root)
**Target:** `Inbox/` folder
**Trigger:** User executes watcher script (manual or scheduled)

**Behavior:**
- Scans `Inbox/` for new files
- Creates intake markdown wrappers for non-markdown files
- Validates/wraps raw markdown files into intake format
- Logs all actions to `Logs/watcher.log` and `system_log.md`
- Preserves all original files (non-destructive)

**How to Run:**

1. **Test Mode (Recommended First Run):**
   ```bash
   python watcher_skill.py --dry-run
   ```
   Shows what would happen without making changes.

2. **Single Scan (Default Bronze Mode):**
   ```bash
   python watcher_skill.py --once
   ```
   Processes new items once and exits. Safe for manual workflow.

3. **Continuous Monitoring (Optional):**
   ```bash
   python watcher_skill.py --loop --interval 10
   ```
   Runs every 10 seconds. Use for active development. Stop with Ctrl+C.

**Output Control Flags:**

- `--quiet` - Minimal output (errors only), useful for automation
- `--verbose` - Detailed output with debug information
- `--no-banner` - Skip header/banner (for scripts and automation)
- `--no-color` - Disable ANSI color output (for logging to files)

**Professional CLI UX Features:**

The watcher now includes a premium, developer-tool-quality terminal experience:

- **Banner/Header:** Shows tool name, mode, timestamp, and vault path
- **Configuration Block:** Displays all relevant paths at startup
- **Event Logging:** Color-coded event rows with icons (●=new, ✓=created/verified, ○=skipped, ✗=error)
- **Status Line:** Real-time counters for inbox, created, skipped, errors
- **Summary Table:** Execution statistics with timing information
- **ANSI Colors:** Auto-enabled on Windows (via ctypes), with auto-fallback
- **Graceful Exit:** Ctrl+C in loop mode shows full summary

**Examples:**
```bash
# Standard usage (default: once mode, with colors and banner)
python watcher_skill.py

# Automation-friendly (no banner, no colors, quiet)
python watcher_skill.py --quiet --no-banner --no-color

# Debugging (verbose output, dry-run)
python watcher_skill.py --verbose --dry-run

# Production monitoring (loop mode with interval)
python watcher_skill.py --loop --interval 30
```

**Bronze Best Practice:** Run `--once` after dropping files into Inbox, then review intake files before triaging.

**Status:** ✓ Active (Python script deployed with premium CLI UX)

---

## 4. CLAUDE BRAIN: TASK PROCESSING + EXECUTION

**Purpose:** End-to-end task processing from intake through execution to completion, with built-in approval gates and safety checks.

**Philosophy:** The Claude Brain reads carefully, thinks before acting, produces real deliverables (not just plans), requests approval when needed, and maintains a complete audit trail.

---

### Skill 7: brain_process_inbox_batch
**Purpose:** Process all items in Inbox/ using brain_process_single_item
**Inputs:**
- None (processes all items in Inbox/)
- Optional: limit (max number to process)

**Steps:**
1. Scan `Inbox/` for all `.md` files
2. For each item, run `brain_process_single_item`
3. Update Dashboard.md with final counts
4. Append summary to system_log.md

**Output Files:** Updated Inbox/, Needs_Action/, Done/, Dashboard.md, system_log.md
**Approval Gate:** No (individual items may have approval gates)

---

### Skill 8: brain_process_single_item
**Purpose:** Read + understand one Inbox item and turn it into a structured task decision
**Inputs:** Path to Inbox item (.md intake or file-linked intake)

**Steps:**
1. **Read fully:** Load the entire intake file + any linked source files
2. **Restate task:** Write a clear 1-2 sentence objective
3. **Identify deliverable:** What concrete output is expected?
4. **Identify constraints:** Time, scope, Bronze Tier safety rules, user preferences
5. **Decide approval gate:** Does this need user approval before execution?
6. **Route decision:**
   - If actionable → create structured task in Needs_Action/
   - If already complete (e.g., just info) → move to Done/
   - If needs clarification → keep in Inbox, add "Clarification Needed" section
7. Run `brain_write_task_brief` on the new task file
8. Run `brain_set_priority_and_due_date`
9. Run `brain_approval_gate`
10. Move original intake from Inbox/ to Needs_Action/ or Done/
11. Update Dashboard.md and system_log.md

**Output Files:**
- Structured task file in Needs_Action/ or Done/
- Updated Dashboard.md, system_log.md

**Approval Gate:** No (task execution may require approval)

---

### Skill 9: brain_write_task_brief
**Purpose:** Create a clean "Task Brief" section inside the Needs_Action task file
**Inputs:** Path to task file in Needs_Action/

**Steps:**
1. Read current task file content
2. Create/update Task Brief with:
   - **Objective:** 1-2 lines stating the goal
   - **Context:** Bullet points with background info
   - **Deliverables:** Bullet points listing concrete outputs
   - **Constraints:** Bullet points including "Bronze Tier: safe mode, non-destructive, approval required for external actions"
   - **Questions/Unknowns:** Any clarifications needed (optional)
3. Preserve existing content under "Previous:" block if overwriting
4. Update task file with structured brief

**Output Files:** Updated task file in Needs_Action/
**Approval Gate:** No

---

### Skill 10: brain_set_priority_and_due_date
**Purpose:** Assign Priority (P0/P1/P2) and Due date
**Inputs:** Path to task file in Needs_Action/

**Priority Rules:**
- **P0 (Critical):** Time-sensitive, blocking other work, explicit urgency keywords
- **P1 (High):** Important but not urgent, significant impact
- **P2 (Medium):** Nice-to-have, routine work, no urgency signals
- **Default:** P2 if unclear

**Due Date Rules:**
- If user explicitly provided date → use it
- If keywords like "today", "tomorrow", "this week" → calculate date
- Otherwise → "None"

**Steps:**
1. Read task file and source content
2. Analyze for urgency signals and deadlines
3. Assign priority (P0/P1/P2)
4. Assign due date or "None"
5. Update task file metadata

**Output Files:** Updated task file
**Approval Gate:** No

---

### Skill 11: brain_generate_action_plan
**Purpose:** Write a short checklist ("Next Actions") with 3-7 steps max
**Inputs:** Path to task file in Needs_Action/

**Steps:**
1. Read task objective and deliverables
2. Break down into 3-7 concrete action steps
3. Keep steps simple and specific
4. Add to task file under "Next Actions:" section
5. If task is complex (>7 steps or multi-phase):
   - Create detailed plan document in Plans/
   - Filename: `YYYY-MM-DD__<topic>.md`
   - Link plan from task file
6. Update task file

**Output Files:**
- Updated task file
- Optional: Plan document in Plans/

**Approval Gate:** No

---

### Skill 12: brain_approval_gate
**Purpose:** Decide whether user approval is required before proceeding
**Inputs:** Path to task file in Needs_Action/

**Approval Required If:**
1. **External communication:** Email, DM, posting publicly, GitHub issues/PRs
2. **Spending money:** Purchases, subscriptions, API costs
3. **Deleting/moving original files:** User-created content at risk
4. **Destructive operations:** Database changes, production deployments
5. **Ambiguity with risk:** Could cause harm, reputational damage, or waste time if wrong

**Approval NOT Required For:**
- Creating files in vault (Plans/, Needs_Action/, Done/)
- Reading files
- Generating drafts/plans (as long as not sent externally)
- Moving markdown task files within vault workflow
- Updating Dashboard.md, system_log.md

**Steps:**
1. Read task objective and deliverables
2. Check against approval criteria above
3. Set "Approval Needed:" field to "Yes" or "No"
4. If Yes: Write "Approval Request:" block with:
   - What you want to do (specific action)
   - Why approval is needed
   - What will happen if approved
5. Update task file

**Output Files:** Updated task file
**Approval Gate:** No (this skill sets the gate, doesn't require one)

---

### Skill 13: brain_start_work
**Purpose:** Begin execution on a Needs_Action task end-to-end
**Inputs:** Task filename/path in Needs_Action/

**Steps:**
1. Read full task file + any linked source content
2. Verify Task Brief exists; if missing → run `brain_write_task_brief`
3. **Check Approval Needed:**
   - If "Yes" and status ≠ "Approved" → STOP
   - Output approval request block only
   - Wait for user approval
4. If approved or no approval needed:
   - Update Status: "In_Progress"
   - Add Change Log entry: "[timestamp] Started work"
   - Run `brain_execute_task` to create deliverable
5. Update system_log.md
6. Update Dashboard.md

**Output Files:**
- Updated task file with Status = "In_Progress"
- Deliverable file(s) (via brain_execute_task)
- system_log.md, Dashboard.md

**Approval Gate:** Conditional (depends on task)

---

### Skill 14: brain_execute_task
**Purpose:** Produce the actual deliverable content (draft, plan, copy, checklist, analysis, etc.)
**Inputs:**
- Path to task file in Needs_Action/
- Context from task brief and source files

**Rules:**
1. **Read everything first:** Never write without reading all referenced content
2. **Follow constraints:** Adhere to Bronze Tier rules, user preferences, stated limitations
3. **Write to vault:** Deliverable must be saved as file(s), not just terminal output
4. **Version if iterating:** Draft_v1.md, Draft_v2.md or append with "---\n## Revision [date]"
5. **Link from task:** Update "Work Output Links:" section in task file

**Steps:**
1. Read task file completely (Objective, Context, Deliverables, Constraints, Next Actions)
2. Read all source files referenced
3. Plan deliverable structure (heading outline)
4. Write deliverable content to file:
   - Location: Plans/ for planning docs, Needs_Action/ for working drafts, or task-specific folder
   - Filename: Descriptive, includes date if versioned
5. Update task file:
   - Add link to deliverable under "Work Output Links:"
   - Add progress note under "Notes:"
   - Add Change Log entry
6. If deliverable is external-facing:
   - Mark "Approval Needed: Yes" with approval request
   - Set Status: "Waiting_Approval"
7. Otherwise, deliverable is done; ready for finalize

**Output Files:**
- Deliverable file(s) in vault
- Updated task file with links
- system_log.md

**Approval Gate:** Conditional (external-facing deliverables require approval before finalizing)

---

### Skill 15: brain_finalize_and_close
**Purpose:** Finalize a completed task and close it properly
**Inputs:** Path to task file in Needs_Action/

**Steps:**
1. Read task file
2. **Verify deliverable exists:**
   - Check "Work Output Links:" section
   - Confirm file(s) exist in vault
   - If missing → ERROR, cannot finalize
3. **Check approval if needed:**
   - If "Approval Needed: Yes" and Status ≠ "Approved" → STOP
   - Require explicit user approval before finalizing
4. **Add Completion section:**
   ```markdown
   ## Completion
   **Completed:** [timestamp]
   **Deliverables:** [list of file links]
   **Outcome:** [brief summary of what was delivered]
   **Notes:** [any relevant details]
   ```
5. Set Status: "Done"
6. Move task file from Needs_Action/ to Done/
7. Update Dashboard.md (decrement Needs_Action, increment Done, update "Recently Completed")
8. Append to system_log.md
9. Output short completion summary to user

**Output Files:**
- Task file moved to Done/
- Updated Dashboard.md
- Updated system_log.md

**Approval Gate:** Conditional (requires approval if task has "Approval Needed: Yes")

---

## 4.1 STANDARD TASK FILE FORMAT

**Every task file in Needs_Action/ MUST include these sections in this exact order:**

```markdown
# [Task Title]

**Source:** [user / file_drop / system]
**Created:** [YYYY-MM-DD HH:MM UTC]
**Status:** [Inbox / Needs_Action / In_Progress / Waiting_Approval / Done]
**Priority:** [P0 / P1 / P2]
**Due:** [YYYY-MM-DD or "None"]

---

## Objective

[1-2 sentence clear statement of the goal]

---

## Context

- [Background point 1]
- [Background point 2]
- [Any relevant history or constraints]

---

## Deliverables

- [ ] [Concrete output 1]
- [ ] [Concrete output 2]
- [ ] [Concrete output 3]

---

## Constraints

- Bronze Tier: Safe mode, non-destructive, approval required for external actions
- [Any time constraints]
- [Any scope limitations]
- [Any technical constraints]

---

## Next Actions

1. [Specific step 1]
2. [Specific step 2]
3. [Specific step 3]

---

## Approval Needed

**Status:** [Yes / No]

**Approval Request:** (only if Yes)
[Exactly what needs approval and why]

---

## Work Output Links

- [Link to deliverable file 1]
- [Link to deliverable file 2]

---

## Notes

[Any working notes, progress updates, or observations]

---

## Change Log

- [YYYY-MM-DD HH:MM] Created in Inbox
- [YYYY-MM-DD HH:MM] Moved to Needs_Action (priority: P2)
- [YYYY-MM-DD HH:MM] Started work
- [YYYY-MM-DD HH:MM] Deliverable created: [filename]
- [YYYY-MM-DD HH:MM] Completed and moved to Done/

---
```

**Mandatory Fields:** Source, Created, Status, Priority, Due, Objective, Deliverables, Constraints, Approval Needed

**Optional Fields:** Context, Next Actions, Work Output Links, Notes (recommended but not required)

**Always Include:** Change Log (append-only audit trail)

---

## 4.2 STRICT OPERATING LOOPS

### Loop 1: "Process my inbox"

**User Command:** "Process my inbox" or "Triage inbox" or "Check inbox"

**Steps:**
1. (Optional) Run `python3 watcher_skill.py --once` if new files expected
2. Run `brain_process_inbox_batch` (processes all Inbox items)
3. Run `update_dashboard`
4. Output summary:
   - Number of items processed
   - Number moved to Needs_Action
   - Number moved to Done
   - Number needing clarification (still in Inbox)
   - Top 3 priorities from Needs_Action

---

### Loop 2: "Start work on [task]"

**User Command:** "Start work on [task name/ID]" or "Execute task [name]"

**Steps:**
1. Locate task file in Needs_Action/
2. Run `brain_start_work` on that task
3. If approval required and not yet approved:
   - Display approval request
   - STOP and wait for user approval
4. If approved or no approval needed:
   - Run `brain_execute_task` (creates deliverable)
5. If deliverable requires final approval:
   - Display approval request for deliverable
   - STOP and wait for user approval
6. If approved:
   - Run `brain_finalize_and_close`
7. Update Dashboard.md
8. Output completion summary

---

### Loop 3: "New task: [description]"

**User Command:** "New task: [description]" or "Create task: [description]"

**Steps:**
1. Run `intake_to_inbox` with user's description
2. Run `brain_process_single_item` on the new intake
3. Run `update_dashboard`
4. Output: "Task created in Needs_Action: [filename]" with priority and approval status

---

### Loop 4: "Approve [task]"

**User Command:** "Approve task [name]" or "Approved" (in context)

**Steps:**
1. Locate task file
2. Read current status and approval request
3. Update Status: "Approved"
4. Add Change Log entry: "[timestamp] User approved: [approval request]"
5. Continue with next step in workflow:
   - If was waiting to start → run `brain_start_work`
   - If was waiting to finalize → run `brain_finalize_and_close`
6. Update Dashboard.md and system_log.md

---

### Loop 5: "Complete/Close [task]"

**User Command:** "Complete task [name]" or "Mark [task] done"

**Steps:**
1. Locate task file in Needs_Action/
2. Check if work was actually performed (deliverables exist)
3. If deliverables missing:
   - Ask user: "No deliverables found. Mark as complete anyway?"
   - If yes: Add note explaining completion reason
4. Run `brain_finalize_and_close`
5. Update Dashboard.md
6. Output completion confirmation

---

## 5. OPERATING LOOP

The AI Employee operates in this cycle:

```
1. setup_vault (verify structure)
   ↓
2. Check Inbox/ for new items
   ↓
3. For each item: triage_inbox_item
   ↓
4. update_dashboard
   ↓
5. Process user requests (close_task_to_done, etc.)
   ↓
6. Loop back to step 2
```

**Invocation:** User messages trigger the loop. System maintains state via markdown files.

---

## 5. ASSUMPTIONS (Bronze Tier)

**IMPORTANT:** Bronze Tier is an OPERATIONAL MODE / CAPABILITY LEVEL, not a folder name. The vault root is the current working directory where the system files reside.

1. **Working Directory:** Vault root (current working directory, contains Dashboard.md, Company_Handbook.md, and all folders)
2. **File Format:** All task items are markdown (`.md`)
3. **Folder Structure:**
   - `Inbox/` - New items awaiting triage
   - `Needs_Action/` - Active tasks requiring work
   - `Done/` - Completed tasks (archive)
   - `Logs/` - System logs (watcher.log, etc.)
   - `Plans/` - Planning documents for complex work
4. **Urgency Inference:** Based on keywords (urgent, ASAP, deadline → high; otherwise low)
5. **Type Classification:**
   - Questions contain "?", "how", "why", "what"
   - Tasks contain verbs: "create", "build", "fix", "update"
   - Ideas contain: "maybe", "could", "idea", "propose"
   - Documents are non-text files or large content blocks
6. **Completion Authority:** AI can mark tasks Done if evidence of completion exists, otherwise asks user
7. **Priority Defaults:** P2 (medium) unless evidence suggests P0 (critical) or P1 (high)
8. **Watcher Mode:** Bronze tier uses manual invocation (`--once`), not continuous background monitoring
9. **File Preservation:** Original dropped files are NEVER deleted by automation

---

## 6. CHANGE LOG

**2026-02-09 (19:22 UTC):** Initial handbook created. Bronze tier foundation established. Skills 1-5 defined. Filesystem watcher documented (manual mode).

**2026-02-09 (19:30 UTC):** Vault expansion completed:
- Added `Plans/` folder with README for planning documents
- Added `system_log.md` for append-only audit trail
- Implemented Skill 6: `watcher_skill` (Python script)
- Updated watcher system section with CLI usage
- Enhanced assumptions to reflect full vault structure

**2026-02-09 (20:00 UTC):** Claude Brain execution system implemented:
- Added Section 4: Claude Brain: Task Processing + Execution
- Implemented Skills 7-15 (brain processing + execution capabilities)
- Defined standard task file format (mandatory sections)
- Created 5 strict operating loops for user commands
- Approval gate logic fully documented
- End-to-end task delivery now operational (intake → execution → completion)
- Version upgraded to 2.0 (Foundation + Execution)

**2026-02-09 (20:18 UTC):** Bronze Tier re-anchoring and clarification:
- Clarified: "Bronze Tier" is an OPERATIONAL MODE, not a folder name
- Updated Section 5 (ASSUMPTIONS) to remove outdated path references
- Corrected Working Directory assumption to reflect vault root
- Vault structure reorganized: all files now at root level (no nested "Bronze Tier/" folder)
- watcher_skill.py paths verified: correctly uses vault root-relative paths
- All systems operational at vault root

**2026-02-10 (10:59 UTC):** Watcher CLI UX Upgrade (Premium):
- Upgraded watcher_skill.py with professional, developer-tool-quality terminal output
- Added ANSI color support with Windows compatibility (ctypes)
- Implemented OutputManager class for centralized console output control
- Added banner/header with tool info, mode, timestamp, and vault path
- Added configuration block displaying all relevant paths
- Implemented color-coded event logging (●=new, ✓=created, ○=skipped, ✗=error)
- Added summary table with execution statistics and timing
- New output control flags: --quiet, --verbose, --no-banner, --no-color
- Graceful Ctrl+C handling in loop mode with final summary
- Updated Section 3 (Watcher System) with new flags documentation
- All existing functionality preserved (100% backward compatible)
- Standard library only (no external dependencies)

---

*This handbook is the authoritative source for system behavior and governance.*
