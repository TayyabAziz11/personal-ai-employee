# Skill: brain_archive_plan

**Tier:** Silver
**Type:** Archival Skill
**Version:** 1.0.0
**Skill Number:** 23

## Purpose

Archive executed and rejected plans to appropriate folders (Plans/completed/, Plans/failed/, Rejected/). Maintains audit trail and keeps active folders clean.

## Inputs

- **Plan File:** Path to plan ready for archival
- **Archive Reason:** Executed | Failed | Rejected

## Outputs

- **Plan Moved:** Plan archived to appropriate folder
- **System Log Entry:** Archival logged

## Preconditions

- Plan has terminal status (Executed, Failed, or Rejected)
- Target archive folder exists

## Approval Gate

**No** (archival is automatic after execution/rejection)

## MCP Tools Used

None (file management skill)

## Steps

### 1. Determine Archive Destination

Based on plan status:
- **Status: Executed** → `Plans/completed/`
- **Status: Failed** → `Plans/failed/`
- **In Rejected/ folder** → Keep in `Rejected/` (already archived)

### 2. Verify Plan is Terminal

Check that plan has reached a terminal state:
```powershell
$plan = Get-Content $planPath -Raw

$isTerminal = $plan -match "Status: (Executed|Failed|Rejected)"

if (-not $isTerminal) {
    Write-Error "Plan is not in terminal state - cannot archive"
    exit 1
}
```

### 3. Move Plan File

```powershell
$destination = switch ($status) {
    "Executed" { "Plans/completed/" }
    "Failed" { "Plans/failed/" }
    "Rejected" { "Rejected/" }
}

Move-Item -Path $planPath -Destination "$destination/PLAN_{id}.md"
```

### 4. Update Task File (if exists)

```markdown
**Plan:** [PLAN_{id}](../Plans/{completed|failed}/PLAN_{id}.md)
**Plan Status:** {Executed|Failed}
**Archived:** {timestamp}
```

### 5. Log to system_log.md

```markdown
### {timestamp} - plan_archived
**Skill:** brain_archive_plan (Skill 23)
**Plan:** PLAN_{id}
**Reason:** {Executed|Failed|Rejected}
**Destination:** {archive_folder}

**Outcome:** ✓ OK - Plan archived
```

## Failure Handling

### What to Do:
- If archive folder doesn't exist: Create it, then archive
- If cannot move file: Log error, keep plan in current location

### What NOT to Do:
- ❌ Do NOT archive plans still in active workflow
- ❌ Do NOT delete plans (archive preserves audit trail)
- ❌ Do NOT modify plan content during archival

## Logging Requirements

system_log.md entry for each archival

## Definition of Done

- [ ] Plan in terminal state verified
- [ ] Plan moved to correct archive folder
- [ ] Task file updated (if exists)
- [ ] system_log.md entry created
- [ ] Plan accessible in archive for audit

## Test Procedure (Windows)

```powershell
# Create executed plan
@"
# Plan: Test
**Status:** Executed
"@ | Out-File -FilePath "Approved/PLAN_test.md" -Encoding UTF8

# Archive it
brain_archive_plan -PlanPath "Approved/PLAN_test.md" -Reason "Executed"

# Verify moved
Test-Path "Plans/completed/PLAN_test.md"  # Returns True
Test-Path "Approved/PLAN_test.md"  # Returns False
```

## Integration

**Called By:** brain_execute_with_mcp (Skill 18) after execution
**Calls:** None

## References

- Constitution: `Specs/sp.constitution.md` (Section 3.5: Archival)
- Specification: `Specs/SPEC_silver_tier.md` (Section 5.5: Plan Lifecycle)

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
