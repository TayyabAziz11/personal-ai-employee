# Silver Tier Demo Script - 5-Minute Judge Demo

**Hackathon 0 - Personal AI Employee**
**Tier:** Silver (Bronze + MCP + Human-in-the-Loop Approvals)
**Demo Duration:** 5 minutes
**Last Updated:** 2026-02-15

---

## Overview

This demo showcases the **Silver Tier Personal AI Employee** - an autonomous FTE that perceives tasks, creates plans, seeks approval, and executes real external actions via Gmail API.

**Architecture:** Perception → Plan → Approval → Action → Logging

---

## Demo Setup (Pre-Demo)

Before starting the demo:

1. **Open Obsidian** in Reading Mode with `Dashboard.md` displayed
2. **Open VS Code** with project root
3. **Open Terminal** in project directory
4. **Verify Gmail authentication:**
   ```bash
   python3 gmail_api_helper.py --check-auth
   ```

---

## Demo Flow (5 Minutes)

### 1. Introduction (30 seconds)

> "This is the Silver Tier Personal AI Employee - an autonomous FTE that can perceive tasks from Gmail, create plans, seek human approval, and execute real external actions. The architecture follows a constitutional pipeline: Perception → Plan → Approval → Action → Logging."

**Show:** Dashboard.md in Obsidian (clean overview with metrics)

---

### 2. Perception Layer (60 seconds)

**Gmail Watcher Intake:**

```bash
# Show gmail watcher detecting new tasks
python3 gmail_watcher_skill.py --dry-run --once
```

**What to highlight:**
- ✅ Graceful fallback if no credentials
- ✅ Checkpoint-based processing (no duplicate tasks)
- ✅ PII redaction in logs
- ✅ Creates task files in `Needs_Action/`

**Show:**
- `Needs_Action/` folder with task file (if available, or use existing test task)
- `Logs/gmail_watcher.log` showing checkpoint

---

### 3. Plan-First Workflow (60 seconds)

**Create a plan from task:**

```bash
# Generate plan with 12 mandatory sections
python3 brain_create_plan_skill.py \
  --task Needs_Action/manual_test__real_gmail_send.md \
  --objective "Send verification email for M10 proof" \
  --risk-level Low \
  --status Draft
```

**What to highlight:**
- ✅ 12 mandatory plan sections (Objective, Success Criteria, MCP Tools, Risk Assessment, etc.)
- ✅ Smart "requires plan" detection (external actions need approval)
- ✅ Unique plan ID: `PLAN_YYYYMMDD-HHMM__slug`

**Show:**
- Generated plan file: `Plans/PLAN_*.md`
- Plan template structure (open in VS Code)

---

### 4. Human-in-the-Loop Approval (90 seconds)

**Request approval:**

```bash
# Create approval request
python3 brain_request_approval_skill.py \
  --plan Plans/PLAN_20260215-0347__manual_test_real_gmail_send.md
```

**What to highlight:**
- ✅ Creates `ACTION_*.md` file in `Pending_Approval/`
- ✅ YAML frontmatter with plan summary
- ✅ Risk level, MCP tools, execution steps clearly stated
- ✅ Human reviews and **manually moves** file to `Approved/` or `Rejected/`

**Show:**
- `Pending_Approval/ACTION_*.md` file (open in VS Code)
- **Live action:** Move file to `Approved/` folder

**Process approval:**

```bash
# Monitor and process approval
python3 brain_monitor_approvals_skill.py
```

**What to highlight:**
- ✅ Detects approved/rejected files
- ✅ Updates plan status: `Pending_Approval` → `Approved`
- ✅ Archives ACTION file to `Approved/processed/`
- ✅ Cannot bypass - file movement is required

**Show:**
- Plan file updated: `**Status:** Approved`
- ACTION file archived: `Approved/processed/`

---

### 5. MCP Execution with Dry-Run (60 seconds)

**Execute with dry-run (mandatory default):**

```bash
# Dry-run shows preview without real action
python3 brain_execute_with_mcp_skill.py \
  --plan Plans/PLAN_20260215-0347__manual_test_real_gmail_send.md \
  --dry-run
```

**What to highlight:**
- ✅ Dry-run is **default** mode (safety-first)
- ✅ Shows email preview (to, subject, body snippet)
- ✅ No real action taken
- ✅ JSON logging to `Logs/mcp_actions.log`

**Show:**
- Terminal output with dry-run preview
- `Logs/mcp_actions.log` (last entry shows `"mode": "dry-run"`)

---

### 6. Real Gmail Execution (60 seconds)

**Execute for real (requires explicit flag):**

```bash
# Real execution - sends actual email via Gmail API
python3 brain_execute_with_mcp_skill.py \
  --plan Plans/PLAN_20260215-0347__manual_test_real_gmail_send.md \
  --execute
```

**What to highlight:**
- ✅ Requires explicit `--execute` flag
- ✅ Real Gmail API call (OAuth2 authenticated)
- ✅ Email actually sent and delivered
- ✅ Plan moved to `Plans/completed/`
- ✅ System log records execution

**Show:**
- Terminal output: `✓ Email sent to <REDACTED_EMAIL>`
- `Logs/mcp_actions.log`:
  ```json
  {
    "mode": "execute",
    "success": true,
    "duration_ms": 1088,
    "response_summary": "Email sent to <REDACTED_EMAIL>"
  }
  ```
- `system_log.md` (execution record)
- **Gmail inbox** (if time permits - show received email)

---

### 7. Logging & Audit Trail (30 seconds)

**Show comprehensive logging:**

```bash
# View recent MCP actions
tail -n 5 Logs/mcp_actions.log

# View system log
tail -n 15 system_log.md
```

**What to highlight:**
- ✅ JSON-formatted MCP action logs
- ✅ PII redaction (emails → `<REDACTED_EMAIL>`)
- ✅ Append-only system_log.md
- ✅ Timestamps in UTC
- ✅ Duration metrics (real API vs simulation)

**Show:**
- `Logs/mcp_actions.log` (JSON entries)
- `system_log.md` (execution records)

---

### 8. Daily Summary (30 seconds)

**Generate daily summary:**

```bash
# Generate summary for today
python3 brain_generate_daily_summary_skill.py --date today
```

**What to highlight:**
- ✅ Aggregates activity from all logs
- ✅ Metrics: inbox items, plans created/approved/executed
- ✅ MCP operations breakdown
- ✅ Silver health status (operational/degraded)
- ✅ Links to detailed logs

**Show:**
- `Daily_Summaries/YYYY-MM-DD.md`
- Metrics table and Silver health status
- Dashboard.md automatically links to latest summary

---

## Closing (30 seconds)

> "This Silver Tier Personal AI Employee demonstrates a complete autonomous workflow:
> - **Perception:** Gmail watcher detects tasks
> - **Planning:** Brain creates structured plans with risk assessment
> - **Approval:** Human-in-the-loop file-based approval (cannot be bypassed)
> - **Action:** Real Gmail API execution (OAuth2 authenticated)
> - **Logging:** Comprehensive audit trail with PII redaction
>
> All code is in Python, runs on WSL2, integrates with VS Code + Obsidian, and follows the spec-driven constitutional pipeline architecture."

**Final show:** Dashboard.md with "Real Gmail Mode: ✅ Verified" badge

---

## Demo Artifacts

All demo materials available in the repository:

- **Dashboard:** `Dashboard.md` (Obsidian Reading Mode)
- **Test Report:** `Docs/test_report_silver_e2e.md` (7 tests, all passed)
- **Completion Checklist:** `Docs/silver_completion_checklist.md` (Silver requirements)
- **Setup Guide:** `README.md` (Quick Start + WSL setup)
- **Architecture Spec:** `Specs/SPEC_silver_tier.md`
- **Implementation Plan:** `Plans/PLAN_silver_tier_implementation.md`

---

## Backup Scenarios

If live demo encounters issues:

1. **Gmail auth fails:** Show pre-recorded logs and explain OAuth2 setup
2. **No new emails:** Use existing `Needs_Action/manual_test__real_gmail_send.md` task
3. **Time constraints:** Skip perception layer, start from existing plan
4. **Network issues:** Show dry-run execution only (no real send)

---

## Technical Stack

- **Language:** Python 3.10+
- **Platform:** WSL2 (Ubuntu on Windows)
- **IDE:** VS Code + Obsidian
- **Libraries:** google-api-python-client, google-auth-oauthlib
- **Architecture:** Constitutional pipeline (Bronze + MCP + HITL)
- **State Machine:** Draft → Pending_Approval → Approved → Executed/Rejected/Failed
- **Logging:** Append-only JSON + Markdown

---

## Judge Evaluation Criteria Coverage

This demo addresses all Hackathon 0 judging criteria:

1. ✅ **Functionality:** Full end-to-end workflow with real external actions
2. ✅ **Innovation:** Constitutional pipeline + file-based HITL approval system
3. ✅ **Code Quality:** Modular Python skills, PII redaction, error handling
4. ✅ **Documentation:** Comprehensive specs, plans, test reports, this demo script
5. ✅ **Presentation:** 5-minute structured demo with clear architecture explanation

---

**End of Demo Script**
