# Skill: brain_execute_with_mcp

**Tier:** Silver
**Type:** Execution Skill
**Version:** 1.0.0
**Skill Number:** 18

## Purpose

Execute approved plans via MCP tools with mandatory dry-run phase. This is the ONLY skill authorized to make external actions (email, calendar, files). All execution follows two-phase workflow: dry-run → user confirmation → real execution.

## Inputs

- **Plan File:** Path to approved plan in Approved/
- **Mode:** `--dry-run` or `--execute`

## Outputs

- **MCP Results:** Dry-run preview or execution results
- **Updated Plan:** Execution log and dry-run results sections filled
- **Log Entries:** MCP actions logged to Logs/mcp_actions.log and system_log.md
- **Moved Plan:** Plan archived to Plans/completed/ (success) or Plans/failed/ (failure)

## Preconditions

- Plan file is in Approved/ folder
- Plan Status is "Approved"
- MCP server is configured and running
- All plan sections are filled

## Approval Gate

**Yes - Two-Phase Approval:**
1. **Gate 1:** User moved plan to Approved/ (file-based approval)
2. **Gate 2:** User confirms dry-run results look good (console approval)

## MCP Tools Used

**Variable** (depends on plan):
- gmail.send_email
- gmail.draft_email
- calendar.create_event
- calendar.update_event
- (Others as needed based on plan)

## Steps

### Phase 1: Dry-Run (MANDATORY)

#### 1.1 Verify Plan is Approved

```powershell
$planPath = "Approved/PLAN_{id}.md"

if (-not (Test-Path $planPath)) {
    Write-Error "Plan not found in Approved/ folder"
    exit 1
}

$plan = Get-Content $planPath -Raw

if ($plan -notmatch "Status: Approved") {
    Write-Error "Plan status is not Approved"
    exit 1
}
```

#### 1.2 Extract MCP Operations

Parse "## MCP Tools Required" section:

```markdown
## MCP Tools Required

1. **gmail.send_email**
   - to: john@example.com
   - subject: Re: Project Update
   - body: {email_body}
   - dry-run: yes
```

Extract:
- Tool: `gmail`
- Operation: `send_email`
- Parameters: `to`, `subject`, `body`

#### 1.3 Execute Dry-Run for Each Operation

```powershell
foreach ($operation in $mcpOperations) {
    # Call MCP tool with --dry-run flag
    $result = Invoke-McpTool -Tool $operation.Tool `
                              -Operation $operation.Operation `
                              -Parameters $operation.Parameters `
                              -DryRun

    # Capture and display results
    Write-Host "Dry-Run Result:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor Gray
}
```

#### 1.4 Update Plan with Dry-Run Results

Add to "## Dry-Run Results" section:

```markdown
## Dry-Run Results

**Executed:** {timestamp}

**Operation 1:** gmail.send_email
- to: john@example.com
- subject: Re: Project Update
- body: (234 characters)
- Result: SUCCESS - Would send email (preview shown above)
- Duration: 0.45s

**Summary:** All dry-run operations completed successfully. No actual external actions taken.
```

#### 1.5 Display Dry-Run Summary

```powershell
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DRY-RUN COMPLETE" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Plan: $planTitle"
Write-Host "Operations: $operationCount"
Write-Host ""
Write-Host "All dry-run operations succeeded." -ForegroundColor Green
Write-Host "No actual external actions were taken." -ForegroundColor Gray
Write-Host ""
Write-Host "Review the results above. Do they look correct?" -ForegroundColor White
Write-Host ""
$confirmation = Read-Host "Proceed with real execution? (yes/no)"
Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Cyan
```

#### 1.6 Handle Dry-Run Approval Decision

```powershell
if ($confirmation -ne "yes") {
    Write-Host "Execution cancelled by user." -ForegroundColor Yellow

    # Update plan status
    $plan = $plan -replace "Status: Approved", "Status: Pending_Approval"

    # Add note to plan
    $plan += "`n`n**Dry-Run Rejected:** User cancelled execution after reviewing dry-run results. Moved back to Pending_Approval/ for revision.`n"

    # Move plan back
    Move-Item -Path $planPath -Destination "Pending_Approval/PLAN_{id}.md"

    # Log decision
    # ... log to system_log.md ...

    exit 0
}
```

### Phase 2: Real Execution (ONLY if dry-run approved)

#### 2.1 Execute Real Operations

```powershell
$executionLog = @()

foreach ($operation in $mcpOperations) {
    $startTime = Get-Date

    try {
        # Call MCP tool WITHOUT --dry-run flag
        $result = Invoke-McpTool -Tool $operation.Tool `
                                  -Operation $operation.Operation `
                                  -Parameters $operation.Parameters

        $duration = ((Get-Date) - $startTime).TotalSeconds

        # Log success
        $executionLog += @{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
            Tool = $operation.Tool
            Operation = $operation.Operation
            Parameters = $operation.Parameters
            Mode = "execute"
            Result = "SUCCESS"
            Details = $result
            Duration = $duration
        }

        # Call brain_log_action (Skill 19)
        brain_log_action -LogEntry $executionLog[-1]

    } catch {
        # MCP call failed - STOP immediately
        $duration = ((Get-Date) - $startTime).TotalSeconds

        $failureDetails = @{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
            Tool = $operation.Tool
            Operation = $operation.Operation
            Parameters = $operation.Parameters
            Mode = "execute"
            Result = "FAILURE"
            Error = $_.Exception.Message
            Duration = $duration
        }

        # Call brain_handle_mcp_failure (Skill 20)
        brain_handle_mcp_failure -FailureDetails $failureDetails -PlanPath $planPath

        # STOP execution - do NOT continue with remaining operations
        exit 1
    }
}
```

#### 2.2 Update Plan Execution Log

Add to "## Execution Log" section:

```markdown
## Execution Log

**Executed:** {timestamp}

**Operation 1:** gmail.send_email
- to: john@example.com
- subject: Re: Project Update
- body: (234 characters)
- Result: SUCCESS - Email sent (Message ID: 18d4a2f3c9e1b7a5)
- Duration: 1.23s

**Summary:** All operations executed successfully. Plan completed.
```

#### 2.3 Update Plan Status

```markdown
## Status

**Current:** Executed
**Created:** {creation_timestamp}
**Last Updated:** {execution_timestamp}

**History:**
- {creation_timestamp}: Created in Plans/ (Draft)
- {approval_request_timestamp}: Moved to Pending_Approval/
- {approval_timestamp}: Moved to Approved/ by user
- {dryrun_timestamp}: Dry-run executed and approved
- {execution_timestamp}: Real execution completed (Executed)
```

#### 2.4 Archive Plan

Move to Plans/completed/:

```powershell
Move-Item -Path $planPath -Destination "Plans/completed/PLAN_{id}.md"
```

#### 2.5 Log to system_log.md

```markdown
### {timestamp} - plan_executed
**Skill:** brain_execute_with_mcp (Skill 18)
**Files Touched:**
- Modified: Approved/PLAN_{id}.md (execution log added)
- Moved: Approved/PLAN_{id}.md → Plans/completed/PLAN_{id}.md

**Outcome:** ✓ OK - Plan executed successfully
- Plan ID: PLAN_{id}
- MCP Operations: {count}
- All operations: SUCCESS
- Duration: {total_seconds}s
- Archived to: Plans/completed/
```

## Failure Handling

### What to Do:
1. **If MCP call fails during execution:**
   - STOP immediately (do NOT continue with remaining operations)
   - Call brain_handle_mcp_failure (Skill 20) with full error details
   - Update plan Status: Failed
   - Move plan to Plans/failed/
   - Create escalation log in Logs/mcp_failures/
   - Log to system_log.md
   - Display failure notification to user
   - Exit with error code

2. **If plan not in Approved/:**
   - Log error to system_log.md
   - Display error: "Plan must be in Approved/ folder"
   - STOP (do NOT execute)

3. **If MCP server unreachable:**
   - Log error to system_log.md
   - Display error: "MCP server not responding - check configuration"
   - STOP (do NOT execute)

### What NOT to Do:
- ❌ Do NOT continue execution after MCP failure
- ❌ Do NOT retry failed operations without new approval
- ❌ Do NOT claim success if MCP returned error
- ❌ Do NOT skip dry-run phase
- ❌ Do NOT execute without user confirmation after dry-run
- ❌ Do NOT modify plan after it's approved (before execution)

## Logging Requirements

### Logs/mcp_actions.log
One entry per MCP operation:
```
[YYYY-MM-DD HH:MM:SS UTC] MCP Call Initiated
Tool: gmail
Operation: send_email
Parameters:
  to: john@example.com
  subject: Re: Project Update
  body: (234 characters)
Mode: dry-run | execute
Result: SUCCESS | FAILURE - {details}
Duration: {seconds}s
```

### system_log.md
One entry per plan execution:
```markdown
### {YYYY-MM-DD HH:MM:SS UTC} - plan_executed
**Skill:** brain_execute_with_mcp (Skill 18)
**Plan:** PLAN_{id}

**Outcome:** ✓ OK / ✗ FAIL - {description}
- Dry-Run: {timestamp} - {result}
- Dry-Run Approved: {yes/no}
- Execution: {timestamp} - {result}
- Operations: {count} ({success_count} success, {failure_count} failed)
- Duration: {seconds}s
- Archived to: Plans/completed/ | Plans/failed/
```

## Definition of Done

- [ ] Plan verified in Approved/ folder
- [ ] Dry-run executed for all operations
- [ ] Dry-run results displayed to user
- [ ] User confirmation received for dry-run results
- [ ] Real execution completed (if dry-run approved)
- [ ] All MCP calls logged to Logs/mcp_actions.log
- [ ] Plan execution log updated
- [ ] Plan status updated to "Executed"
- [ ] Plan archived to Plans/completed/
- [ ] system_log.md entry created
- [ ] No execution if dry-run rejected or failed

## Test Procedure (Windows)

### Test 1: Full Execution (Dry-Run → Approve → Execute)

```powershell
# 1. Create approved plan with MCP operation
# (Use test/sandbox MCP endpoint that doesn't actually send email)

# 2. Run dry-run
brain_execute_with_mcp --plan "Approved/PLAN_{id}.md" --dry-run

# Expected: Dry-run results displayed, no actual email sent

# 3. Verify dry-run results in plan
Select-String -Path "Approved/PLAN_{id}.md" -Pattern "## Dry-Run Results"

# 4. Approve dry-run (respond "yes")
# Expected: Prompt shows "Proceed with real execution? (yes/no)"

# 5. Execute real operation
# Expected: Email sent (or test MCP action completed)

# 6. Verify plan moved to Plans/completed/
Test-Path "Plans/completed/PLAN_{id}.md"  # Returns True

# 7. Verify MCP actions logged
Get-Content "Logs/mcp_actions.log" | Select-String -Pattern "PLAN_{id}"
# Expected: 2 entries (dry-run + execute)
```

### Test 2: Dry-Run Rejection

```powershell
# 1. Run dry-run
brain_execute_with_mcp --plan "Approved/PLAN_{id}.md" --dry-run

# 2. Reject dry-run (respond "no")
# Expected: Plan moved back to Pending_Approval/

# 3. Verify plan moved back
Test-Path "Pending_Approval/PLAN_{id}.md"  # Returns True
Test-Path "Approved/PLAN_{id}.md"  # Returns False

# 4. Verify no execution occurred
# Expected: Only 1 entry in mcp_actions.log (dry-run only, no execute)
```

### Test 3: MCP Failure Handling

```powershell
# 1. Create plan with intentionally failing MCP operation
# (e.g., invalid email address)

# 2. Run dry-run → approve → execute

# 3. Verify failure handled
Test-Path "Plans/failed/PLAN_{id}.md"  # Returns True
Test-Path "Logs/mcp_failures/*.log"  # Returns True

# 4. Verify system_log.md has failure entry
Select-String -Path "system_log.md" -Pattern "MCP Failure"

# Expected: Graceful failure handling, plan archived to Plans/failed/
```

## Integration with Other Skills

**Called By:**
- brain_monitor_approvals (Skill 22) - for approved plans

**Calls:**
- brain_log_action (Skill 19) - for each MCP operation
- brain_handle_mcp_failure (Skill 20) - if MCP fails
- brain_archive_plan (Skill 23) - after execution (implicit via file move)

**Requires:**
- MCP server configured and running
- Approved plans in Approved/ folder

## References

- Constitution: `Specs/sp.constitution.md` (Section 4: MCP Governance)
- Specification: `Specs/SPEC_silver_tier.md` (Section 6: MCP Execution)
- Company Handbook: `Company_Handbook.md` (Skill 18)
- Operating Loop: `.claude/skills/silver_operating_loop.md` (Stages 6-7)

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
**Next:** M6 Implementation (MCP server setup, execution testing)
