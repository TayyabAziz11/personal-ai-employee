# Plan: [Task Title]

**Created:** [YYYY-MM-DD HH:MM UTC]
**Status:** [Draft / Pending_Approval / Approved / Rejected / Executed]
**Task Reference:** [Link to Needs_Action/<task-file>.md]
**Risk Level:** [Low / Medium / High]

---

## Objective

[One-sentence goal statement describing what this plan will achieve]

---

## Success Criteria

- [ ] [Testable criterion 1 - specific, measurable outcome]
- [ ] [Testable criterion 2 - specific, measurable outcome]
- [ ] [Testable criterion 3 - specific, measurable outcome]

---

## Inputs / Context

**Source Task:** [Description of originating task]
**Requester:** [Email/intake source]
**Priority:** [Low / Medium / High / Critical]
**Context:** [Any relevant background information]

---

## Files to Touch

### Create
- [file-path-1] - [purpose and content description]
- [file-path-2] - [purpose and content description]

### Modify
- [file-path-3] - [what will change and why]
- [file-path-4] - [what will change and why]

### Delete
- [file-path-5] - [why deletion is needed]

---

## MCP Tools Required

| Tool Name | Operation | Parameters | Dry-Run? | Approval Required? |
|-----------|-----------|------------|----------|-------------------|
| gmail     | send_email | to, subject, body | Yes | Yes |
| context7  | query-docs | libraryId, query | N/A | No (read-only) |

**Note:** If no MCP tools required, write "None"

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
   - **Mitigation:** [How to reduce/avoid this risk]
   - **Blast Radius:** [What's affected if this fails]

2. [Risk 2: description]
   - **Mitigation:** [How to reduce/avoid this risk]
   - **Blast Radius:** [What's affected if this fails]

**Kill Switch:** [How to abort execution if something goes wrong]

---

## Execution Steps (Sequential)

1. [Step 1: specific action with clear outcome]
   - **Tool:** [Bash / MCP / Manual / Python]
   - **Command/Call:** [Exact command or MCP invocation]
   - **Expected Outcome:** [What should happen when this succeeds]
   - **Rollback:** [How to undo this step if needed]

2. [Step 2: specific action with clear outcome]
   - **Tool:** [Bash / MCP / Manual / Python]
   - **Command/Call:** [Exact command or MCP invocation]
   - **Expected Outcome:** [What should happen when this succeeds]
   - **Rollback:** [How to undo this step if needed]

3. [Continue for all steps...]

---

## Rollback Strategy

**If execution fails at any step:**
1. [Rollback step 1 - undo most recent change first]
2. [Rollback step 2 - work backwards through steps]
3. [Notification to user with error details]

**Data Preservation:**
- [What data is backed up before changes]
- [Where backups are stored]

**Manual Intervention Required:** [Describe any steps that cannot be automated]

---

## Dry-Run Results (Populated After Dry-Run)

**Dry-Run Executed:** [YYYY-MM-DD HH:MM UTC]

**Results:**
```
[Dry-run output from MCP tools or preview of changes]
[Include any warnings, confirmations, or simulated outcomes]
```

**User Approval After Dry-Run:** [Pending / Approved / Rejected]
**Reviewer Notes:** [Any comments from user review]

---

## Execution Log (Populated During Execution)

**Execution Started:** [YYYY-MM-DD HH:MM UTC]

| Step | Status | Timestamp | Output | Errors |
|------|--------|-----------|--------|--------|
| 1    | ✓ OK   | [time]    | [summary] | None |
| 2    | ✓ OK   | [time]    | [summary] | None |
| 3    | ⚠ WARN | [time]    | [summary] | [warning details] |

**Execution Completed:** [YYYY-MM-DD HH:MM UTC]
**Final Status:** [Success / Partial Success / Failed]
**Post-Execution Verification:** [How to verify the plan achieved its objective]

---

## Definition of Done

**This plan is considered complete when:**
- [ ] All execution steps completed successfully
- [ ] Success criteria verified and checked off
- [ ] Execution log populated with all step results
- [ ] No rollback required, OR rollback completed successfully
- [ ] system_log.md updated with plan execution entry
- [ ] Task file in Needs_Action/ marked complete or archived
- [ ] Dashboard.md updated to reflect completion

---

## State Machine

**Status Transitions:**
```
Draft → Pending_Approval → Approved → Executed → Archived
                        ↓
                    Rejected → Archived
```

**Current Status:** [Status from header]
**Last Updated:** [YYYY-MM-DD HH:MM UTC]
**Updated By:** [Agent / User]

---

## Notes

[Any additional context, decisions, or observations that don't fit above sections]
