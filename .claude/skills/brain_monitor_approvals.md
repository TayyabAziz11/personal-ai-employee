# Skill: brain_monitor_approvals

**Tier:** Silver
**Type:** Monitoring Skill
**Version:** 1.0.0
**Skill Number:** 22

## Purpose

Check Approved/ folder for plans ready for execution and trigger brain_execute_with_mcp for each approved plan. This skill runs continuously (scheduled every 15 minutes) or on-demand to detect when users have approved plans.

## Inputs

- **Approved/ Folder:** Directory containing user-approved plans
- **Trigger:** Scheduled task or manual invocation

## Outputs

- **Execution Triggers:** Calls brain_execute_with_mcp for each approved plan
- **Log Entries:** Monitoring activity logged to Logs/scheduler.log and system_log.md

## Preconditions

- Approved/ folder exists
- Plans in Approved/ have Status: Approved
- MCP server configured (for execution)

## Approval Gate

**No** (this skill monitors for approvals, doesn't need approval itself)

## MCP Tools Used

None directly (triggers brain_execute_with_mcp which uses MCP)

## Steps

### 1. Check Approved/ Folder

```powershell
$approvedPlans = Get-ChildItem -Path "Approved/" -Filter "PLAN_*.md"
```

### 2. For Each Plan in Approved/

```powershell
foreach ($planFile in $approvedPlans) {
    # Process each approved plan
}
```

### 3. Verify Plan Status

Read plan and check Status field:

```powershell
$plan = Get-Content $planFile.FullName -Raw

if ($plan -match "Status: Approved") {
    # Plan is ready
} elseif ($plan -match "Status: Pending_Approval") {
    # User moved file but didn't update status - update it
    $plan = $plan -replace "Status: Pending_Approval", "Status: Approved"
    $plan | Out-File -FilePath $planFile.FullName -Encoding UTF8
} else {
    # Unexpected status - log warning
    Write-Warning "Plan $($planFile.Name) has unexpected status"
}
```

### 4. Trigger brain_execute_with_mcp

For each approved plan:

```powershell
# Call brain_execute_with_mcp (Skill 18)
& brain_execute_with_mcp --plan $planFile.FullName
```

### 5. Handle Execution Results

Based on brain_execute_with_mcp outcome:

**If execution succeeds:**
- Plan moved to Plans/completed/ (by brain_execute_with_mcp)
- Continue monitoring

**If execution fails:**
- Plan moved to Plans/failed/ (by brain_handle_mcp_failure)
- Continue monitoring (don't stop on one failure)

### 6. Log Monitoring Activity

Append to Logs/scheduler.log (if scheduled) or system_log.md (if manual):

```markdown
### {timestamp} - approvals_monitored
**Skill:** brain_monitor_approvals (Skill 22)
**Files Checked:** Approved/ folder
**Plans Found:** {count}
**Plans Executed:** {count}
**Plans Failed:** {count}

**Outcome:** ✓ OK - Monitoring complete
```

## Failure Handling

### What to Do:
1. **If Approved/ folder doesn't exist:**
   - Log error to system_log.md
   - Display error: "Approved/ folder not found - run M1 vault setup"
   - STOP

2. **If plan file is corrupted/unreadable:**
   - Log warning to system_log.md
   - Skip this plan, continue with others
   - Notify user of corrupted plan

3. **If execution fails for one plan:**
   - Log failure (brain_handle_mcp_failure does this)
   - Continue monitoring other plans
   - Do NOT stop entire monitoring loop

4. **If no MCP server configured:**
   - Log error to system_log.md
   - Display error: "MCP server not configured - cannot execute plans"
   - STOP

### What NOT to Do:
- ❌ Do NOT execute plans without verifying they're in Approved/
- ❌ Do NOT stop monitoring if one plan fails (continue with others)
- ❌ Do NOT modify plan content during monitoring
- ❌ Do NOT delete approved plans (they're moved by execution skill)
- ❌ Do NOT skip logging

## Logging Requirements

### Logs/scheduler.log
(If run by scheduled task):
```
[YYYY-MM-DD HH:MM:SS UTC] Scheduled Task: brain_monitor_approvals
Plans in Approved/: {count}
Plans Executed: {count}
Plans Failed: {count}
Status: SUCCESS / FAILURE
Duration: {seconds}s
```

### system_log.md
(If run manually):
```markdown
### {YYYY-MM-DD HH:MM:SS UTC} - approvals_monitored
**Skill:** brain_monitor_approvals (Skill 22)
**Trigger:** Manual / Scheduled
**Files Checked:** Approved/PLAN_*.md

**Outcome:** ✓ OK / ✗ FAIL - {description}
- Plans Found: {count}
- Plans Executed: {count}
- Plans Failed: {count}
- Duration: {seconds}s
```

## Definition of Done

- [ ] Approved/ folder checked for plan files
- [ ] All approved plans detected
- [ ] brain_execute_with_mcp triggered for each plan
- [ ] Execution results handled (success/failure)
- [ ] Monitoring activity logged
- [ ] Failed plans don't stop monitoring loop
- [ ] No approved plans left unprocessed

## Test Procedure (Windows)

### Test 1: Detect Approved Plan

```powershell
# 1. Create approved plan in Approved/
New-Item -ItemType Directory -Path "Approved" -Force
@"
# Plan: Test Approved

**Plan ID:** PLAN_2026-02-11_test-approved
**Status:** Approved

## Objective
Test approval monitoring

(All other sections filled...)
"@ | Out-File -FilePath "Approved/PLAN_2026-02-11_test-approved.md" -Encoding UTF8

# 2. Run brain_monitor_approvals
# Expected: Plan detected, brain_execute_with_mcp triggered

# 3. Verify monitoring logged
Select-String -Path "Logs/scheduler.log" -Pattern "brain_monitor_approvals" | Select-Object -Last 1
# OR (if run manually):
Select-String -Path "system_log.md" -Pattern "approvals_monitored" | Select-Object -Last 1

# 4. Verify plan was processed
# Expected: Plan moved from Approved/ to Plans/completed/ or Plans/failed/
```

### Test 2: Handle Multiple Approved Plans

```powershell
# 1. Create multiple approved plans
for ($i = 1; $i -le 3; $i++) {
    @"
# Plan: Test $i
**Plan ID:** PLAN_2026-02-11_test-$i
**Status:** Approved
"@ | Out-File -FilePath "Approved/PLAN_2026-02-11_test-$i.md" -Encoding UTF8
}

# 2. Run brain_monitor_approvals
# Expected: All 3 plans detected and processed

# 3. Verify count in logs
Select-String -Path "system_log.md" -Pattern "Plans Found: 3" | Select-Object -Last 1

# Expected: All plans processed
```

### Test 3: Handle Empty Approved/ Folder

```powershell
# 1. Ensure Approved/ is empty
Remove-Item -Path "Approved/PLAN_*.md" -Force -ErrorAction SilentlyContinue

# 2. Run brain_monitor_approvals
# Expected: No errors, logs show "Plans Found: 0"

# 3. Verify log entry
Select-String -Path "system_log.md" -Pattern "Plans Found: 0" | Select-Object -Last 1

# Expected: Graceful handling of empty folder
```

## Integration with Other Skills

**Called By:**
- Scheduled task (every 15 minutes)
- User (manual monitoring trigger)

**Calls:**
- brain_execute_with_mcp (Skill 18) - for each approved plan

**Triggered After:**
- User manually moves plan from Pending_Approval/ to Approved/

## References

- Constitution: `Specs/sp.constitution.md` (Section 3.4: Approval Monitoring)
- Specification: `Specs/SPEC_silver_tier.md` (Section 5.4: Continuous Monitoring)
- Company Handbook: `Company_Handbook.md` (Skill 22)
- Operating Loop: `.claude/skills/silver_operating_loop.md` (Stage 5)

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
**Next:** M7 Implementation (scheduled task setup)
