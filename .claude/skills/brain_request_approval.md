# Skill: brain_request_approval

**Tier:** Silver
**Type:** Approval Workflow Skill
**Version:** 1.0.0
**Skill Number:** 17

## Purpose

Move plan files from Plans/ to Pending_Approval/ and display approval request to user. This skill implements the human-in-the-loop (HITL) approval gate, ensuring no external actions are taken without explicit user consent.

## Inputs

- **Plan File:** Path to plan in Plans/ with Status: Draft
- **Plan ID:** Unique plan identifier

## Outputs

- **Plan Moved:** Plan file moved from Plans/ to Pending_Approval/
- **Plan Status Updated:** Status changed from Draft to Pending_Approval
- **Console Notification:** Approval request displayed to user
- **System Log Entry:** Approval request logged

## Preconditions

- Plan file exists in Plans/
- Plan Status is "Draft"
- All mandatory plan sections are filled
- Pending_Approval/ folder exists

## Approval Gate

**No** (this skill requests approval but doesn't require it)

## MCP Tools Used

None (workflow management skill, no external actions)

## Steps

### 1. Read Plan File

```powershell
$planPath = "Plans/PLAN_{id}.md"
$plan = Get-Content $planPath -Raw
```

### 2. Verify Plan Completeness

Check that all mandatory sections are filled (not just placeholders):

**Required Sections:**
- Plan ID and Metadata
- Objective (not empty)
- Success Criteria (at least 1 criterion)
- Files to Touch (at least 1 file)
- MCP Tools Required (explicitly listed)
- Approval Gates (documented)
- Risk Level (LOW/MEDIUM/HIGH with justification)
- Rollback Strategy (defined)
- Execution Steps (numbered, at least 3 steps)

**Validation:**
```powershell
# Check for placeholder text
if ($plan -match "TODO|PLACEHOLDER|{.*}|\[.*\]") {
    Write-Error "Plan contains placeholders - fill all sections before approval"
    exit 1
}

# Check for empty sections
if ($plan -notmatch "## Objective\s+\w+") {
    Write-Error "Objective section is empty"
    exit 1
}
```

### 3. Update Plan Status

Change Status from "Draft" to "Pending_Approval":

```powershell
$plan = $plan -replace "Status: Draft", "Status: Pending_Approval"
$plan | Out-File -FilePath $planPath -Encoding UTF8
```

Update Status history:
```markdown
## Status

**Current:** Pending_Approval
**Created:** {creation_timestamp}
**Last Updated:** {current_timestamp}

**History:**
- {creation_timestamp}: Created in Plans/ (Draft)
- {current_timestamp}: Moved to Pending_Approval/ (brain_request_approval)
```

### 4. Move Plan File

```powershell
Move-Item -Path "Plans/PLAN_{id}.md" -Destination "Pending_Approval/PLAN_{id}.md"
```

### 5. Display Approval Request

Print formatted approval request to console:

```
═══════════════════════════════════════════════════════════
  APPROVAL REQUIRED
═══════════════════════════════════════════════════════════
Plan: {plan_title}
File: Pending_Approval/PLAN_{id}.md
Risk Level: {LOW/MEDIUM/HIGH}

Objective: {one-line_objective}

MCP Actions Required:
- {tool.operation}: {parameters}
- {tool2.operation}: {parameters}

Estimated Impact:
- Files Modified: {count}
- External Systems: {list}

To approve: Move file to Approved/ folder
To reject: Move file to Rejected/ folder
───────────────────────────────────────────────────────────
```

**Windows PowerShell Example:**
```powershell
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  APPROVAL REQUIRED" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Plan: Reply to John's email" -ForegroundColor White
Write-Host "File: Pending_Approval/PLAN_2026-02-11_reply-to-john.md" -ForegroundColor Gray
Write-Host "Risk Level: MEDIUM" -ForegroundColor Yellow
Write-Host ""
Write-Host "Objective: Send email reply to john@example.com regarding project timeline" -ForegroundColor White
Write-Host ""
Write-Host "MCP Actions Required:" -ForegroundColor White
Write-Host "- gmail.send_email: to=john@example.com, subject='Re: Project Timeline'" -ForegroundColor Gray
Write-Host ""
Write-Host "To approve: Move file to Approved/ folder" -ForegroundColor Green
Write-Host "To reject: Move file to Rejected/ folder" -ForegroundColor Red
Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Cyan
```

### 6. Update Task File

If task file exists, update its approval status:

```markdown
**Plan:** [PLAN_{id}](../Pending_Approval/PLAN_{id}.md)
**Plan Status:** Pending_Approval
**Approval Required:** YES - Awaiting user decision
**Approval Instructions:** Move plan file to Approved/ to proceed, or to Rejected/ to cancel
```

### 7. Log to system_log.md

Append entry:
```markdown
### {timestamp} - approval_requested
**Skill:** brain_request_approval (Skill 17)
**Files Touched:**
- Moved: Plans/PLAN_{id}.md → Pending_Approval/PLAN_{id}.md
- Modified: {task_file}.md (approval status)

**Outcome:** ✓ OK - Approval requested for {plan_title}
- Plan ID: PLAN_{id}
- Risk Level: {level}
- MCP Tools: {list}
- Status: Pending_Approval
- User Action Required: Move to Approved/ or Rejected/
- Next: User reviews and moves file
```

### 8. Wait for User Decision

**This skill does NOT wait** - it returns immediately after displaying the request.

User will manually move the file:
- **To Approved/**: Plan is approved, ready for execution
- **To Rejected/**: Plan is rejected, will not be executed

## Failure Handling

### What to Do:
1. **If plan file not found:**
   - Log error to system_log.md
   - Display error: "Plan file not found at Plans/PLAN_{id}.md"
   - STOP

2. **If plan has placeholders/incomplete sections:**
   - Display list of incomplete sections
   - STOP without moving file
   - Log warning to system_log.md

3. **If Pending_Approval/ folder doesn't exist:**
   - Log error to system_log.md
   - Display error: "Pending_Approval/ folder not found - run M1 vault setup"
   - STOP

4. **If cannot move file (permissions):**
   - Log error to system_log.md
   - Display error: "Cannot move plan file - check folder permissions"
   - STOP

### What NOT to Do:
- ❌ Do NOT move incomplete plans to Pending_Approval/
- ❌ Do NOT skip approval request display
- ❌ Do NOT automatically approve plans (user must manually move file)
- ❌ Do NOT modify plan content after moving to Pending_Approval/
- ❌ Do NOT execute any external actions

## Logging Requirements

### system_log.md
One entry per approval request:
```markdown
### {YYYY-MM-DD HH:MM:SS UTC} - approval_requested
**Skill:** brain_request_approval (Skill 17)
**Files Touched:**
- Moved: Plans/PLAN_{id}.md → Pending_Approval/PLAN_{id}.md
- Modified: {task_file}.md (if exists)

**Outcome:** ✓ OK / ✗ FAIL - {description}
- Plan ID: {id}
- Plan Title: {title}
- Risk Level: {LOW/MEDIUM/HIGH}
- MCP Tools: {tool1, tool2, ...}
- Status: Pending_Approval
- Awaiting: User manual file move to Approved/ or Rejected/
```

### No other logs required
(This skill doesn't use MCP or watchers)

## Definition of Done

- [ ] Plan file moved from Plans/ to Pending_Approval/
- [ ] Plan Status updated to "Pending_Approval"
- [ ] Plan Status history updated with timestamp
- [ ] Approval request displayed to console
- [ ] Task file updated with approval instructions (if exists)
- [ ] system_log.md entry created
- [ ] Plan completeness validated (no placeholders)
- [ ] User knows how to approve/reject (clear instructions shown)

## Test Procedure (Windows)

### Test 1: Request Approval for Valid Plan

```powershell
# 1. Create test plan in Plans/
New-Item -ItemType Directory -Path "Plans" -Force
@"
# Plan: Test Email Send

**Plan ID:** PLAN_2026-02-11_test
**Status:** Draft

## Objective
Send test email

## MCP Tools Required
1. gmail.send_email
   - to: test@example.com
   - subject: Test

## Risk Level
**Level:** LOW
**Justification:** Test email only

## Rollback Strategy
Delete sent email if wrong

## Execution Steps
1. Dry-run
2. Execute
3. Log

(All other sections filled...)
"@ | Out-File -FilePath "Plans/PLAN_2026-02-11_test.md" -Encoding UTF8

# 2. Run brain_request_approval
# Expected: Plan moved to Pending_Approval/, approval request displayed

# 3. Verify plan moved
Test-Path "Pending_Approval/PLAN_2026-02-11_test.md"  # Returns True
Test-Path "Plans/PLAN_2026-02-11_test.md"  # Returns False

# 4. Verify status updated
Select-String -Path "Pending_Approval/PLAN_2026-02-11_test.md" -Pattern "Status: Pending_Approval"

# 5. Verify system_log.md entry
Select-String -Path "system_log.md" -Pattern "approval_requested" | Select-Object -Last 1

# Expected: All checks pass
```

### Test 2: Reject Incomplete Plan

```powershell
# 1. Create incomplete plan (with placeholders)
@"
# Plan: Incomplete Test

**Plan ID:** PLAN_2026-02-11_incomplete
**Status:** Draft

## Objective
TODO: Fill this in

## MCP Tools Required
{list tools here}
"@ | Out-File -FilePath "Plans/PLAN_2026-02-11_incomplete.md" -Encoding UTF8

# 2. Run brain_request_approval
# Expected: Error displayed, plan NOT moved

# 3. Verify plan still in Plans/
Test-Path "Plans/PLAN_2026-02-11_incomplete.md"  # Returns True
Test-Path "Pending_Approval/PLAN_2026-02-11_incomplete.md"  # Returns False

# 4. Verify error logged
Select-String -Path "system_log.md" -Pattern "incomplete.*placeholder" | Select-Object -Last 1

# Expected: Plan rejected, error logged
```

### Test 3: Approval Request Display Format

```powershell
# Run brain_request_approval and verify output contains:
# - "APPROVAL REQUIRED" header
# - Plan title
# - File path
# - Risk level
# - Objective
# - MCP tools list
# - Approval instructions (move to Approved/ or Rejected/)

# Expected: All elements present in console output
```

## Integration with Other Skills

**Called By:**
- brain_create_plan (Skill 16) - after plan creation
- User (manual approval request trigger)

**Calls:**
- None (standalone approval workflow skill)

**Followed By:**
- User manual action (move file to Approved/ or Rejected/)
- brain_monitor_approvals (Skill 22) - detects approved plans

## References

- Constitution: `Specs/sp.constitution.md` (Section 3.4: Approval Pipeline)
- Specification: `Specs/SPEC_silver_tier.md` (Section 5.3: HITL Approval)
- Company Handbook: `Company_Handbook.md` (Skill 17)
- Operating Loop: `.claude/skills/silver_operating_loop.md` (Stage 4)

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
**Next:** M5 Implementation (test approval workflow)
