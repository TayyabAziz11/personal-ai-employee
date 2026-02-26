# Hackathon Odoo Requirements Checklist

**Source**: `output.txt` — "Personal AI Employee Hackathon 0: Building Autonomous FTEs in 2026"
**Tier**: Gold (Autonomous Employee, 40+ hours)
**Last Updated**: 2026-02-22

---

## Gold Tier Requirements (from output.txt, lines 193–209)

All Silver requirements plus:

| # | Requirement | Status |
|---|-------------|--------|
| G1 | Full cross-domain integration (Personal + Business) | ✅ Complete |
| G2 | Create an accounting system in Odoo Community (self-hosted, local) and integrate via MCP server using Odoo's JSON-RPC APIs (Odoo 19+) | ✅ Core files created |
| G3 | Integrate Facebook and Instagram — post messages and generate summary | ✅ Complete |
| G4 | Integrate Twitter (X) — post messages and generate summary | 🟡 Partial (frontend only) |
| G5 | Multiple MCP servers for different action types | ✅ Complete |
| G6 | Weekly Business and Accounting Audit with CEO Briefing generation | 🔲 Pending |
| G7 | Error recovery and graceful degradation | ✅ Complete (remediation tasks) |
| G8 | Comprehensive audit logging | ✅ Complete (mcp_actions.log, system_log.md) |
| G9 | Ralph Wiggum loop for autonomous multi-step task completion | 🔲 Pending |
| G10 | Documentation of architecture and lessons learned | ✅ `Docs/architecture_gold.md`, `lessons_learned_gold.md` |
| G11 | All AI functionality implemented as Agent Skills | ✅ Complete |

---

## Odoo-Specific Acceptance Criteria (G2 expanded)

### A. Odoo Setup & Credentials
- [x] `.secrets/odoo_credentials.json` schema defined (base_url, database, username, password, api_version)
- [x] Docs/mcp_odoo_setup.md — full setup guide with Docker, API key, permissions
- [x] Mock mode supported (no real Odoo required) via `templates/mock_odoo_invoices.json`
- [x] Real mode supported via Odoo JSON-RPC APIs

### B. Core Client (`src/personal_ai_employee/core/odoo_api_helper.py`)
- [x] JSON-RPC authentication (uid via `/xmlrpc/2/common`)
- [x] `execute_kw()` wrapper for all model operations
- [x] List unpaid/overdue invoices (`account.move`)
- [x] Get specific invoice details
- [x] Create invoice (draft state)
- [x] Post/validate invoice
- [x] Register customer payment
- [x] List customers (`res.partner`)
- [x] Revenue summary (aggregated)
- [x] AR aging report
- [x] Mock mode with fixture data

### C. Watcher (`src/personal_ai_employee/skills/gold/odoo_watcher_skill.py`)
- [x] PERCEPTION-ONLY — never executes actions
- [x] Reads mock invoices or real Odoo data
- [x] Creates intake wrappers in `Business/Accounting/` with YAML frontmatter
- [x] Naming: `intake__odoo__YYYYMMDD-HHMM__<customer>.md`
- [x] Checkpoint at `Logs/odoo_watcher_checkpoint.json`
- [x] Remediation task on MCP failure (`Needs_Action/remediation__mcp__odoo__YYYYMMDD-HHMM.md`)
- [x] Appends to `Logs/odoo_watcher.log`

### D. Query Skill (`src/personal_ai_employee/skills/gold/brain_odoo_query_with_mcp_skill.py`)
- [x] Read-only, no approval required
- [x] Supports: list_unpaid_invoices, revenue_summary, ar_aging_summary, list_customers
- [x] Outputs JSON report to `Business/Accounting/Reports/`
- [x] Mock + real MCP modes

### E. Action Executor (`src/personal_ai_employee/skills/gold/brain_execute_odoo_with_mcp_skill.py`)
- [x] Approval MANDATORY — reads from `Approved/` folder
- [x] Dry-run DEFAULT — `--execute` required for real actions
- [x] Supports: create_invoice, post_invoice, register_payment, create_customer, create_credit_note
- [x] Plan lifecycle: `Approved/` → `Plans/completed/` or `Plans/failed/`
- [x] Full audit logging

### F. Mock Fixtures
- [x] `templates/mock_odoo_invoices.json` — 5 sample invoices (various statuses)
- [x] `templates/mock_odoo_customers.json` — 5 sample customers

### G. Frontend Integration
- [x] `apps/web/src/lib/fs-reader.ts` — Odoo watcher in readWatcherStatuses
- [x] `apps/web/src/app/app/page.tsx` — Odoo icon in watcher status cards
- [x] `apps/web/src/app/api/integrations/status/route.ts` — Odoo credentials check
- [x] `apps/web/src/components/command-center/action-wizard.tsx` — Odoo channel
- [x] `apps/web/src/app/app/command-center/[channel]/page.tsx` — Odoo workspace
- [x] `apps/web/src/app/api/odoo/query/route.ts` — frontend query API

### H. Executor via Web Control Plane
- [x] `scripts/web_execute_plan.py` — Odoo executor handlers registered

### I. PM2 Service
- [x] `ecosystem.config.js` — `odoo-watcher` process added
- [x] `/home/tayyab/pm2_odoo_watcher.sh` — PM2 wrapper (space-safe NTFS path)

### J. Tests
- [x] `tests/test_odoo_mock_mode.py` — mock mode smoke tests
- [ ] Integration tests with real Odoo (optional, requires running instance)

---

## Relevant Architecture Sections from output.txt

### Finance Watcher (line 266–267)
> "Finance Watcher: Downloads local CSVs or calls banking APIs to log new transactions in /Accounting/Current_Month.md."

**Implementation**: OdooWatcher reads overdue invoices from Odoo (or mock fixtures) and logs to `Business/Accounting/`.

### Business Handover / CEO Briefing (lines 592–681)
Triggers: Every Sunday night
Process:
1. Read `Business_Goals.md`, `Tasks/Done/`, `Bank_Transactions.md`
2. Write `Briefings/YYYY-MM-DD_Monday_Briefing.md` with:
   - Revenue this week / MTD
   - Completed tasks
   - Bottlenecks
   - Proactive suggestions (cost optimization, upcoming deadlines)

**Status**: 🔲 Pending (G6 — Weekly Business and Accounting Audit)

### Human-in-the-Loop (HITL) Pattern (lines 496–518)
Payment approval pattern:
1. Claude writes `APPROVAL_REQUIRED_Payment_Client_A.md` to `/Pending_Approval/`
2. User moves file to `/Approved/`
3. Orchestrator detects, triggers MCP action
4. Logs to `system_log.md`

**Implementation**: `brain_execute_odoo_with_mcp_skill.py` implements this pattern.

### Error Recovery (lines 780–843)
Categories: Transient, Authentication, Logic, Data, System
Recovery: Exponential backoff, alert human, quarantine + alert, watchdog + auto-restart

**Implementation**: All Odoo skills create remediation tasks in `Needs_Action/` on failure.

---

## File Map

```
src/personal_ai_employee/
  core/
    odoo_api_helper.py              ← JSON-RPC client (PART 2)
  skills/gold/
    odoo_watcher_skill.py           ← Perception (PART 3)
    brain_odoo_query_with_mcp_skill.py ← Query (PART 4)
    brain_execute_odoo_with_mcp_skill.py ← Action (PART 5)

scripts/
  odoo_watcher_skill.py            ← Wrapper for PM2
  brain_odoo_query_with_mcp_skill.py
  brain_execute_odoo_with_mcp_skill.py
  web_execute_plan.py              ← Added Odoo handlers

templates/
  mock_odoo_invoices.json          ← Mock data (PART 6)
  mock_odoo_customers.json         ← Mock data (PART 6)

.secrets/
  odoo_credentials.json            ← Credentials template (PART 1)

Docs/
  mcp_odoo_setup.md               ← Setup guide (PART 1)
  hackathon_odoo_requirements_checklist.md ← This file (PART 0)

apps/web/src/
  app/api/odoo/query/route.ts      ← Query API (PART 7)
  app/api/integrations/status/route.ts ← + Odoo status
  app/app/command-center/[channel]/page.tsx ← + Odoo workspace
  components/command-center/action-wizard.tsx ← + Odoo channel
  lib/fs-reader.ts                 ← + Odoo watcher

Business/
  Accounting/                      ← Intake wrappers land here

Logs/
  odoo_watcher.log
  odoo_watcher_checkpoint.json

tests/
  test_odoo_mock_mode.py           ← Smoke tests (PART 9)

ecosystem.config.js                ← odoo-watcher PM2 entry (PART 8)
/home/tayyab/pm2_odoo_watcher.sh  ← PM2 wrapper (PART 8)
```

---

*Generated by PART 0 of Odoo integration plan. Updated as parts complete.*
