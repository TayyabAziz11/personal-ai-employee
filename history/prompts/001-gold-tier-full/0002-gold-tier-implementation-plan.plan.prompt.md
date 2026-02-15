---
id: 0002
title: Gold Tier Implementation Plan
stage: plan
date: 2026-02-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-gold-tier-full
branch: 001-gold-tier-full
user: Personal AI Employee
command: /sp.plan
labels: ["gold-tier", "implementation-plan", "milestones", "multi-channel", "odoo", "ralph-loop", "ceo-briefing"]
links:
  spec: specs/001-gold-tier-full/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-gold-tier-full/plan.md
  - history/prompts/001-gold-tier-full/0002-gold-tier-implementation-plan.plan.prompt.md
tests:
  - N/A (planning phase, no tests yet)
---

## Prompt

/sp.plan

GOAL
Create a structured, milestone-based implementation plan for Gold Tier
based on:
specs/001-gold-tier-full/spec.md

IMPORTANT:
- Do NOT split Phase 1 and Phase 2.
- Implement as structured milestones G-M1 through G-M8.
- Follow strict dependency order.
- Avoid parallel chaos.
- Include time estimates.
- Include acceptance criteria per milestone.
- Include test procedures per milestone.
- Include rollback notes per milestone.
- Include commit discipline plan.
- Include branch strategy (gold-tier branch, merge to main later).

MILESTONE STRUCTURE REQUIRED

G-M1: Vault + Domain Expansion
G-M2: MCP Registry + Reliability Core
G-M3: Social Watchers (WhatsApp, LinkedIn, Twitter)
G-M4: Social MCP Execution Layer
G-M5: Odoo MCP Integration (Query → Action)
G-M6: Weekly CEO Briefing + Accounting Audit
G-M7: Ralph Loop Autonomous Orchestrator
G-M8: End-to-End Testing + Demo Documentation

Each milestone must contain:
- Objective
- Tasks (atomic)
- Files to create/modify
- Agent skills involved
- Approval requirements
- Test steps
- Failure simulations
- Definition of Done
- Git commit naming convention

OUTPUT
Create:
Plans/PLAN_gold_tier_implementation.md

Then print:
- Total estimated hours
- Critical path
- First milestone to implement
- Confirmation ready for /sp.task

STOP.

## Response snapshot

**Implementation Plan Created Successfully**

Generated comprehensive 8-milestone implementation plan for Gold Tier:

**Plan Location**: `specs/001-gold-tier-full/plan.md`

**Milestone Breakdown**:

1. **G-M1: Vault + Domain Expansion** (2-3h)
   - Create cross-domain vault structure (Social/, Business/, MCP/)
   - Define YAML frontmatter schemas for intake wrappers
   - Create templates for social intake wrapper + CEO briefing
   - 9 files to create, 2 files to modify

2. **G-M2: MCP Registry + Reliability Core** (4-5h)
   - Implement mcp_helpers.py (PII redaction, rate limiting, disk space check)
   - Implement brain_mcp_registry_refresh skill
   - Implement brain_handle_mcp_failure skill
   - 5 files to create, 1 file to modify

3. **G-M3: Social Watchers (WhatsApp, LinkedIn, Twitter)** (8-10h)
   - Implement 3 social watchers following BaseWatcher pattern
   - Mock mode + fixture-based testing
   - Checkpoint-based duplicate prevention
   - 9 files to create, 1 file to modify

4. **G-M4: Social MCP Execution Layer** (6-8h)
   - Implement brain_execute_social_with_mcp skill
   - Extend brain_create_plan for social action detection
   - Create MCP tool contracts (WhatsApp, LinkedIn, Twitter)
   - Create setup docs + credential templates
   - 9 files to create, 2 files to modify

5. **G-M5: Odoo MCP Integration (Query → Action)** (6-8h)
   - Implement odoo_watcher skill (optional)
   - Implement brain_execute_odoo_with_mcp skill
   - Extend brain_create_plan for Odoo action detection
   - Create Odoo MCP tool contract + setup docs
   - 7 files to create, 2 files to modify

6. **G-M6: Weekly CEO Briefing + Accounting Audit** (5-6h)
   - Implement brain_social_generate_summary skill
   - Implement brain_generate_weekly_ceo_briefing skill
   - Create sample Business Goal
   - Create scheduled tasks (daily social summary, weekly CEO briefing)
   - 6 files to create, 1 file to modify

7. **G-M7: Ralph Loop Autonomous Orchestrator** (6-8h)
   - Implement brain_ralph_loop_orchestrator skill
   - Bounded iterations (max 10), max plans per iteration (5)
   - Approval gates enforced, remediation tasks on failure
   - 4 files to create, 1 file to modify

8. **G-M8: End-to-End Testing + Demo Documentation** (6-8h)
   - Validate all 18 acceptance criteria
   - Create demo script (10 min)
   - Create completion checklist, architecture docs, lessons learned
   - Import + verify all 7 scheduled tasks
   - Audit git history (no secrets)
   - 5 files to create, 2 files to modify

**Key Features**:
- Strict dependency order (no parallelization to avoid chaos)
- Each milestone includes: Objective, Tasks, Files, Skills, Approvals, Tests, Failure Simulations, Definition of Done, Git Commit naming
- Comprehensive risk register (8 identified risks + mitigations)
- Git strategy: One commit per milestone, feature branch → main PR after completion
- Constitution check: All architectural principles verified (no violations)

## Outcome

- ✅ Impact: Complete implementation plan ready for task breakdown and execution. 8 milestones with 43-56 hour total estimate (realistic: 50h). Covers all Gold Tier requirements: multi-channel social (WhatsApp/LinkedIn/Twitter), Odoo accounting, CEO briefing, Ralph loop autonomy, graceful degradation. Strict dependency order prevents implementation chaos.

- 🧪 Tests: Each milestone includes detailed test procedures + failure simulations. G-M8 validates all 18 acceptance criteria from spec. No tests run yet (planning phase).

- 📁 Files:
  - specs/001-gold-tier-full/plan.md (created, 1045 lines, comprehensive 8-milestone plan)
  - history/prompts/001-gold-tier-full/0002-gold-tier-implementation-plan.plan.prompt.md (this file)

- 🔁 Next prompts: `/sp.tasks` to generate detailed task breakdown for G-M1 (first milestone)

- 🧠 Reflection: Plan successfully balances detail with clarity. Each milestone is atomic and independently deliverable. Strict dependency order (G-M1 → G-M2 → G-M3 → G-M4 → G-M5 → G-M6 → G-M7 → G-M8) prevents parallelization chaos while ensuring logical progression. Risk register identifies 8 key risks with concrete mitigations. Git commit discipline (one commit per milestone with detailed body template) ensures clean history. Critical path analysis identifies longest dependency chain (37-48h): G-M1 → G-M2 → G-M3 → G-M4 → G-M6 → G-M8. Phase 0 research skipped (all tech choices resolved from Silver Tier). Ready for implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None. Plan creation successful, all milestones structured correctly.

- Graders run and results (PASS/FAIL): N/A (planning phase, no code to grade)

- Prompt variant (if applicable): N/A (standard /sp.plan workflow)

- Next experiment (smallest change to try): Consider adding performance benchmarks per milestone (e.g., "G-M3 watcher intake creation must complete in <5 min"). Consider adding rollback verification steps beyond "git revert".
