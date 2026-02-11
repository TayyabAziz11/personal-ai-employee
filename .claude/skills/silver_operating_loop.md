# Skill: silver_operating_loop

**Tier:** Silver
**Type:** Meta Skill (Operating Model)
**Version:** 1.0.0

## Purpose

Defines the complete Silver Tier operating loop for the Personal AI Employee. This meta-skill orchestrates the full pipeline from perception through action, ensuring all external actions follow the mandatory human-in-the-loop (HITL) approval workflow. Use this as the master reference for understanding how all Silver skills work together.

## Inputs

- **Trigger Event:** Email arrival, scheduled task, or user request
- **Context:** Current vault state (Needs_Action/, Pending_Approval/, Approved/)

## Outputs

- **Executed Actions:** MCP calls logged to audit trail
- **State Updates:** Files moved through approval workflow
- **Audit Logs:** Entries in system_log.md and Logs/mcp_actions.log

## Preconditions

- M1 vault structure exists (Pending_Approval/, Approved/, Rejected/, Scheduled/)
- system_log.md initialized
- Logs/mcp_actions.log, Logs/gmail_watcher.log, Logs/scheduler.log exist
- MCP server configured (for execution phase only)

## Approval Gate

**Meta-level:** N/A (this skill orchestrates approval, doesn't require it)

## MCP Tools Used

None directly (this skill coordinates other skills that use MCP)

## Pipeline Stages

### Stage 1: Perception

**Skills:** watcher_gmail (Skill 24)

**Process:**
1. Watcher detects new input (email, file, scheduled trigger)
2. Creates intake wrapper in Needs_Action/
3. Logs detection to appropriate watcher log
4. Does NOT take any external actions

**Output:** Intake wrapper file with priority and metadata

**Example:** `Needs_Action/intake__gmail__2026-02-11_14-30__reply-john.md`

---

### Stage 2: Reasoning

**Skills:** Bronze processing skills (Skills 2-15)

**Process:**
1. Read intake wrapper from Needs_Action/
2. Determine task type and priority
3. Identify if external action required (email send, calendar update, etc.)
4. Route to appropriate handler

**Decision Point:** Does task require external action?
- **YES** → Proceed to Stage 3 (Planning)
- **NO** → Execute Bronze workflow (internal operations only)

---

### Stage 3: Planning

**Skills:** brain_create_plan (Skill 16)

**Process:**
1. Determine plan is required (external action, MCP call, >3 steps, or Medium+ risk)
2. Generate unique plan ID: `PLAN_{YYYY-MM-DD}_{slug}`
3. Copy plan template from Plans/PLAN_TEMPLATE.md
4. Fill all mandatory sections:
   - Objective
   - Success Criteria
   - Files to Touch
   - MCP Tools Required
   - Approval Gates
   - Risk Level (LOW/MEDIUM/HIGH)
   - Rollback Strategy
   - Execution Steps (numbered)
5. Set Status: **Draft**
6. Save to Plans/PLAN_{id}.md
7. Link plan from task file

**Output:** Plan file in Draft status

**Example:** `Plans/PLAN_2026-02-11_reply-to-john.md`

---

### Stage 4: Approval Request

**Skills:** brain_request_approval (Skill 17)

**Process:**
1. Verify plan completeness (all sections filled)
2. Update plan Status: **Pending_Approval**
3. Move plan file: Plans/ → Pending_Approval/
4. Display approval request to console:

```
═══════════════════════════════════════════════════════════
  APPROVAL REQUIRED
═══════════════════════════════════════════════════════════
Plan: Reply to John's email
File: Pending_Approval/PLAN_2026-02-11_reply-to-john.md
Risk Level: MEDIUM

Objective: Send email reply to john@example.com

MCP Actions Required:
- gmail.send_email: to=john@example.com, subject="Re: Project Update"

To approve: Move file to Approved/ folder
To reject: Move file to Rejected/ folder
───────────────────────────────────────────────────────────
```

5. Update task file with approval status
6. Log to system_log.md

**Output:** Plan in Pending_Approval/ awaiting human decision

**Human Action Required:** User manually moves file to Approved/ or Rejected/

---

### Stage 5: Approval Monitoring

**Skills:** brain_monitor_approvals (Skill 22)

**Process:**
1. Check Approved/ folder for plan files
2. For each plan in Approved/:
   - Verify Status is Approved (or update it)
   - Trigger brain_execute_with_mcp (Stage 6)

**Runs:** Continuously (scheduled every 15 minutes) or on-demand

**Output:** Detection of approved plans ready for execution

---

### Stage 6: Dry-Run Execution

**Skills:** brain_execute_with_mcp (Skill 18), brain_log_action (Skill 19)

**Process:**
1. Verify plan is in Approved/ folder
2. Read plan and extract MCP operations
3. **Dry-Run Phase:**
   - For each MCP operation:
     - Call MCP tool with --dry-run flag
     - Capture preview output
   - Display all dry-run results to user
   - Request confirmation: "Results look good? (yes/no)"
   - If NO: STOP, move plan back to Pending_Approval/ with note
   - If YES: Proceed to real execution

**Output:** Dry-run results and user confirmation

**Example Dry-Run Log:**
```
[2026-02-11 15:30:00 UTC] MCP Dry-Run Initiated
Tool: gmail
Operation: send_email
Parameters:
  to: john@example.com
  subject: Re: Project Update
  body: Thanks for the update...
Mode: dry-run
Result: SUCCESS - Would send email (not actually sent)
Duration: 0.45s
```

---

### Stage 7: Real Execution

**Skills:** brain_execute_with_mcp (Skill 18), brain_log_action (Skill 19), brain_handle_mcp_failure (Skill 20)

**Process:**
1. For each MCP operation (only if dry-run approved):
   - Call MCP tool with real parameters
   - Log to Logs/mcp_actions.log:
     `[timestamp] Tool | Operation | Parameters | Mode | Result | Duration`
   - Update plan "Execution Log" section
   - **If step fails:**
     - STOP immediately (no further operations)
     - Call brain_handle_mcp_failure
     - Update plan Status: **Failed**
     - Move plan to Plans/failed/
     - Exit execution loop
   - **If step succeeds:**
     - Continue to next operation
2. If all operations succeed:
   - Update plan Status: **Executed**
   - Proceed to Stage 8 (Archival)

**Output:** Executed MCP actions with complete audit trail

**Example Execution Log:**
```
[2026-02-11 15:32:15 UTC] MCP Execution Initiated
Tool: gmail
Operation: send_email
Parameters:
  to: john@example.com
  subject: Re: Project Update
  body: Thanks for the update...
Mode: execute
Result: SUCCESS - Email sent (Message ID: 18d4a2f3c9e1b7a5)
Duration: 1.23s
```

---

### Stage 8: Archival

**Skills:** brain_archive_plan (Skill 23)

**Process:**
1. For executed plans (Status: Executed):
   - Move from Approved/ to Plans/completed/
   - Update task file: Status = Complete
   - Log archival to system_log.md
2. For rejected plans (in Rejected/ folder):
   - Keep in Rejected/ (already archived)
   - Log rejection reason if provided
3. For failed plans (Status: Failed):
   - Keep in Plans/failed/ (moved by failure handler)
   - Escalation log already created

**Output:** Plans archived in appropriate folders

---

### Stage 9: Summary & Reporting

**Skills:** brain_generate_summary (Skill 21)

**Process:**
1. Read system_log.md for time period (daily/weekly)
2. Count:
   - Intake items processed
   - Plans created
   - Plans approved/rejected
   - MCP actions executed
   - Failures encountered
3. Generate summary file: Plans/Briefings/summary_{date}.md
4. Update Dashboard.md with latest summary link

**Runs:** Daily at 6 PM (scheduled) or on-demand

**Output:** Summary file with metrics and pending items

---

## State Transitions

Plans progress through these states:

```
                    ┌─────────────┐
                    │   Trigger   │
                    │   Event     │
                    └──────┬──────┘
                           │
                           v
                    ┌─────────────┐
                    │ Perception  │ (watcher_gmail)
                    │ Creates     │
                    │ Intake      │
                    └──────┬──────┘
                           │
                           v
                    ┌─────────────┐
                    │  Reasoning  │ (Bronze skills)
                    │  External   │
                    │  Action?    │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
                   NO            YES
                    │             │
                    v             v
            ┌─────────────┐  ┌─────────────┐
            │   Bronze    │  │  Planning   │ (brain_create_plan)
            │  Workflow   │  │   Status:   │
            │             │  │   Draft     │
            └─────────────┘  └──────┬──────┘
                                    │
                                    v
                             ┌─────────────┐
                             │  Approval   │ (brain_request_approval)
                             │  Request    │
                             │   Status:   │
                             │  Pending    │
                             └──────┬──────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                    Approved                Rejected
                   (User moves)           (User moves)
                        │                       │
                        v                       v
                 ┌─────────────┐         ┌─────────────┐
                 │  Dry-Run    │         │  Rejected/  │
                 │  Execution  │         │   Status:   │
                 │             │         │  Rejected   │
                 └──────┬──────┘         └──────┬──────┘
                        │                       │
                 ┌──────┴──────┐                │
                 │             │                │
              Approved      Rejected            │
             (Dry-run)      (Dry-run)           │
                 │             │                │
                 v             v                v
          ┌─────────────┐ ┌─────────────┐  ┌─────────────┐
          │    Real     │ │  Back to    │  │  Archive    │
          │ Execution   │ │  Pending    │  │  in         │
          │             │ │             │  │  Rejected/  │
          └──────┬──────┘ └─────────────┘  └─────────────┘
                 │
          ┌──────┴──────┐
          │             │
      Success       Failure
          │             │
          v             v
   ┌─────────────┐ ┌─────────────┐
   │ Plans/      │ │ Plans/      │
   │ completed/  │ │ failed/     │
   │  Status:    │ │  Status:    │
   │  Executed   │ │  Failed     │
   └──────┬──────┘ └──────┬──────┘
          │             │
          v             v
   ┌─────────────┐ ┌─────────────┐
   │  Archive    │ │  Escalation │
   │             │ │  Log        │
   └─────────────┘ └─────────────┘
```

## Failure Handling

### What to Do:
1. **STOP execution immediately** when MCP call fails
2. Call brain_handle_mcp_failure with error details
3. Create escalation log in Logs/mcp_failures/
4. Update plan Status: Failed
5. Update task Status: Blocked - MCP Failure
6. Display failure notification to user
7. Log to system_log.md

### What NOT to Do:
- ❌ Do NOT retry failed MCP call without new approval
- ❌ Do NOT continue execution after failure
- ❌ Do NOT claim success if MCP returned error
- ❌ Do NOT modify plan after approval (create new plan instead)
- ❌ Do NOT skip logging

## Logging Requirements

### system_log.md
Append entry for each stage completion:
```markdown
### [timestamp] - [stage_name]
**Skill:** [skill_used]
**Files Touched:** [list]
**Outcome:** ✓ OK / ✗ FAIL - [details]
```

### Logs/mcp_actions.log
Format:
```
[YYYY-MM-DD HH:MM:SS UTC] MCP Call Initiated
Tool: [tool_name]
Operation: [operation]
Parameters:
  [key]: [value]
Mode: dry-run | execute
Result: SUCCESS / FAILURE - [details]
Duration: [seconds]s
```

### Logs/gmail_watcher.log
Format:
```
[YYYY-MM-DD HH:MM:SS UTC] Gmail Watcher Run
Emails Fetched: [count]
Intake Wrappers Created: [count]
Errors: [count]
```

### Logs/scheduler.log
Format:
```
[YYYY-MM-DD HH:MM:SS UTC] Scheduled Task: [task_name]
Status: SUCCESS / FAILURE
Duration: [seconds]s
```

## Definition of Done

- [ ] All stages execute in sequence
- [ ] Human approval required for all external actions
- [ ] Dry-run completes before real execution
- [ ] All MCP calls logged to audit trail
- [ ] Plans archived in correct folders
- [ ] No external actions without approved plans
- [ ] Failures stop execution immediately
- [ ] System log updated at each stage

## Test Procedure (Windows)

### Test 1: Complete Happy Path

```powershell
# 1. Create test email intake wrapper
New-Item -ItemType File -Path "Needs_Action/test_email.md" -Force
@"
# Test Email
**From:** test@example.com
**Subject:** Test
**Action Required:** Reply
"@ | Out-File -FilePath "Needs_Action/test_email.md" -Encoding UTF8

# 2. Run brain_create_plan (manual trigger)
# Expected: Plan file created in Plans/ with Status: Draft

# 3. Run brain_request_approval
# Expected: Plan moved to Pending_Approval/, console shows approval request

# 4. Manually approve
Move-Item -Path "Pending_Approval/PLAN_*.md" -Destination "Approved/"

# 5. Run brain_monitor_approvals
# Expected: Plan detected in Approved/

# 6. Run brain_execute_with_mcp --dry-run
# Expected: Dry-run results displayed, no actual email sent

# 7. Approve dry-run (manual confirmation)
# Expected: Prompt shows "Results look good?"

# 8. Run brain_execute_with_mcp --execute
# Expected: Email sent, plan moved to Plans/completed/

# 9. Verify logs
Get-Content "Logs/mcp_actions.log" | Select-Object -Last 10
Get-Content "system_log.md" | Select-Object -Last 20

# Expected: All operations logged correctly
```

### Test 2: Rejection Path

```powershell
# 1. Create plan (same as Test 1 steps 1-3)

# 2. Manually reject
Move-Item -Path "Pending_Approval/PLAN_*.md" -Destination "Rejected/"

# 3. Verify plan stays in Rejected/
Test-Path "Rejected/PLAN_*.md"  # Returns True

# 4. Verify no execution occurred
# Expected: No entries in mcp_actions.log for this plan
```

### Test 3: Failure Handling

```powershell
# 1. Create plan with invalid email (force failure)
# Example: to: "invalid@invalid@invalid"

# 2. Follow approval workflow (steps 3-7 from Test 1)

# 3. Run brain_execute_with_mcp --execute
# Expected: MCP call fails, brain_handle_mcp_failure triggered

# 4. Verify failure handling
Test-Path "Logs/mcp_failures/*.log"  # Returns True
Test-Path "Plans/failed/PLAN_*.md"  # Returns True

# 5. Verify system_log.md has failure entry
Select-String -Path "system_log.md" -Pattern "MCP Failure" | Select-Object -Last 1
```

## Integration with Other Skills

This meta-skill orchestrates all Silver Tier skills:

- **Perception:** watcher_gmail (S9)
- **Planning:** brain_create_plan (S1), brain_request_approval (S2)
- **Monitoring:** brain_monitor_approvals (S3)
- **Execution:** brain_execute_with_mcp (S4), brain_log_action (S5)
- **Error Handling:** brain_handle_mcp_failure (S6)
- **Archival:** brain_archive_plan (S7)
- **Reporting:** brain_generate_summary (S8)

## References

- Constitution: `Specs/sp.constitution.md` (Section 4: MCP Governance)
- Specification: `Specs/SPEC_silver_tier.md` (Section 5: Operating Loop)
- Implementation Plan: `Plans/PLAN_silver_tier_implementation.md`
- Plan Template: `Plans/PLAN_TEMPLATE.md`

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
**Next:** M3 (Gmail Watcher Implementation)
