---
id: 0003
title: Gold Tier Tasks Generation
stage: tasks
date: 2026-02-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-gold-tier-full
branch: 001-gold-tier-full
user: Personal AI Employee
command: /sp.tasks
labels: ["gold-tier", "tasks", "task-breakdown", "milestones", "implementation", "G-M1", "G-M2", "G-M3", "G-M4", "G-M5", "G-M6", "G-M7", "G-M8"]
links:
  spec: specs/001-gold-tier-full/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - Tasks/GOLD_TIER_TASKS.md
  - history/prompts/001-gold-tier-full/0003-gold-tier-tasks-generation.tasks.prompt.md
tests:
  - N/A (tasks planning phase, no tests yet)
---

## Prompt

/sp.tasks

GOAL
Generate the complete task breakdown for Gold Tier
covering G-M1 through G-M8
based on:
specs/001-gold-tier-full/spec.md
specs/001-gold-tier-full/plan.md

IMPORTANT
- Generate tasks for ALL 8 milestones.
- Organize tasks grouped by milestone:
  G-M1
  G-M2
  G-M3
  G-M4
  G-M5
  G-M6
  G-M7
  G-M8
- Keep tasks atomic and testable.
- Avoid implementation code.
- Do NOT exceed 120 total tasks.
- Avoid redundancy.
- Preserve strict dependency order.
- Ensure no task violates architecture (Perception → Plan → Approval → Action → Logging).

EACH TASK MUST INCLUDE
- Task ID (G-M1-T01 format)
- Short description
- Files to create/modify
- Agent skills involved
- Acceptance criteria
- Test steps
- Failure simulation (if applicable)
- Suggested commit message
- Rollback note

ADDITIONAL REQUIREMENTS
- Clearly mark tasks that:
  - require external API credentials
  - require MCP server setup
  - require scheduling
- Mark tasks that can run in mock mode first.

OUTPUT
Create:
Tasks/GOLD_TIER_TASKS.md

Then print:
- Total tasks count
- Task count per milestone
- Critical path summary
- First milestone to implement
STOP.

## Response snapshot

**Task Breakdown Generated Successfully**

Created comprehensive task breakdown for all 8 Gold Tier milestones:

**File Location**: `Tasks/GOLD_TIER_TASKS.md`

**Task Organization**:

- **G-M1: Vault + Domain Expansion** (8 tasks, 2-3h)
  - Create Social/, Business/, MCP/ directory structures
  - Create intake wrapper and CEO briefing templates
  - Update .gitignore and Dashboard.md

- **G-M2: MCP Registry + Reliability Core** (8 tasks, 4-5h)
  - Implement mcp_helpers.py (PII redaction, rate limiting, disk space check)
  - Implement brain_mcp_registry_refresh and brain_handle_mcp_failure skills
  - Create MCP snapshot documentation and scheduled task

- **G-M3: Social Watchers** (9 tasks, 8-10h)
  - Implement WhatsApp, LinkedIn, Twitter watchers with mock mode
  - Create mock fixtures for all 3 channels
  - Create scheduled tasks and Dashboard integration
  - Integration test all watchers

- **G-M4: Social MCP Execution Layer** (9 tasks, 6-8h)
  - Extend brain_create_plan for social action detection
  - Implement brain_execute_social_with_mcp with dry-run default
  - Create MCP contracts (WhatsApp, LinkedIn, Twitter)
  - Create setup docs and credential templates
  - Dashboard Last External Action section

- **G-M5: Odoo MCP Integration** (9 tasks, 6-8h)
  - Implement odoo_watcher (optional)
  - Extend brain_create_plan for Odoo actions
  - Implement brain_execute_odoo_with_mcp
  - Create Odoo MCP contract and setup docs
  - Dashboard Accounting Status section

- **G-M6: Weekly CEO Briefing** (6 tasks, 5-6h)
  - Implement brain_social_generate_summary
  - Implement brain_generate_weekly_ceo_briefing (8 required sections)
  - Create sample Business Goal
  - Create scheduled tasks (daily summary, weekly briefing)
  - Dashboard briefing links

- **G-M7: Ralph Loop Orchestrator** (6 tasks, 6-8h)
  - Implement brain_ralph_loop_orchestrator with bounded iterations
  - State persistence (optional)
  - Test scenarios and documentation
  - Dashboard Ralph Loop Status section
  - Integration test workflow

- **G-M8: End-to-End Testing + Demo Docs** (9 tasks, 6-8h)
  - Run all 18 acceptance criteria tests
  - Create demo script (10 min)
  - Create completion checklist and architecture docs
  - Document lessons learned
  - Import and verify all 7 scheduled tasks
  - Audit git history (no secrets)
  - Update README.md

**Key Features**:

- **73 total tasks** (well under 120 limit)
- Strict dependency order: G-M1 → G-M2 → G-M3 → G-M4 → G-M5 → G-M6 → G-M7 → G-M8
- Each task includes all required fields: ID, description, files, skills, acceptance criteria, test steps, failure simulation, commit message, rollback note
- Clear marking system:
  - 🔑 = Requires external API credentials
  - 🔧 = Requires MCP server setup
  - 📅 = Requires scheduling configuration
  - 🎭 = Can run in mock mode first
- Critical path: G-M1 → G-M2 → G-M3 → G-M4 → G-M6 → G-M8 (37-48h)
- Total estimated duration: 43-56 hours (realistic: 50h)

## Outcome

- ✅ Impact: Complete task breakdown ready for implementation. 73 atomic, testable tasks organized across 8 milestones. Covers all Gold Tier requirements: multi-channel social (WhatsApp/LinkedIn/Twitter), Odoo accounting, CEO briefing, Ralph loop autonomy, graceful degradation, reliability infrastructure. Each task includes full specifications (acceptance criteria, test steps, failure simulations, rollback notes). Strict dependency order prevents implementation chaos. Implementation can begin immediately with G-M1-T01.

- 🧪 Tests: Each task includes detailed test steps and failure simulations where applicable. G-M8 validates all 18 acceptance criteria from spec. No tests run yet (tasks planning phase).

- 📁 Files:
  - Tasks/GOLD_TIER_TASKS.md (created, comprehensive 73-task breakdown organized by milestone)
  - history/prompts/001-gold-tier-full/0003-gold-tier-tasks-generation.tasks.prompt.md (this file)

- 🔁 Next prompts: `/sp.implement` to begin implementation starting with G-M1-T01, or manual task execution following the task file

- 🧠 Reflection: Task generation successfully balances granularity with manageability. 73 tasks across 8 milestones provides clear implementation path without overwhelming detail. Each task is atomic (single responsibility), testable (clear acceptance criteria), and includes failure recovery (rollback notes, failure simulations). Task marking system (🔑🔧📅🎭) helps implementers identify prerequisites and testing strategies. Strict dependency order (no parallelization per user request) prevents implementation chaos while ensuring logical progression. Critical path identified (37-48h) helps with planning. Total task count (73) well under 120 limit while maintaining comprehensive coverage. Each milestone has completion checklist and detailed commit message template for clean git history. Ready for implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None. Task generation successful, all milestones covered with atomic tasks.

- Graders run and results (PASS/FAIL): N/A (tasks planning phase, no code to grade)

- Prompt variant (if applicable): N/A (standard /sp.tasks workflow)

- Next experiment (smallest change to try): Consider adding time estimates per task (not just per milestone) for finer-grained planning. Consider adding explicit task dependencies within each milestone (e.g., "G-M3-T02 depends on G-M3-T01") beyond just sequential numbering.
