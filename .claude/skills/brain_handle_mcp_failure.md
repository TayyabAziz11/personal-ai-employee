# Skill: brain_handle_mcp_failure

**Tier:** Silver
**Type:** Error Handling Skill
**Version:** 1.0.0
**Skill Number:** 20

## Purpose

Handle MCP failures with escalation and complete audit trail. CRITICAL: This skill STOPS execution immediately when called - no retries without new approval.

## Inputs

- **Failure Details:** Tool, operation, error message, timestamp, plan ID
- **Plan Path:** Path to failed plan file

## Outputs

- **Escalation Log:** Logs/mcp_failures/{timestamp}_failure.log
- **Plan Updated:** Status set to "Failed", moved to Plans/failed/
- **Task Updated:** Status set to "Blocked - MCP Failure"
- **Notification:** User alert displayed

## Preconditions

- MCP failure occurred during execution
- Plan file exists

## Approval Gate

**No** (error handling skill)

## MCP Tools Used

None (handles MCP failures, doesn't use MCP)

## Steps

### 1. Create Escalation Log

File: `Logs/mcp_failures/{YYYY-MM-DD}_{HH-MM-SS}_failure.log`

```
═══════════════════════════════════════════════════════════
  MCP FAILURE ESCALATION
═══════════════════════════════════════════════════════════
Timestamp: {YYYY-MM-DD HH:MM:SS UTC}
Plan ID: {plan_id}
Tool: {tool}
Operation: {operation}
Parameters: {parameters}
Error: {error_message}
Duration: {seconds}s

EXECUTION STOPPED
No further operations were attempted after this failure.

Recommended Actions:
1. Review error message above
2. Check MCP server logs
3. Verify MCP tool configuration
4. Update plan if parameters were wrong
5. Request new approval if retry needed

Plan Status: Failed
Plan Location: Plans/failed/{plan_id}.md
═══════════════════════════════════════════════════════════
```

### 2. Update Plan Status

```markdown
## Status

**Current:** Failed
**Failed At:** {timestamp}
**Error:** {error_message}

**History:**
- ...
- {timestamp}: Execution FAILED (brain_handle_mcp_failure)
```

Add failure section:
```markdown
## Failure Details

**Error Occurred:** {timestamp}
**Tool:** {tool}.{operation}
**Error Message:** {error_message}
**Escalation Log:** Logs/mcp_failures/{timestamp}_failure.log

**Actions Taken:**
- Execution STOPPED immediately
- Plan moved to Plans/failed/
- Escalation log created
- User notified

**To Retry:**
Create new plan with corrected parameters.
```

### 3. Move Plan to Plans/failed/

```powershell
Move-Item -Path $planPath -Destination "Plans/failed/PLAN_{id}.md"
```

### 4. Update Task Status

If task file exists:
```markdown
**Status:** Blocked - MCP Failure
**Error:** {brief_error}
**Escalation Log:** [View Log](../Logs/mcp_failures/{timestamp}_failure.log)
```

### 5. Display User Notification

```powershell
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "  MCP FAILURE" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "Plan: $planTitle" -ForegroundColor White
Write-Host "Tool: $tool.$operation" -ForegroundColor Gray
Write-Host "Error: $errorMessage" -ForegroundColor Red
Write-Host ""
Write-Host "EXECUTION STOPPED - No further operations attempted" -ForegroundColor Yellow
Write-Host ""
Write-Host "Escalation log: Logs/mcp_failures/{timestamp}_failure.log" -ForegroundColor Gray
Write-Host "Plan moved to: Plans/failed/" -ForegroundColor Gray
Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Red
```

### 6. Log to system_log.md

```markdown
### {timestamp} - mcp_failure_handled
**Skill:** brain_handle_mcp_failure (Skill 20)
**Plan:** PLAN_{id}
**Tool:** {tool}.{operation}

**Outcome:** ✗ FAIL - MCP execution failed
- Error: {error_message}
- Escalation Log: Logs/mcp_failures/{timestamp}_failure.log
- Plan Status: Failed
- Plan Location: Plans/failed/
- Execution: STOPPED (no retry without new approval)
```

### 7. STOP Execution

**CRITICAL:** Exit immediately, do NOT continue with remaining operations.

## Failure Handling

### What to Do:
- Create escalation log even if other steps fail
- Display notification to user
- STOP execution completely

### What NOT to Do:
- ❌ Do NOT retry failed operation automatically
- ❌ Do NOT continue with remaining operations
- ❌ Do NOT modify plan parameters and retry
- ❌ Do NOT claim partial success

## Logging Requirements

Three logs required:
1. Logs/mcp_failures/{timestamp}_failure.log (escalation)
2. system_log.md (failure entry)
3. Plan file (failure details section)

## Definition of Done

- [ ] Escalation log created in Logs/mcp_failures/
- [ ] Plan status updated to "Failed"
- [ ] Plan moved to Plans/failed/
- [ ] Task status updated (if exists)
- [ ] User notification displayed
- [ ] system_log.md entry created
- [ ] Execution STOPPED (no further operations)

## Test Procedure (Windows)

```powershell
# Test failure handling
$failureDetails = @{
    Tool = "gmail"
    Operation = "send_email"
    Error = "SMTP connection failed"
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
    PlanId = "PLAN_2026-02-11_test"
}

brain_handle_mcp_failure -FailureDetails $failureDetails -PlanPath "Approved/PLAN_2026-02-11_test.md"

# Verify outputs
Test-Path "Logs/mcp_failures/*.log"  # Returns True
Test-Path "Plans/failed/PLAN_2026-02-11_test.md"  # Returns True
Select-String -Path "system_log.md" -Pattern "mcp_failure_handled"  # Returns match
```

## Integration

**Called By:** brain_execute_with_mcp (Skill 18) when MCP fails
**Calls:** None

## References

- Constitution: `Specs/sp.constitution.md` (Section 4.4: Failure Handling)
- Specification: `Specs/SPEC_silver_tier.md` (Section 6.3: Error Recovery)

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
