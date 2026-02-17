# Gold Tier Demo Script (5-7 Minutes)

**Audience**: Hackathon Judges
**Duration**: 5-7 minutes
**Mode**: Mock (no real credentials required)
**Prerequisites**: Obsidian installed (for Dashboard viewing)

---

## Demo Objective

Demonstrate Personal AI Employee Gold Tier capabilities:
1. **Multi-channel social perception** (WhatsApp, LinkedIn, Twitter)
2. **Odoo accounting integration** (queries + actions)
3. **Human-in-the-loop approvals** (plan → approval → execution)
4. **Autonomous orchestration** (Ralph loop with safety gates)
5. **Executive reporting** (CEO briefing, accounting audit)
6. **Audit trails** (comprehensive logging)

---

## Setup (30 seconds)

1. **Open Dashboard in Obsidian**:
   ```bash
   # Navigate to repo root
   cd "/mnt/e/Certified Cloud Native Generative and Agentic AI Engineer/Q4 part 2/Q4 part 2/Hackathon-0/Personal AI Employee"

   # Open Obsidian to Dashboard.md
   # In Obsidian: Switch to Reading Mode (Cmd/Ctrl + E)
   ```

2. **Point out key sections** (30 sec):
   - ✅ Silver Tier Complete (Gmail perception + execution)
   - ✅ Gold Tier Status: Social Channels, Accounting, Ralph Loop
   - 📊 Quick Stats: Intake wrappers processed, external actions pending

---

## Act 1: Perception Layer (1.5 minutes)

**Narration**: "The system monitors 4 channels: WhatsApp for customer support, LinkedIn/Twitter for social engagement, and Odoo for accounting. Let's see how it perceives new activity."

### 1. WhatsApp Customer Inquiry (30 sec)

```bash
python3 scripts/whatsapp_watcher_skill.py --mode mock --once --max-results 2
```

**Expected Output**:
```
✅ WhatsApp watcher complete: 2 scanned, 0 created, 2 skipped, 0 errors
```

**Show**:
- Navigate to `Social/Inbox/` (or Needs_Action/)
- Open an existing `inbox__whatsapp__*.md` file
- **Point out**:
  - YAML frontmatter: `source: whatsapp`, `pii_redacted: true`, `status: Needs_Action`, `plan_required: true`
  - Excerpt with redacted phone/email: `[REDACTED]` instead of `+1-234-567-8900`

### 2. LinkedIn Engagement (30 sec)

```bash
python3 scripts/linkedin_watcher_skill.py --mode mock --once --max-results 2
```

**Show**:
- `Social/Inbox/inbox__linkedin__*.md` (if created, else explain checkpointing)
- Mention: System skips already-processed items (checkpoint file prevents duplicates)

#### 2a. LinkedIn Real Mode (OPTIONAL - if credentials configured)

**Prerequisites**: LinkedIn OAuth2 token configured (see `Docs/linkedin_real_setup.md`)

```bash
# Test authentication first
python3 src/personal_ai_employee/core/linkedin_api_helper.py --check-auth

# Run watcher in real mode to fetch actual LinkedIn posts
python3 scripts/linkedin_watcher_skill.py --mode real --once --max-results 3
```

**Expected Output**:
```
✅ LinkedIn auth OK: Your Name
✅ Fetched 3 LinkedIn posts from API
✅ LinkedIn watcher complete: 3 scanned, 3 created, 0 skipped, 0 errors
```

**Show**:
- Intake wrappers in `Social/Inbox/` created from YOUR real LinkedIn posts
- **Point out**: Real post content (with PII redacted in excerpt)
- Checkpoint file `Logs/linkedin_watcher_checkpoint.json` tracks processed post IDs

**Narration**: "In real mode, the watcher fetches your actual LinkedIn posts via OAuth2 API. All credentials are stored securely in `.secrets/` (gitignored). The executor can also post to LinkedIn for real—but only with an approved plan and explicit `--execute` flag."

### 3. Accounting Activity (30 sec)

```bash
python3 scripts/odoo_watcher_skill.py --mode mock --once --max-results 2
```

**Show**:
- Briefly mention: Odoo watcher detects overdue/unpaid invoices, creates intake wrappers in `Business/Accounting/` (or Needs_Action/)

**Narration**: "All perception is read-only. Watchers never send messages or create invoices—they just observe and create intake wrappers for the Brain to decide on."

---

## Act 2: Human-in-the-Loop Workflow (2 minutes)

**Narration**: "The system never acts autonomously without approval. Let's walk through the constitutional pipeline: Perception → Plan → Approval → Action → Logging."

### 1. Create a Plan (30 sec)

```bash
python3 scripts/brain_create_plan_skill.py \
  --task "inbox__whatsapp__20260216-1000__customer123.md" \
  --objective "Reply to customer inquiry about product availability" \
  --risk-level Low \
  --status Pending_Approval
```

**Expected Output**:
```
✅ Plan created: Plans/plan__whatsapp_reply__20260216-1520.md
   Status: Pending_Approval
   Risk Level: Low
```

**Show**:
- Open `Plans/plan__whatsapp_reply__*.md`
- **Point out**:
  - Structured YAML: `task`, `objective`, `risk_level`, `status`, `created_at`
  - Actions list: `[{tool: whatsapp.reply_message, params: {...}}]`
  - Approval requirement: `approval_required: true`

### 2. Request Approval (20 sec)

```bash
python3 scripts/brain_request_approval_skill.py \
  --plan Plans/plan__whatsapp_reply__20260216-1520.md
```

**Expected Output**:
```
✅ Approval requested: Pending_Approval/approval__20260216-1520.md
```

**Show**:
- Navigate to `Pending_Approval/`
- Open the approval file
- **Point out**: Human reviews plan details and decides to approve/reject

### 3. Simulate Human Approval (20 sec)

```bash
# Simulate user approval by moving file
mv Pending_Approval/approval__20260216-1520.md Approved/
```

**Narration**: "In a real workflow, the user (CEO, manager, or designated approver) would review this in the dashboard and click 'Approve' or manually move the file."

### 4. Process Approvals (20 sec)

```bash
python3 scripts/brain_monitor_approvals_skill.py
```

**Expected Output**:
```
✅ Approvals processed: 1 approved, 0 rejected
   Plan status updated: plan__whatsapp_reply__20260216-1520.md → Approved
```

**Show**:
- Open `system_log.md` (tail -20)
- **Point out**: Logged entry: `[2026-02-16 15:20:00] APPROVAL_PROCESSED: plan__whatsapp_reply__20260216-1520.md (Approved)`

### 5. Execute (Dry-Run) (30 sec)

```bash
python3 scripts/brain_execute_social_with_mcp_skill.py --dry-run
```

**Expected Output**:
```
🔍 DRY-RUN MODE: No real actions will be taken
✅ Execution preview: 1 action would be executed
   1. whatsapp.reply_message (customer123, message: "...")
```

**Narration**: "Dry-run is the default. To execute for real, you'd add `--execute` flag. Even then, it logs everything to `Logs/mcp_actions.log` as JSON."

**Show**:
- Open `Logs/mcp_actions.log`
- **Point out**: JSON structure: `{action: "whatsapp.reply_message", status: "preview", timestamp: "..."}`

---

## Act 3: Executive Insights (1.5 minutes)

**Narration**: "The CEO doesn't want to review every Twitter reply or invoice. They want strategic insights. Let's generate executive reports."

### 1. Odoo Revenue Query (30 sec)

```bash
python3 scripts/brain_odoo_query_with_mcp_skill.py \
  --operation revenue_summary \
  --mode mock \
  --report
```

**Expected Output**:
```json
{
  "total_invoiced": 83500.0,
  "total_paid": 42400.0,
  "total_outstanding": 41100.0,
  "outstanding_percentage": 49.22
}
```

**Show**:
- Open `Business/Accounting/Reports/odoo_query__revenue_summary__*.md`
- **Point out**: Formatted report with AR aging, top outstanding customers

### 2. Weekly CEO Briefing (45 sec)

```bash
python3 scripts/brain_generate_weekly_ceo_briefing_skill.py --mode mock
```

**Expected Output**:
```
✅ Weekly CEO briefing generated successfully
   Report: Business/Briefings/CEO_Briefing__2026-W08.md
```

**Show**:
- Open `Business/Briefings/CEO_Briefing__2026-W08.md`
- **Point out 8 sections**:
  1. **KPIs**: Messages monitored, invoices overdue, response SLAs
  2. **Wins**: Successful external actions, revenue collected
  3. **Risks**: High AR%, pending approvals >48h, MCP server downtime
  4. **Outstanding Invoices**: Top 5 customers, total AR
  5. **Social Performance**: Best posts, engagement metrics
  6. **Next Week Priorities**: Recommended focus areas
  7. **Pending Approvals**: Queue summary
  8. **Confidence Summary**: Data quality per section (high/medium/low)

**Narration**: "This briefing synthesizes data from system logs, Odoo, social metrics, and the approval queue. It's 100% automated, generated weekly on Sunday at 23:59 UTC via Task Scheduler."

### 3. Accounting Audit (15 sec)

```bash
python3 scripts/brain_generate_accounting_audit_skill.py --mode mock
```

**Show**:
- Open `Business/Accounting/Reports/accounting_audit__2026-02-16.md`
- Mention: AR aging breakdown (0-30 days, 31-60, 61-90, 90+ days), unpaid invoice count

---

## Act 4: Autonomous Orchestration (Ralph Loop) (1.5 minutes)

**Narration**: "What if we want the AI to work autonomously for repetitive tasks—but with safety rails? Enter Ralph Loop."

### 1. Ralph Loop Demo (45 sec)

```bash
python3 scripts/brain_ralph_loop_orchestrator_skill.py \
  --dry-run \
  --max-iterations 2 \
  --max-plans 2
```

**Expected Output**:
```
======================================================================
Ralph Loop Autonomous Orchestrator (G-M7)
======================================================================
Mode: DRY-RUN
Max Iterations: 2
Max Plans per Iteration: 2

🔄 Iteration 1/2
----------------------------------------------------------------------
  📂 Scanning vault state...
     - Social Inbox: 0 items
     - Accounting Intake: 0 items
     - Needs Action: 2 items
     - Pending Approval: 0 items
  🧠 Deciding next actions...
     ✓ 2 decision(s) made:
       1. [HIGH] Address failure remediation in remediation__mcp__social_executor__*.md
       2. [HIGH] Address failure remediation in remediation__mcp__social_executor__*.md

  🔍 DRY-RUN: Would create 2 plan(s)
     1. Plan slug: remediate_failure
        Description: Address failure remediation...
     2. Plan slug: remediate_failure
        Description: Address failure remediation...
  📊 Iteration 1/2 | Status: COMPLETED | Decisions: 2 | Plans: 0

[Iteration 2 similar]

Ralph Loop Summary
======================================================================
Iterations Completed: 2/2
Total Decisions Made: 4
Total Plans Created: 0 (dry-run)
Final Status: Max iterations reached
======================================================================
```

### 2. Explain Safety Gates (45 sec)

**Narration**:
"Ralph Loop is bounded autonomous execution. Key safety controls:
1. **Max Iterations**: Hard cap (e.g., 10 loops) prevents runaway execution
2. **Max Plans per Iteration**: Limits plan creation (e.g., 5 plans) prevents flooding the approval queue
3. **Approval Gate**: If ANY approval is pending in `Pending_Approval/`, Ralph STOPS immediately—no bypass
4. **Dry-Run Default**: Unless `--execute` flag provided, Ralph only *proposes* plans, never creates them
5. **Timeout**: Each iteration has 5-minute timeout
6. **Logging**: Every decision logged to `Logs/ralph_loop.log` with timestamp, iteration, decision reasoning"

**Show**:
- Open `Logs/ralph_loop.log`
- **Point out**: JSON lines with `{"iteration": 1, "decisions": [...], "plans_created": 0, "halted": false}`

**Narration**: "Ralph never calls external APIs directly. It creates plans, which still require approval. Think of it as a tireless junior employee who drafts proposals for you to review."

---

## Act 5: Audit Trail (30 seconds)

**Narration**: "Transparency is critical. Every action leaves a trail."

### 1. System Log (15 sec)

```bash
tail -30 system_log.md
```

**Point out**:
- Append-only log (never deleted)
- Entries: `[timestamp] EVENT_TYPE: description`
- Examples: `WATCHER_RUN`, `PLAN_CREATED`, `APPROVAL_GRANTED`, `MCP_ACTION_EXECUTED`

### 2. MCP Actions Log (15 sec)

```bash
tail -10 Logs/mcp_actions.log | jq .
```

**Point out**:
- JSON format for machine parsing
- Fields: `action`, `tool`, `params`, `status` (`preview`/`success`/`failure`), `timestamp`, `plan_id`
- No secrets logged (PII redacted)

**Narration**: "If anything goes wrong, we have a full audit trail. Regulators love this. Debugging is trivial."

---

## Closing (30 seconds)

**Narration**:
"In summary, this Personal AI Employee:
- ✅ Monitors 4 channels autonomously (Gmail, WhatsApp, LinkedIn, Twitter)
- ✅ Integrates with Odoo accounting (queries + invoice creation)
- ✅ Requires human approval for all external actions (constitutional HITL)
- ✅ Generates weekly CEO briefing synthesizing multi-domain data
- ✅ Can work autonomously (Ralph loop) but with strict safety bounds
- ✅ Leaves comprehensive audit trails (system_log.md + JSON logs)

All of this runs locally on Windows 11 WSL2, scheduled via Task Scheduler. No cloud dependencies. Secrets never committed."

**Show Dashboard One Last Time**:
- Scroll to "🚀 Gold Demo Start Here" section
- **Point out**:
  - Link to completion checklist: `Docs/gold_completion_checklist.md`
  - Link to test report: `Docs/test_report_gold_e2e.md`
  - Link to architecture doc: `Docs/architecture_gold.md`

**Final Statement**:
"The code is production-ready for mock mode. Real mode requires API credentials, which we've documented in the test report's 'Real Mode Readiness' section. Thank you!"

---

## Q&A Prep

### Likely Questions

**Q**: "How do you prevent the AI from going rogue?"
**A**: Three layers:
1. **Dry-run default**: All executors require `--execute` flag
2. **HITL approvals**: File-based approval system, cannot be bypassed programmatically
3. **Bounded autonomy**: Ralph loop has max iterations, max plans, timeout, and halts if approval pending

**Q**: "What if an MCP server goes down?"
**A**: Graceful degradation. If Twitter MCP is unreachable, the system:
1. Logs the failure to `Logs/mcp_actions.log`
2. Creates a remediation task in `Needs_Action/`
3. Continues running WhatsApp/LinkedIn/Odoo watchers
4. Marks Twitter as "unreachable" in Dashboard's MCP Registry Status

**Q**: "How do you handle PII?"
**A**: Two-pronged approach:
1. **Redaction**: `redact_pii()` function replaces emails/phones with `[REDACTED]` in all logs and intake wrapper excerpts
2. **Gitignore**: `.secrets/` directory contains credentials, never committed to git

**Q**: "Can you show real credentials?"
**A**: No, because we're in mock mode for the demo. But the test report (`Docs/test_report_gold_e2e.md`) documents the "Real Mode Readiness" section with manual verification checklist.

**Q**: "How do you ensure no regressions when adding Gold features?"
**A**: Two strategies:
1. **Regression test suite**: `tests/test_gold_e2e_smoke.py` includes Silver tier tests (Gmail watcher, plan creation)
2. **Constitutional architecture**: Gold extends Silver patterns without modifying core workflows (Perception → Plan → Approval → Action → Logging remains unchanged)

---

## Troubleshooting

### If a command fails during demo:

1. **Import errors**: Ensure you're in repo root:
   ```bash
   cd "/mnt/e/Certified Cloud Native Generative and Agentic AI Engineer/Q4 part 2/Q4 part 2/Hackathon-0/Personal AI Employee"
   ```

2. **"No mock data" errors**: Check `templates/mock_*.json` files exist

3. **Path resolution errors**: Wrappers should use `Path(__file__).parent.parent` to find repo root

4. **Dashboard not updating**: Some skills (e.g., MCP registry) have known path issues—mention this is a known non-blocking issue documented in test report

---

**Demo Script Version**: 1.0
**Last Updated**: 2026-02-16
**Prepared By**: Claude Sonnet 4.5 (Personal AI Employee)
