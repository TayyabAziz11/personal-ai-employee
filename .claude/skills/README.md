# Silver Skills Pack - MCP-First Agent Skills

**Tier:** Silver
**Created:** 2026-02-11
**Purpose:** Human-in-the-loop approval workflow with MCP integration

## Overview

This skills pack implements the Silver Tier operating model for the Personal AI Employee. All external actions (MCP calls) require explicit human approval through a file-based workflow.

## Core Operating Model

**Perception → Reasoning → Plan → Approval → Action → Logging**

All Silver Tier skills follow this pipeline. External actions (email, calendar, file operations) MUST:
1. Generate a plan file (brain_create_plan)
2. Request approval (brain_request_approval)
3. Wait for human to move file to Approved/
4. Execute with dry-run first (brain_execute_with_mcp)
5. Log all actions (brain_log_action)

## Skills Index

### Meta Skill

| Skill | File | Purpose |
|-------|------|---------|
| **silver_operating_loop** | [silver_operating_loop.md](silver_operating_loop.md) | Complete Silver Tier workflow with state transitions |

### Perception Skills

| Skill | File | Purpose |
|-------|------|---------|
| **watcher_gmail** | [watcher_gmail.md](watcher_gmail.md) | Gmail OAuth2 watcher (perception-only, no actions) |

### Planning Skills

| Skill | File | Purpose |
|-------|------|---------|
| **brain_create_plan** | [brain_create_plan.md](brain_create_plan.md) | Generate plan files for external actions |
| **brain_request_approval** | [brain_request_approval.md](brain_request_approval.md) | Move plans to Pending_Approval/ with notification |
| **brain_monitor_approvals** | [brain_monitor_approvals.md](brain_monitor_approvals.md) | Check Approved/ folder for ready plans |

### Execution Skills

| Skill | File | Purpose |
|-------|------|---------|
| **brain_execute_with_mcp** | [brain_execute_with_mcp.md](brain_execute_with_mcp.md) | Execute approved plans via MCP (dry-run first) |
| **brain_log_action** | [brain_log_action.md](brain_log_action.md) | Log MCP actions to audit trail |
| **brain_handle_mcp_failure** | [brain_handle_mcp_failure.md](brain_handle_mcp_failure.md) | Handle MCP failures with escalation |

### Archival & Summary Skills

| Skill | File | Purpose |
|-------|------|---------|
| **brain_archive_plan** | [brain_archive_plan.md](brain_archive_plan.md) | Archive executed/rejected plans |
| **brain_generate_summary** | [brain_generate_summary.md](brain_generate_summary.md) | Generate daily/weekly summaries |

## MCP Governance Rules (CRITICAL)

For ANY external action (email, calendar, file ops):

✅ **MUST:**
- Have an approved plan file in Approved/ folder
- Support dry-run mode (preview before execution)
- Log to Logs/mcp_actions.log AND system_log.md
- STOP immediately on MCP failure (no retries without approval)
- Never claim execution succeeded if MCP call failed

❌ **MUST NOT:**
- Execute MCP calls without approved plan
- Skip dry-run phase
- Continue execution after MCP failure
- Modify plan after approval (create new plan instead)
- Delete audit trail files

## State Transitions

Plans progress through these states:

```
Draft → Pending_Approval → Approved → Executed → Archived
                        ↓
                    Rejected → Archived
```

## Folder Structure

```
Pending_Approval/     # Plans awaiting user review
Approved/             # Plans ready for execution
Rejected/             # Plans rejected by user
Plans/completed/      # Successfully executed plans
Plans/failed/         # Plans that failed execution
Logs/mcp_actions.log  # MCP action audit trail
Logs/gmail_watcher.log # Gmail watcher operations
Logs/scheduler.log    # Scheduled task executions
system_log.md         # System-wide audit log
```

## Usage Example

1. **Email arrives** → watcher_gmail creates intake wrapper in Needs_Action/
2. **Process request** → brain_create_plan generates PLAN_2026-02-11_reply-to-john.md
3. **Request approval** → brain_request_approval moves plan to Pending_Approval/
4. **User reviews** → Manually move file to Approved/ (or Rejected/)
5. **Execute dry-run** → brain_execute_with_mcp with --dry-run flag
6. **User confirms** → brain_execute_with_mcp with --execute flag
7. **Log action** → brain_log_action appends to Logs/mcp_actions.log
8. **Archive plan** → brain_archive_plan moves to Plans/completed/

## Integration with Bronze Tier

Silver Tier extends Bronze foundation:
- Bronze: Filesystem watcher (Inbox/ → Needs_Action/)
- Silver: Gmail watcher (Gmail → Needs_Action/)
- Bronze: Manual processing of tasks
- Silver: MCP-based external actions with HITL approval

All Bronze skills (Skills 1-15) remain functional and unchanged.

## Testing

Each skill includes a "Test Procedure" section with Windows-compatible validation commands. All skills can be tested independently before integration.

## References

- Constitution: `Specs/sp.constitution.md`
- Specification: `Specs/SPEC_silver_tier.md`
- Implementation Plan: `Plans/PLAN_silver_tier_implementation.md`
- Task Breakdown: `Tasks/SILVER_TASKS.md`
- Company Handbook: `Company_Handbook.md` (Skills 16-24)

---

**Version:** 1.0.0-silver
**Last Updated:** 2026-02-11
**Status:** M2 Complete (Documentation)
