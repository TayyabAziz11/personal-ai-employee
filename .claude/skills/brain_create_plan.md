# Skill: brain_create_plan

**Tier:** Silver
**Type:** Planning Skill
**Version:** 1.0.0
**Skill Number:** 16

## Purpose

Generate plan files for external actions that require MCP tool invocation. This skill creates structured, auditable plans that document what will be done, why, how, and what risks exist. All plans must be approved by the user before execution.

## Inputs

- **Task File:** Path to task in Needs_Action/ requiring external action
- **Task Context:** Description of what needs to be done

## Outputs

- **Plan File:** `Plans/PLAN_{YYYY-MM-DD}_{slug}.md` with Status: Draft
- **Updated Task File:** Link to plan added to task file
- **System Log Entry:** Plan creation logged to system_log.md

## Preconditions

- Task file exists in Needs_Action/
- Plans/PLAN_TEMPLATE.md exists
- Task requires external action (MCP call, email, calendar, file ops)
- system_log.md is initialized

## Approval Gate

**No** (this skill creates plans but doesn't execute external actions)

## MCP Tools Used

None (planning skill, no external actions)

## Steps

### 1. Determine if Plan Required

Check if task meets ANY of these criteria:
- Requires external action (email, calendar update, file operation)
- Requires MCP tool invocation
- Has more than 3 execution steps
- Risk level is Medium or High
- Affects shared/external systems

**If NO criteria met:** Skip plan creation, execute directly with Bronze skills

**If ANY criteria met:** Proceed to step 2

### 2. Generate Plan ID

Format: `PLAN_{YYYY-MM-DD}_{slug}`

**Slug generation:**
- Extract key words from task objective (2-4 words)
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters

**Examples:**
- Task: "Reply to John's email about project timeline"
  - Plan ID: `PLAN_2026-02-11_reply-to-john`
- Task: "Schedule meeting with team"
  - Plan ID: `PLAN_2026-02-11_schedule-meeting`
- Task: "Update calendar event"
  - Plan ID: `PLAN_2026-02-11_update-calendar`

### 3. Copy Plan Template

```powershell
Copy-Item -Path "Plans/PLAN_TEMPLATE.md" -Destination "Plans/PLAN_{id}.md"
```

### 4. Fill Mandatory Sections

Open `Plans/PLAN_{id}.md` and fill all sections:

#### 4.1 Plan ID and Metadata
```markdown
# Plan: {descriptive_title}

**Plan ID:** PLAN_{YYYY-MM-DD}_{slug}
**Created:** {YYYY-MM-DD HH:MM:SS UTC}
**Task Reference:** [Link to task file]
**Status:** Draft
```

#### 4.2 Objective
One-line goal statement:
```markdown
## Objective

{What this plan accomplishes in one sentence}

Example: Send email reply to john@example.com regarding project timeline.
```

#### 4.3 Success Criteria
Measurable outcomes (2-5 criteria):
```markdown
## Success Criteria

- [ ] Email sent to john@example.com
- [ ] Email contains project timeline update
- [ ] Email logged to Logs/mcp_actions.log
- [ ] Task marked as Complete in Done/
```

#### 4.4 Files to Touch
All files that will be created/modified:
```markdown
## Files to Touch

**Create:**
- None

**Modify:**
- Needs_Action/{task_file}.md (update status)
- system_log.md (append entry)
- Logs/mcp_actions.log (append MCP call)

**Move:**
- Needs_Action/{task_file}.md → Done/
- This plan file → Plans/completed/
```

#### 4.5 MCP Tools Required
Explicit list with operations and parameters:
```markdown
## MCP Tools Required

1. **gmail.send_email**
   - to: john@example.com
   - subject: Re: Project Timeline
   - body: {email_body_text}
   - dry-run: yes (REQUIRED first)
```

#### 4.6 Approval Gates
Where user approval is needed:
```markdown
## Approval Gates

**Gate 1: Plan Approval**
- User must move this plan from Pending_Approval/ to Approved/
- Required before any execution

**Gate 2: Dry-Run Approval**
- After dry-run results displayed
- User confirms: "Results look good? (yes/no)"
- Required before real execution
```

#### 4.7 Risk Level
Assessment with justification:
```markdown
## Risk Level

**Level:** LOW / MEDIUM / HIGH

**Justification:**
{Why this risk level?}

**Mitigation:**
{What reduces the risk?}

Examples:
- LOW: Internal read-only operation, no external effects
- MEDIUM: External action (email), but can be retried if wrong
- HIGH: Irreversible external action (calendar event deletion)
```

#### 4.8 Rollback Strategy
How to undo if something goes wrong:
```markdown
## Rollback Strategy

**If execution fails:**
1. {Step-by-step rollback procedure}
2. {How to restore to pre-execution state}

**If wrong action taken:**
1. {How to correct the mistake}
2. {Who to contact for escalation}

Example:
- If wrong email sent: Send correction email immediately
- If email failed to send: Retry with corrected parameters
- If unrecoverable: Escalate to user via system_log.md entry
```

#### 4.9 Execution Steps
Numbered, detailed steps:
```markdown
## Execution Steps

1. Verify plan is in Approved/ folder
2. Read plan and extract MCP parameters
3. **Dry-Run Phase:**
   - Call gmail.send_email with --dry-run
   - Display preview to user
   - Request confirmation
4. **Execution Phase (if dry-run approved):**
   - Call gmail.send_email with real parameters
   - Verify email sent (check for success response)
   - Log to Logs/mcp_actions.log
5. Update task status: Complete
6. Archive plan to Plans/completed/
```

#### 4.10 Status
Current plan state:
```markdown
## Status

**Current:** Draft
**Created:** {timestamp}
**Last Updated:** {timestamp}

**History:**
- {timestamp}: Created in Plans/
```

#### 4.11 Dry-Run Results
Placeholder (filled during execution):
```markdown
## Dry-Run Results

**Not yet executed** (will be populated during dry-run phase)
```

#### 4.12 Execution Log
Placeholder (filled during execution):
```markdown
## Execution Log

**Not yet executed** (will be populated during execution phase)
```

### 5. Set Status to Draft

Ensure Status field is set to "Draft"

### 6. Save Plan File

Save to `Plans/PLAN_{id}.md`

### 7. Link Plan from Task File

Update task file to reference plan:
```markdown
**Plan:** [PLAN_{id}](../Plans/PLAN_{id}.md)
**Plan Status:** Draft
```

### 8. Log to system_log.md

Append entry:
```markdown
### {timestamp} - plan_created
**Skill:** brain_create_plan (Skill 16)
**Files Touched:**
- Created: Plans/PLAN_{id}.md
- Modified: Needs_Action/{task}.md

**Outcome:** ✓ OK - Plan created for {task_description}
- Plan ID: PLAN_{id}
- Risk Level: {level}
- MCP Tools: {list}
- Status: Draft
- Next: brain_request_approval
```

## Failure Handling

### What to Do:
1. If plan template missing:
   - Log error to system_log.md
   - Notify user: "Plan template not found at Plans/PLAN_TEMPLATE.md"
   - STOP (cannot create plan without template)

2. If cannot write to Plans/:
   - Log error to system_log.md
   - Notify user: "Cannot write to Plans/ folder - check permissions"
   - STOP

3. If task file missing:
   - Log warning to system_log.md
   - Create plan anyway (might be manual invocation)
   - Include note in plan: "Task file not found - manual plan creation"

### What NOT to Do:
- ❌ Do NOT create plan without all mandatory sections filled
- ❌ Do NOT skip risk level assessment
- ❌ Do NOT set Status to anything other than "Draft"
- ❌ Do NOT execute any external actions (this is planning only)
- ❌ Do NOT create plan for internal-only operations that don't need approval

## Logging Requirements

### system_log.md
One entry per plan creation:
```markdown
### {YYYY-MM-DD HH:MM:SS UTC} - plan_created
**Skill:** brain_create_plan (Skill 16)
**Files Touched:**
- Created: Plans/PLAN_{id}.md (Status: Draft)
- Modified: {task_file}.md

**Outcome:** ✓ OK / ✗ FAIL - {description}
- Plan ID: {id}
- Objective: {one-line objective}
- Risk Level: {LOW/MEDIUM/HIGH}
- MCP Tools: {tool1, tool2, ...}
- Status: Draft
- Next Step: brain_request_approval
```

### No other logs required
(This skill doesn't use MCP or watchers)

## Definition of Done

- [ ] Plan file exists at Plans/PLAN_{id}.md
- [ ] All 12 mandatory sections are filled (not just placeholders)
- [ ] Status is set to "Draft"
- [ ] Plan ID follows naming convention
- [ ] Risk level is assessed with justification
- [ ] MCP tools are explicitly listed with parameters
- [ ] Execution steps are numbered and detailed
- [ ] Rollback strategy is defined
- [ ] Task file links to plan (if task file exists)
- [ ] system_log.md entry created

## Test Procedure (Windows)

### Test 1: Create Plan for Email Send

```powershell
# 1. Create test task file
New-Item -ItemType File -Path "Needs_Action/test_reply.md" -Force
@"
# Reply to John
**From:** john@example.com
**Subject:** Project Update
**Action:** Reply with timeline
"@ | Out-File -FilePath "Needs_Action/test_reply.md" -Encoding UTF8

# 2. Trigger brain_create_plan (manual invocation)
# Expected: Creates Plans/PLAN_2026-02-11_reply-to-john.md

# 3. Verify plan file created
Test-Path "Plans/PLAN_*.md"  # Returns True

# 4. Verify plan structure
$plan = Get-Content "Plans/PLAN_*.md" -Raw
$plan -match "## Objective"  # Returns True
$plan -match "## MCP Tools Required"  # Returns True
$plan -match "Status: Draft"  # Returns True

# 5. Verify system_log.md entry
Select-String -Path "system_log.md" -Pattern "plan_created" | Select-Object -Last 1

# 6. Verify task file updated
Select-String -Path "Needs_Action/test_reply.md" -Pattern "Plan:"  # Returns match

# Expected: All checks pass
```

### Test 2: Verify All Mandatory Sections

```powershell
# Read created plan
$plan = Get-Content "Plans/PLAN_*.md" -Raw

# Check all 12 sections exist
$sections = @(
    "# Plan:",
    "## Objective",
    "## Success Criteria",
    "## Files to Touch",
    "## MCP Tools Required",
    "## Approval Gates",
    "## Risk Level",
    "## Rollback Strategy",
    "## Execution Steps",
    "## Status",
    "## Dry-Run Results",
    "## Execution Log"
)

foreach ($section in $sections) {
    if ($plan -match [regex]::Escape($section)) {
        Write-Host "✓ $section found"
    } else {
        Write-Host "✗ $section MISSING"
    }
}

# Expected: All sections found
```

### Test 3: Plan ID Format Validation

```powershell
# Verify plan ID follows PLAN_{YYYY-MM-DD}_{slug} format
$planFiles = Get-ChildItem -Path "Plans/" -Filter "PLAN_*.md"
foreach ($file in $planFiles) {
    if ($file.Name -match "^PLAN_\d{4}-\d{2}-\d{2}_[a-z0-9-]+\.md$") {
        Write-Host "✓ Valid plan ID: $($file.Name)"
    } else {
        Write-Host "✗ Invalid plan ID: $($file.Name)"
    }
}

# Expected: All plan IDs valid
```

## Integration with Other Skills

**Called By:**
- Bronze processing skills (when external action needed)
- User (manual plan creation)

**Calls:**
- None (standalone planning skill)

**Followed By:**
- brain_request_approval (Skill 17) - moves plan to approval workflow

## References

- Constitution: `Specs/sp.constitution.md` (Section 3.4: Plan-First Workflow)
- Specification: `Specs/SPEC_silver_tier.md` (Section 5.2: Planning)
- Plan Template: `Plans/PLAN_TEMPLATE.md`
- Company Handbook: `Company_Handbook.md` (Skill 16)

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
**Next:** M4 Implementation (create PLAN_TEMPLATE.md, test plan creation)
