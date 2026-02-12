# Silver Tier Implementation Tasks

**Project:** Personal AI Employee - Silver Tier
**Plan Source:** Plans/PLAN_silver_tier_implementation.md
**Specification:** Specs/SPEC_silver_tier.md
**Constitution:** Specs/sp.constitution.md
**Created:** 2026-02-11
**Total Tasks:** 45
**Estimated Duration:** 20-30 hours

---

## Task Format Legend

- `- [ ]` = Task checkbox
- `[Task ID]` = Unique identifier (SIL-M#-T##)
- `[P]` = Parallelizable task (can run concurrently with other [P] tasks in same milestone)
- `[M#]` = Milestone label
- File paths provided for all tasks
- Dependencies tracked across milestones

---

## Critical Path

**Blocking Sequence:** M1 → M2 → M3 → M6 → M9 → M10

**Parallel Opportunities:**
- M4 (Plan workflow) can start after M2
- M5 (Approval pipeline) can start after M4
- M7 (Scheduling) can start after M3
- M8 (Summary) can start after M2

---

## Special Requirements Tracker

### Tasks Requiring OAuth2 Setup
- SIL-M3-T01: Gmail API OAuth2 configuration
- SIL-M3-T03: First-time OAuth authorization flow

### Tasks Requiring MCP Configuration
- SIL-M6-T01: Gmail MCP server setup (Node.js or Python)
- SIL-M6-T02: MCP server configuration and testing
- SIL-M6-T03: brain_execute_with_mcp skill implementation

### Tasks Requiring Windows Task Scheduler
- SIL-M7-T01: Filesystem watcher scheduled task (15min interval)
- SIL-M7-T02: Gmail watcher scheduled task (30min interval)
- SIL-M7-T03: Daily summary scheduled task (6 PM daily)

---

## Milestone 1: Vault Structure Setup (M1)

**Objective:** Create new folders for Silver Tier approval workflow and scheduling
**Duration:** 30 minutes
**Dependencies:** None
**Priority:** P0 (blocking)

### Tasks

- [ ] SIL-M1-T01 [M1] Create approval workflow folders (Pending_Approval/, Approved/, Rejected/) with README files
- [ ] SIL-M1-T02 [M1] Create Scheduled/ folder with README for task definitions
- [ ] SIL-M1-T03 [M1] Create three new log files (gmail_watcher.log, mcp_actions.log, scheduler.log) in Logs/

**Task Details:**

#### SIL-M1-T01: Create Approval Workflow Folders
**Description:** Create three folders for human-in-the-loop approval with documentation
**Files to Create:**
- `Pending_Approval/` (folder)
- `Approved/` (folder)
- `Rejected/` (folder)
- `Pending_Approval/README.md`
- `Approved/README.md`
- `Rejected/README.md`

**Skills Involved:** None (infrastructure setup)

**PowerShell Commands:**
```powershell
New-Item -ItemType Directory -Path "Pending_Approval", "Approved", "Rejected" -Force

# Create README files with workflow documentation
@"
# Pending Approval
Plans and actions awaiting user approval are placed here.
**Workflow:** 1. Agent creates plan → moves to Pending_Approval/ | 2. User reviews plan | 3. User moves file to Approved/ or Rejected/
"@ | Out-File -FilePath "Pending_Approval/README.md" -Encoding UTF8

@"
# Approved
Approved plans ready for execution.
**Workflow:** 1. User moves plan from Pending_Approval/ | 2. Agent executes plan (dry-run first) | 3. Plan moves to Plans/completed/
"@ | Out-File -FilePath "Approved/README.md" -Encoding UTF8

@"
# Rejected
Rejected plans archived for audit.
**Workflow:** 1. User moves plan to Rejected/ | 2. Optionally add rejection reason | 3. Agent logs rejection
"@ | Out-File -FilePath "Rejected/README.md" -Encoding UTF8
```

**Acceptance Criteria:**
- [ ] All three folders exist in vault root
- [ ] README files are present and readable
- [ ] Folders are visible in both VS Code and Obsidian

**Test Procedure:**
```powershell
Test-Path "Pending_Approval", "Approved", "Rejected"  # All return True
Get-Content "Pending_Approval/README.md"  # Displays content
```

**Git Commit:** `feat(vault): add approval workflow folders for Silver Tier HITL`

**Rollback:** `Remove-Item -Path "Pending_Approval", "Approved", "Rejected" -Recurse -Force`

---

#### SIL-M1-T02: Create Scheduled Tasks Folder
**Description:** Add folder for scheduled task definitions with documentation
**Files to Create:**
- `Scheduled/` (folder)
- `Scheduled/README.md`

**Skills Involved:** None (infrastructure setup)

**PowerShell Commands:**
```powershell
New-Item -ItemType Directory -Path "Scheduled" -Force

@"
# Scheduled Tasks
This folder contains scheduled task definitions for Windows Task Scheduler.
**Silver Tier Scheduled Tasks:** 1. Filesystem Watcher (every 15 minutes) | 2. Gmail Watcher (every 30 minutes) | 3. Daily Summary Generation (6 PM daily)
"@ | Out-File -FilePath "Scheduled/README.md" -Encoding UTF8
```

**Acceptance Criteria:**
- [ ] Scheduled/ folder exists
- [ ] README is present with correct content

**Test Procedure:**
```powershell
Test-Path "Scheduled"  # Returns True
Get-Content "Scheduled/README.md"  # Displays task list
```

**Git Commit:** `feat(vault): add Scheduled/ folder for task definitions`

**Rollback:** `Remove-Item -Path "Scheduled" -Recurse -Force`

---

#### SIL-M1-T03: Create Log Files
**Description:** Add three new log files for Silver Tier components with headers
**Files to Create:**
- `Logs/gmail_watcher.log`
- `Logs/mcp_actions.log`
- `Logs/scheduler.log`

**Skills Involved:** None (infrastructure setup)

**PowerShell Commands:**
```powershell
# Create log files with headers
@"
# Gmail Watcher Log
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
# Purpose: Logs all Gmail watcher operations

"@ | Out-File -FilePath "Logs/gmail_watcher.log" -Encoding UTF8

@"
# MCP Actions Log
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
# Purpose: Logs all MCP tool invocations (dry-run and execute modes)
# Format: [timestamp] Tool | Operation | Parameters | Mode | Result | Duration

"@ | Out-File -FilePath "Logs/mcp_actions.log" -Encoding UTF8

@"
# Scheduler Log
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
# Purpose: Logs all scheduled task executions

"@ | Out-File -FilePath "Logs/scheduler.log" -Encoding UTF8
```

**Acceptance Criteria:**
- [ ] All three log files exist in Logs/
- [ ] Each file has appropriate header
- [ ] Files are writable

**Test Procedure:**
```powershell
Test-Path "Logs/gmail_watcher.log", "Logs/mcp_actions.log", "Logs/scheduler.log"  # All return True
Get-Content "Logs/mcp_actions.log" | Select-Object -First 5  # Shows header
```

**Git Commit:** `feat(logs): add Silver Tier log files for Gmail, MCP, and scheduler`

**Rollback:** `Remove-Item -Path "Logs/gmail_watcher.log", "Logs/mcp_actions.log", "Logs/scheduler.log" -Force`

---

## Milestone 2: Documentation Updates (M2)

**Objective:** Update Company_Handbook.md and Dashboard.md with Silver Tier content
**Duration:** 2 hours
**Dependencies:** M1
**Priority:** P0 (blocking)

### Tasks

- [ ] SIL-M2-T01 [M2] Update Company_Handbook.md with 9 Silver skills (Skills 16-24) in new section 2.2
- [ ] SIL-M2-T02 [M2] Update Dashboard.md with 5 new Silver sections using Obsidian callouts

**Task Details:**

#### SIL-M2-T01: Update Company Handbook with Silver Skills
**Description:** Add Section 2.2 with all 9 Silver agent skills (16-24) to Company_Handbook.md
**Files to Modify:**
- `Company_Handbook.md` (add Section 2.2 after Skill 15)

**Skills Involved:** None (documentation task)

**Skills to Document:**
1. **Skill 16: brain_create_plan** - Generate plan files for external actions
2. **Skill 17: brain_request_approval** - Move plans to Pending_Approval/ with notification
3. **Skill 18: brain_execute_with_mcp** - Execute approved plans via MCP (dry-run first)
4. **Skill 19: brain_log_action** - Append MCP actions to logs
5. **Skill 20: brain_handle_mcp_failure** - Handle MCP failures with escalation
6. **Skill 21: brain_generate_summary** - Generate daily/weekly summaries
7. **Skill 22: brain_monitor_approvals** - Check Approved/ folder for ready plans
8. **Skill 23: brain_archive_plan** - Move executed/rejected plans to archives
9. **Skill 24: gmail_watcher** - Fetch emails via OAuth2, create intake wrappers

**Content Structure for Each Skill:**
```markdown
### Skill ##: [skill_name]
**Purpose:** [one-line purpose]
**Inputs:** [list of inputs]
**Steps:** [numbered execution steps]
**Output Files:** [list of files created/modified]
**Approval Gate:** YES/NO [explanation]
```

**Acceptance Criteria:**
- [ ] Section 2.2 "SILVER TIER AGENT SKILLS" added after Section 2.1
- [ ] All 9 skills documented with full structure
- [ ] Plan template included in Section 2.2.1 (referenced by Skill 16)
- [ ] Approval workflow documented in Section 2.2.2
- [ ] MCP logging format documented in Section 2.2.3

**Test Procedure:**
```powershell
# Verify section exists
Select-String -Path "Company_Handbook.md" -Pattern "## 2.2 SILVER TIER AGENT SKILLS"

# Count skills documented (should be 9)
(Select-String -Path "Company_Handbook.md" -Pattern "^### Skill (1[6-9]|2[0-4]):").Count  # Returns 9
```

**Git Commit:** `docs(handbook): add 9 Silver Tier agent skills (Skills 16-24)`

**Rollback:** Remove Section 2.2 from Company_Handbook.md

---

#### SIL-M2-T02: Update Dashboard with Silver Sections
**Description:** Add 5 new Silver sections to Dashboard.md using Obsidian callout syntax
**Files to Modify:**
- `Dashboard.md` (add 5 new sections)

**Skills Involved:** None (documentation task)

**Sections to Add:**
1. **Pending Approvals** ([!warning] callout) - Count and list of items in Pending_Approval/
2. **Plans in Progress** ([!info] callout) - Count and list of plans with status
3. **Last External Action** ([!done] callout) - Timestamp, tool used, result of last MCP call
4. **Watcher Status (Silver)** ([!success] callout) - Gmail watcher last run, emails processed
5. **Silver Health Check** ([!check] callout) - 6-point verification checklist

**Callout Syntax:**
```markdown
> [!warning] Pending Approvals
> **Count:** X items waiting
> - [Plan name 1](Pending_Approval/plan_file.md)
> - [Plan name 2](Pending_Approval/plan_file2.md)
```

**Acceptance Criteria:**
- [ ] All 5 new sections added with correct callout types
- [ ] Sections use Obsidian callout syntax ([!type])
- [ ] Sections include placeholders for dynamic data
- [ ] Dashboard renders correctly in Obsidian Reading Mode

**Test Procedure:**
```powershell
# Verify all callouts present
Select-String -Path "Dashboard.md" -Pattern "\[!(warning|info|done|success|check)\]" | Measure-Object  # Count >= 5
```

**Git Commit:** `docs(dashboard): add 5 Silver Tier sections with Obsidian callouts`

**Rollback:** Remove the 5 Silver sections from Dashboard.md

---

## Milestone 3: Gmail Watcher Implementation (M3)

**Objective:** Implement Gmail Watcher with OAuth2 authentication, intake wrapper creation, and logging
**Duration:** 4-6 hours
**Dependencies:** M1 (folders), M2 (documentation)
**Priority:** P0 (blocking for MCP email)

### Tasks

- [ ] SIL-M3-T01 [M3] Set up Gmail API OAuth2 credentials and create Docs/gmail_oauth_setup.md guide ⚠️ **Requires OAuth2**
- [ ] SIL-M3-T02 [M3] Implement gmail_watcher.py with OAuth2, email fetching, and intake wrapper creation
- [ ] SIL-M3-T03 [M3] Test Gmail watcher OAuth flow and verify intake wrapper creation ⚠️ **Requires OAuth2**
- [ ] SIL-M3-T04 [P] [M3] Add --dry-run, --once, --verbose flags to gmail_watcher.py CLI
- [ ] SIL-M3-T05 [P] [M3] Create requirements.txt with Gmail API dependencies

**Task Details:**

#### SIL-M3-T01: Gmail API OAuth2 Setup
**Description:** Set up Gmail API credentials and create comprehensive OAuth2 setup guide
**Files to Create:**
- `Docs/gmail_oauth_setup.md` (OAuth2 setup instructions)
- `.env` (Gmail configuration, must be in .gitignore)
- `credentials.json` (downloaded from Google Cloud Console, must be in .gitignore)

**Skills Involved:** None (manual OAuth2 configuration)

**Manual Steps Required:**
1. Create Google Cloud Project at https://console.cloud.google.com/
2. Enable Gmail API in API Library
3. Create OAuth2 credentials (Desktop app type)
4. Download credentials.json to vault root
5. Configure OAuth consent screen (External, add scopes, add test users)

**PowerShell Commands:**
```powershell
# Create .env file
@"
# Gmail Watcher Configuration
GMAIL_CREDENTIALS_PATH=credentials.json
GMAIL_TOKEN_PATH=token.json
GMAIL_QUERY=is:unread is:important
GMAIL_LABEL=AI-Employee
GMAIL_LIMIT=10
GMAIL_MARK_AS_READ=false
GMAIL_APPLY_LABEL=true
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Ensure secrets are gitignored
if (-not (Select-String -Path ".gitignore" -Pattern "^\.env$" -Quiet)) {
    Add-Content -Path ".gitignore" -Value "`n.env`ncredentials.json`ntoken.json"
}
```

**Acceptance Criteria:**
- [ ] Google Cloud Project created with Gmail API enabled
- [ ] credentials.json downloaded and placed in vault root
- [ ] .env file created with configuration
- [ ] Docs/gmail_oauth_setup.md created with complete guide
- [ ] Secrets are gitignored

**Test Procedure:**
```powershell
Test-Path ".env", "credentials.json"  # Both return True
Select-String -Path ".gitignore" -Pattern "(credentials\.json|token\.json|\.env)"  # All present
```

**Git Commit:** `feat(gmail): add OAuth2 setup guide and configuration`

**Rollback:** Remove .env, credentials.json, Docs/gmail_oauth_setup.md

---

#### SIL-M3-T02: Implement Gmail Watcher Script
**Description:** Create gmail_watcher.py with OAuth2 authentication, email fetching, and intake wrapper generation
**Files to Create:**
- `gmail_watcher.py` (main script)

**Skills Involved:**
- Skill 24: gmail_watcher (this task implements it)

**Implementation Requirements:**
- OAuth2 authentication with automatic token refresh
- Fetch emails matching GMAIL_QUERY from .env
- Create intake wrappers in Needs_Action/ folder
- Download attachments if present
- Track processed email IDs to avoid duplicates
- Log all operations to Logs/gmail_watcher.log
- CLI flags: --once, --dry-run, --verbose, --quiet, --no-banner

**Dependencies to Install:**
```python
google-auth>=2.16.0
google-auth-oauthlib>=1.0.0
google-auth-httplib2>=0.1.0
google-api-python-client>=2.80.0
python-dotenv>=1.0.0
```

**Intake Wrapper Template:**
```markdown
---
Source: Gmail
Email ID: {message_id}
From: {sender}
Subject: {subject}
Date: {date}
Priority: {P2 or P3 based on is:important}
Created: {YYYY-MM-DD HH:MM:SS UTC}
---

# Email from {sender_name}

**Subject:** {subject}

**From:** {sender_email}
**Date:** {email_date}

## Message Body

{email_body_text}

{if attachments:}
## Attachments
- {attachment_1_filename} (saved to Needs_Action/attachments/{email_id}/{filename})
{end if}

---

**AI Employee Note:** Process this email and take appropriate action if needed.
```

**Acceptance Criteria:**
- [ ] gmail_watcher.py created with OAuth2 flow
- [ ] Script fetches emails using Gmail API
- [ ] Intake wrappers created in Needs_Action/ with correct format
- [ ] Attachments downloaded to Needs_Action/attachments/{email_id}/
- [ ] Processed email IDs tracked (avoid duplicates)
- [ ] All operations logged to Logs/gmail_watcher.log

**Test Procedure:**
```powershell
# Dry-run test (no actual actions)
python gmail_watcher.py --dry-run

# Should output: "Would process X emails" without creating files
```

**Git Commit:** `feat(gmail): implement Gmail watcher with OAuth2 and intake wrappers`

**Rollback:** Remove gmail_watcher.py

---

#### SIL-M3-T03: Test Gmail OAuth Flow
**Description:** Run first-time OAuth authorization and verify token generation
**Files Created:**
- `token.json` (auto-generated after OAuth consent, must be in .gitignore)

**Skills Involved:**
- Skill 24: gmail_watcher (testing)

**Manual Steps:**
1. Run: `python gmail_watcher.py --once`
2. Browser will open for OAuth consent
3. Authorize the application
4. token.json will be created automatically
5. Verify token.json is created and gitignored

**Acceptance Criteria:**
- [ ] OAuth consent flow completes successfully
- [ ] token.json created in vault root
- [ ] token.json is gitignored
- [ ] Script can authenticate using token.json
- [ ] Token auto-refreshes when expired

**Test Procedure:**
```powershell
# Run first authorization
python gmail_watcher.py --once

# Verify token created
Test-Path "token.json"  # Returns True

# Run again (should use existing token, no browser)
python gmail_watcher.py --once --verbose  # Should show "Using existing token"
```

**Git Commit:** `test(gmail): verify OAuth2 flow and token generation`

**Rollback:** Remove token.json

---

#### SIL-M3-T04: Add CLI Flags to Gmail Watcher
**Description:** Implement CLI argument parsing with flags for different execution modes
**Files to Modify:**
- `gmail_watcher.py` (add argparse)

**Skills Involved:**
- Skill 24: gmail_watcher (enhancement)

**Flags to Implement:**
- `--once` - Run once and exit (no loop mode)
- `--dry-run` - Preview what would happen without creating files
- `--verbose` - Detailed console output
- `--quiet` - Minimal console output
- `--no-banner` - Suppress banner/header
- `--no-color` - Disable ANSI colors (for Windows compatibility)

**Acceptance Criteria:**
- [ ] All flags implemented and functional
- [ ] Help text available with `python gmail_watcher.py --help`
- [ ] Flags can be combined (e.g., --once --dry-run --verbose)
- [ ] Default mode is loop mode (check every 30 minutes)

**Test Procedure:**
```powershell
python gmail_watcher.py --help  # Displays all flags
python gmail_watcher.py --dry-run --verbose  # Shows detailed preview
python gmail_watcher.py --once --quiet  # Runs once, minimal output
```

**Git Commit:** `feat(gmail): add CLI flags for execution modes`

**Rollback:** Revert argparse changes in gmail_watcher.py

---

#### SIL-M3-T05: Create Requirements File
**Description:** Create requirements.txt with all Gmail API dependencies
**Files to Create:**
- `requirements.txt` (or append if exists)

**Skills Involved:** None (dependency management)

**Content:**
```
google-auth>=2.16.0
google-auth-oauthlib>=1.0.0
google-auth-httplib2>=0.1.0
google-api-python-client>=2.80.0
python-dotenv>=1.0.0
```

**Acceptance Criteria:**
- [ ] requirements.txt created with all dependencies
- [ ] Version pinning includes minimum versions
- [ ] Dependencies can be installed with `pip install -r requirements.txt`

**Test Procedure:**
```powershell
pip install -r requirements.txt  # Should install all packages successfully
python -c "from google.oauth2.credentials import Credentials; print('OK')"  # Returns OK
```

**Git Commit:** `build(deps): add Gmail API dependencies to requirements.txt`

**Rollback:** Remove Gmail dependencies from requirements.txt

---

## Milestone 4: Plan-First Workflow (M4)

**Objective:** Implement brain_create_plan skill and plan file state machine
**Duration:** 3-4 hours
**Dependencies:** M2 (documentation with plan template)
**Priority:** P0 (blocking)

### Tasks

- [X] SIL-M4-T01 [M4] Create plan file template in Plans/PLAN_TEMPLATE.md based on spec
- [X] SIL-M4-T02 [M4] Implement brain_create_plan skill as brain_create_plan.skill.md guide
- [X] SIL-M4-T03 [M4] Test plan creation workflow with sample task from Needs_Action/

**Task Details:**

#### SIL-M4-T01: Create Plan Template
**Description:** Create plan file template with all mandatory sections
**Files to Create:**
- `Plans/PLAN_TEMPLATE.md`

**Skills Involved:** None (template creation)

**Template Sections:**
1. Plan ID and Metadata
2. Objective (one-line goal)
3. Success Criteria (measurable outcomes)
4. Files to Touch (list all files to modify/create)
5. MCP Tools Required (tool.operation with parameters)
6. Approval Gates (where user approval needed)
7. Risk Level (LOW/MEDIUM/HIGH with justification)
8. Rollback Strategy (how to undo if fails)
9. Execution Steps (numbered, detailed)
10. Status (Draft/Pending_Approval/Approved/Rejected/Executed/Failed)
11. Dry-Run Results (populated during execution)
12. Execution Log (populated during execution)

**Acceptance Criteria:**
- [ ] PLAN_TEMPLATE.md created with all 12 sections
- [ ] Template includes clear placeholders
- [ ] Template matches specification requirements

**Test Procedure:**
```powershell
Test-Path "Plans/PLAN_TEMPLATE.md"  # Returns True
(Get-Content "Plans/PLAN_TEMPLATE.md" | Select-String -Pattern "^##").Count  # Returns 12
```

**Git Commit:** `feat(planning): add plan file template with 12 mandatory sections`

**Rollback:** Remove Plans/PLAN_TEMPLATE.md

---

#### SIL-M4-T02: Implement brain_create_plan Skill
**Description:** Create skill guide for brain_create_plan (Skill 16)
**Files to Create:**
- `Skills/brain_create_plan.skill.md` (skill implementation guide)

**Skills Involved:**
- Skill 16: brain_create_plan (this task documents implementation)

**Implementation Requirements:**
1. Read task file from Needs_Action/
2. Determine if plan required (criteria: external action, MCP call, >3 steps, risk level Medium+)
3. Generate unique plan ID: PLAN_{YYYY-MM-DD}_{slug}
4. Copy PLAN_TEMPLATE.md to Plans/PLAN_{id}.md
5. Fill all mandatory sections from task context
6. Set Status: Draft
7. Link plan from task file
8. Log to system_log.md

**Acceptance Criteria:**
- [ ] brain_create_plan.skill.md created with full workflow
- [ ] Plan creation logic documented
- [ ] Plan ID generation format specified
- [ ] Template filling process documented

**Test Procedure:**
```powershell
Test-Path "Skills/brain_create_plan.skill.md"  # Returns True
```

**Git Commit:** `feat(planning): implement brain_create_plan skill guide`

**Rollback:** Remove Skills/brain_create_plan.skill.md

---

#### SIL-M4-T03: Test Plan Creation Workflow
**Description:** Verify plan creation with sample task
**Files Created:**
- Sample plan file in Plans/ for testing

**Skills Involved:**
- Skill 16: brain_create_plan (testing)

**Test Steps:**
1. Create sample task in Needs_Action/test_external_action.md
2. Run brain_create_plan workflow
3. Verify plan file created in Plans/ with correct format
4. Verify task file updated with plan reference
5. Verify system_log.md entry

**Acceptance Criteria:**
- [ ] Plan file created with all sections filled
- [ ] Plan ID follows naming convention
- [ ] Task file links to plan
- [ ] system_log.md has entry

**Test Procedure:**
```powershell
# Create test task
@"
# Test External Action
**Task:** Send test email
**Requires:** MCP email action
"@ | Out-File -FilePath "Needs_Action/test_external_action.md" -Encoding UTF8

# Run plan creation (manually trigger skill)
# Verify plan created
Test-Path "Plans/PLAN_*.md"  # Returns True
```

**Git Commit:** `test(planning): verify plan creation workflow`

**Rollback:** Remove test plan and test task files

---

## Milestone 5: Approval Pipeline (M5)

**Objective:** Implement brain_request_approval and brain_monitor_approvals skills
**Duration:** 2-3 hours
**Dependencies:** M4 (plan-first workflow)
**Priority:** P0 (blocking)

### Tasks

- [X] SIL-M5-T01 [M5] Implement brain_request_approval skill guide in Skills/
- [X] SIL-M5-T02 [M5] Implement brain_monitor_approvals skill guide in Skills/
- [X] SIL-M5-T03 [M5] Test approval workflow: Draft → Pending → Approved/Rejected

**Task Details:**

#### SIL-M5-T01: Implement brain_request_approval Skill
**Description:** Create skill guide for requesting user approval (Skill 17)
**Files to Create:**
- `Skills/brain_request_approval.skill.md`

**Skills Involved:**
- Skill 17: brain_request_approval (this task documents implementation)

**Implementation Requirements:**
1. Read plan file from Plans/
2. Verify plan completeness (all mandatory sections filled)
3. Update plan Status: Pending_Approval
4. Move plan file from Plans/ to Pending_Approval/
5. Display approval request to console (formatted with box drawing)
6. Update task file with approval status
7. Log to system_log.md

**Console Output Format:**
```
═══════════════════════════════════════════════════════════
  APPROVAL REQUIRED
═══════════════════════════════════════════════════════════
Plan: [title]
File: Pending_Approval/[filename]
Risk Level: [LOW/MEDIUM/HIGH]

Objective: [one-line goal]

MCP Actions Required:
- [tool.operation: parameters]

To approve: Move file to Approved/ folder
To reject: Move file to Rejected/ folder
───────────────────────────────────────────────────────────
```

**Acceptance Criteria:**
- [ ] brain_request_approval.skill.md created
- [ ] Approval request workflow documented
- [ ] Console output format specified
- [ ] File movement process documented

**Test Procedure:**
```powershell
Test-Path "Skills/brain_request_approval.skill.md"  # Returns True
```

**Git Commit:** `feat(approval): implement brain_request_approval skill guide`

**Rollback:** Remove Skills/brain_request_approval.skill.md

---

#### SIL-M5-T02: Implement brain_monitor_approvals Skill
**Description:** Create skill guide for monitoring Approved/ folder (Skill 22)
**Files to Create:**
- `Skills/brain_monitor_approvals.skill.md`

**Skills Involved:**
- Skill 22: brain_monitor_approvals (this task documents implementation)

**Implementation Requirements:**
1. Check Approved/ folder for plan files
2. For each plan in Approved/:
   - Verify plan Status is Approved
   - Call brain_execute_with_mcp (Skill 18)
   - If execution succeeds: move plan to Plans/completed/
   - If execution fails: call brain_handle_mcp_failure (Skill 20)
3. Log all checks to Logs/scheduler.log (if called by scheduler)

**Acceptance Criteria:**
- [ ] brain_monitor_approvals.skill.md created
- [ ] Monitoring loop documented
- [ ] Execution trigger logic documented
- [ ] Logging format specified

**Test Procedure:**
```powershell
Test-Path "Skills/brain_monitor_approvals.skill.md"  # Returns True
```

**Git Commit:** `feat(approval): implement brain_monitor_approvals skill guide`

**Rollback:** Remove Skills/brain_monitor_approvals.skill.md

---

#### SIL-M5-T03: Test Approval Workflow
**Description:** Verify complete approval workflow with sample plan
**Files Used:**
- Test plan from M4-T03

**Skills Involved:**
- Skill 17: brain_request_approval (testing)
- Skill 22: brain_monitor_approvals (testing)

**Test Steps:**
1. Use test plan from M4 (Status: Draft)
2. Run brain_request_approval workflow
3. Verify plan moved to Pending_Approval/
4. Verify console output shows approval request
5. Manually move plan to Approved/
6. Run brain_monitor_approvals workflow
7. Verify plan detected in Approved/

**Acceptance Criteria:**
- [ ] Plan moves from Plans/ to Pending_Approval/
- [ ] Approval request displays correctly
- [ ] Manual approval (file move) detected
- [ ] system_log.md entries created

**Test Procedure:**
```powershell
# Move test plan to simulate approval
Move-Item -Path "Pending_Approval/PLAN_*.md" -Destination "Approved/"

# Verify detection
Test-Path "Approved/PLAN_*.md"  # Returns True
```

**Git Commit:** `test(approval): verify approval workflow end-to-end`

**Rollback:** Move test plan back to Plans/

---

## Milestone 6: MCP Email Integration (M6)

**Objective:** Integrate Gmail MCP server and implement brain_execute_with_mcp skill
**Duration:** 4-5 hours
**Dependencies:** M3 (Gmail watcher), M5 (approval pipeline)
**Priority:** P0 (blocking)

### Tasks

- [ ] SIL-M6-T01 [M6] Set up Gmail MCP server (Node.js or Python implementation) ⚠️ **Requires MCP**
- [ ] SIL-M6-T02 [M6] Configure MCP server settings and test connection ⚠️ **Requires MCP**
- [ ] SIL-M6-T03 [M6] Implement brain_execute_with_mcp skill with dry-run workflow ⚠️ **Requires MCP**
- [ ] SIL-M6-T04 [P] [M6] Implement brain_log_action skill for MCP action logging
- [ ] SIL-M6-T05 [P] [M6] Implement brain_handle_mcp_failure skill for error handling
- [ ] SIL-M6-T06 [M6] Test MCP email send with dry-run → approval → execute flow ⚠️ **Requires MCP**

**Task Details:**

#### SIL-M6-T01: Set Up Gmail MCP Server
**Description:** Install and configure Gmail MCP server for email operations
**Files to Create:**
- MCP server configuration file
- `Docs/mcp_setup.md` (MCP setup guide)

**Skills Involved:** None (MCP infrastructure setup)

**Implementation Options:**
1. **Node.js Gmail MCP Server** (if available in MCP registry)
2. **Python Gmail MCP Server** (custom implementation using Gmail API)

**Setup Steps:**
1. Check MCP server registry for Gmail server
2. Install MCP server: `npm install -g @modelcontextprotocol/server-gmail` (or equivalent)
3. Configure MCP settings in Claude Code
4. Test MCP connection: `mcp test gmail`

**Acceptance Criteria:**
- [ ] Gmail MCP server installed
- [ ] MCP configuration file created
- [ ] Docs/mcp_setup.md created with setup instructions
- [ ] MCP server responds to test commands

**Test Procedure:**
```powershell
# Test MCP server connection (command depends on MCP implementation)
# This is a placeholder - actual command will depend on MCP server used
```

**Git Commit:** `feat(mcp): set up Gmail MCP server for email operations`

**Rollback:** Uninstall MCP server, remove configuration

---

#### SIL-M6-T02: Configure MCP Server Settings
**Description:** Configure MCP server with Gmail credentials and test operations
**Files to Modify:**
- MCP configuration file

**Skills Involved:** None (MCP configuration)

**Configuration Requirements:**
- Link to credentials.json and token.json
- Configure sender email address
- Set dry-run support flag
- Configure logging level

**Acceptance Criteria:**
- [ ] MCP server configured with Gmail OAuth2 credentials
- [ ] Test email send operation works
- [ ] Dry-run mode supported and tested
- [ ] MCP logs operations correctly

**Test Procedure:**
```powershell
# Test MCP dry-run (placeholder - actual command depends on MCP server)
# Expected: Preview of email send without actually sending
```

**Git Commit:** `config(mcp): configure Gmail MCP server with OAuth2 credentials`

**Rollback:** Reset MCP configuration

---

#### SIL-M6-T03: Implement brain_execute_with_mcp Skill
**Description:** Create skill guide for MCP execution with dry-run workflow (Skill 18)
**Files to Create:**
- `Skills/brain_execute_with_mcp.skill.md`

**Skills Involved:**
- Skill 18: brain_execute_with_mcp (this task documents implementation)

**Implementation Requirements:**
1. Verify plan is in Approved/ folder
2. Read plan and extract MCP tools required
3. **Dry-Run Phase:**
   - For each MCP operation: call with --dry-run flag
   - Capture dry-run output
   - Display results to user
   - Request dry-run approval: "Results look good? (yes/no)"
   - If NO: STOP, move plan back to Pending_Approval/
4. **Execution Phase (only if dry-run approved):**
   - For each MCP operation: call with real parameters
   - Log to Logs/mcp_actions.log: [timestamp] Tool | Operation | Parameters | Mode | Result | Duration
   - Update plan "Execution Log" section
   - If step fails: STOP immediately, call brain_handle_mcp_failure
   - If all steps succeed: update plan Status: Executed, move to Plans/completed/
5. Log to system_log.md

**MCP Logging Format:**
```
[YYYY-MM-DD HH:MM:SS UTC] MCP Call Initiated
Tool: gmail
Operation: send_email
Parameters:
  to: user@example.com
  subject: Test Subject
  body: Test Body
Mode: dry-run
Result: SUCCESS - Would send email
Duration: 1.23s
```

**Acceptance Criteria:**
- [ ] brain_execute_with_mcp.skill.md created
- [ ] Two-phase workflow documented (dry-run → execute)
- [ ] MCP logging format specified
- [ ] Failure handling workflow documented

**Test Procedure:**
```powershell
Test-Path "Skills/brain_execute_with_mcp.skill.md"  # Returns True
```

**Git Commit:** `feat(mcp): implement brain_execute_with_mcp skill with dry-run`

**Rollback:** Remove Skills/brain_execute_with_mcp.skill.md

---

#### SIL-M6-T04: Implement brain_log_action Skill
**Description:** Create skill guide for MCP action logging (Skill 19)
**Files to Create:**
- `Skills/brain_log_action.skill.md`

**Skills Involved:**
- Skill 19: brain_log_action (this task documents implementation)

**Implementation Requirements:**
1. Receive MCP action details (tool, operation, parameters, mode, result, duration)
2. Format log entry per MCP logging format
3. Append to Logs/mcp_actions.log
4. Append to system_log.md (if significant action)

**Acceptance Criteria:**
- [ ] brain_log_action.skill.md created
- [ ] Logging workflow documented
- [ ] Log entry format specified

**Test Procedure:**
```powershell
Test-Path "Skills/brain_log_action.skill.md"  # Returns True
```

**Git Commit:** `feat(logging): implement brain_log_action skill for MCP actions`

**Rollback:** Remove Skills/brain_log_action.skill.md

---

#### SIL-M6-T05: Implement brain_handle_mcp_failure Skill
**Description:** Create skill guide for MCP failure handling (Skill 20)
**Files to Create:**
- `Skills/brain_handle_mcp_failure.skill.md`

**Skills Involved:**
- Skill 20: brain_handle_mcp_failure (this task documents implementation)

**Implementation Requirements:**
1. Receive failure details (tool, operation, error message, timestamp)
2. Create escalation log in Logs/mcp_failures/YYYY-MM-DD_HH-MM-SS_failure.log
3. Update plan Status: Failed
4. Update task Status: Blocked - MCP Failure
5. Display failure notification to user
6. Log to system_log.md
7. **CRITICAL:** STOP execution immediately (no further MCP calls)

**Acceptance Criteria:**
- [ ] brain_handle_mcp_failure.skill.md created
- [ ] Failure handling workflow documented
- [ ] Escalation log format specified
- [ ] STOP execution rule documented

**Test Procedure:**
```powershell
Test-Path "Skills/brain_handle_mcp_failure.skill.md"  # Returns True
```

**Git Commit:** `feat(error): implement brain_handle_mcp_failure skill`

**Rollback:** Remove Skills/brain_handle_mcp_failure.skill.md

---

#### SIL-M6-T06: Test MCP Email Send Workflow
**Description:** Verify complete MCP workflow: dry-run → approval → execute
**Files Created:**
- Test plan with email send action
- MCP action logs

**Skills Involved:**
- Skill 18: brain_execute_with_mcp (testing)
- Skill 19: brain_log_action (testing)

**Test Steps:**
1. Create test plan with email send action (send to your own email)
2. Move plan to Approved/
3. Run brain_execute_with_mcp with --dry-run
4. Verify dry-run output shows email preview
5. Approve dry-run results
6. Run brain_execute_with_mcp with --execute
7. Verify email actually sent
8. Verify Logs/mcp_actions.log has entries for both dry-run and execute
9. Verify system_log.md has entry

**Acceptance Criteria:**
- [ ] Dry-run shows preview without sending
- [ ] Execute actually sends email
- [ ] Both modes logged correctly
- [ ] Plan moves to Plans/completed/ after success

**Test Procedure:**
```powershell
# Check MCP logs
Get-Content "Logs/mcp_actions.log" | Select-String -Pattern "gmail.*send_email"  # Should show 2 entries (dry-run + execute)

# Check received email
# Verify email arrived in your inbox
```

**Git Commit:** `test(mcp): verify email send workflow with dry-run and execute`

**Rollback:** None (test emails are harmless)

---

## Milestone 7: Task Scheduling Setup (M7)

**Objective:** Configure Windows Task Scheduler for three automated tasks
**Duration:** 2 hours
**Dependencies:** M3 (Gmail watcher), M6 (MCP integration)
**Priority:** P1

### Tasks

- [ ] SIL-M7-T01 [M7] Create filesystem watcher scheduled task (15min interval) ⚠️ **Requires Task Scheduler**
- [ ] SIL-M7-T02 [M7] Create Gmail watcher scheduled task (30min interval) ⚠️ **Requires Task Scheduler**
- [ ] SIL-M7-T03 [M7] Create daily summary scheduled task (6 PM daily) ⚠️ **Requires Task Scheduler**
- [ ] SIL-M7-T04 [P] [M7] Create Scheduled/ folder task definition files for documentation

**Task Details:**

#### SIL-M7-T01: Filesystem Watcher Scheduled Task
**Description:** Set up Windows Task Scheduler task for filesystem watcher (15min interval)
**Files Created:**
- Windows Task Scheduler task (not a file, but registered in Task Scheduler)
- `Scheduled/filesystem_watcher_15min.md` (documentation)

**Skills Involved:**
- Skill 1: watcher_skill (scheduled execution)

**PowerShell Commands:**
```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "`"$PWD\watcher_skill.py`" --once --quiet --no-banner" -WorkingDirectory $PWD
$trigger = New-ScheduledTaskTrigger -Daily -At 00:00 -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "AI_Employee_Filesystem_Watcher" -Action $action -Trigger $trigger -Settings $settings -Description "Personal AI Employee - Filesystem Watcher (Bronze Tier)"
```

**Acceptance Criteria:**
- [ ] Scheduled task registered in Windows Task Scheduler
- [ ] Task runs every 15 minutes
- [ ] Task uses --once --quiet --no-banner flags
- [ ] Logs written to Logs/watcher.log
- [ ] Scheduled/filesystem_watcher_15min.md created with documentation

**Test Procedure:**
```powershell
Get-ScheduledTask -TaskName "AI_Employee_Filesystem_Watcher"  # Returns task details
# Wait 15 minutes and check if task ran
Get-Content "Logs/watcher.log" | Select-Object -Last 10  # Should show recent execution
```

**Git Commit:** `feat(scheduler): add filesystem watcher scheduled task (15min)`

**Rollback:** `Unregister-ScheduledTask -TaskName "AI_Employee_Filesystem_Watcher" -Confirm:$false`

---

#### SIL-M7-T02: Gmail Watcher Scheduled Task
**Description:** Set up Windows Task Scheduler task for Gmail watcher (30min interval)
**Files Created:**
- Windows Task Scheduler task
- `Scheduled/gmail_watcher_30min.md` (documentation)

**Skills Involved:**
- Skill 24: gmail_watcher (scheduled execution)

**PowerShell Commands:**
```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "`"$PWD\gmail_watcher.py`" --once --quiet --no-banner" -WorkingDirectory $PWD
$trigger = New-ScheduledTaskTrigger -Daily -At 00:00 -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "AI_Employee_Gmail_Watcher" -Action $action -Trigger $trigger -Settings $settings -Description "Personal AI Employee - Gmail Watcher (Silver Tier)"
```

**Acceptance Criteria:**
- [ ] Scheduled task registered in Windows Task Scheduler
- [ ] Task runs every 30 minutes
- [ ] Task uses --once --quiet --no-banner flags
- [ ] Logs written to Logs/gmail_watcher.log
- [ ] Scheduled/gmail_watcher_30min.md created with documentation

**Test Procedure:**
```powershell
Get-ScheduledTask -TaskName "AI_Employee_Gmail_Watcher"  # Returns task details
# Wait 30 minutes and check if task ran
Get-Content "Logs/gmail_watcher.log" | Select-Object -Last 10  # Should show recent execution
```

**Git Commit:** `feat(scheduler): add Gmail watcher scheduled task (30min)`

**Rollback:** `Unregister-ScheduledTask -TaskName "AI_Employee_Gmail_Watcher" -Confirm:$false`

---

#### SIL-M7-T03: Daily Summary Scheduled Task
**Description:** Set up Windows Task Scheduler task for daily summary generation (6 PM daily)
**Files Created:**
- Windows Task Scheduler task
- `Scheduled/daily_summary_6pm.md` (documentation)

**Skills Involved:**
- Skill 21: brain_generate_summary (scheduled execution)

**PowerShell Commands:**
```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "`"$PWD\brain_generate_summary.py`" --daily --quiet" -WorkingDirectory $PWD
$trigger = New-ScheduledTaskTrigger -Daily -At 18:00
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "AI_Employee_Daily_Summary" -Action $action -Trigger $trigger -Settings $settings -Description "Personal AI Employee - Daily Summary Generation (Silver Tier)"
```

**Acceptance Criteria:**
- [ ] Scheduled task registered in Windows Task Scheduler
- [ ] Task runs daily at 6 PM
- [ ] Task uses --daily --quiet flags
- [ ] Logs written to Logs/scheduler.log
- [ ] Scheduled/daily_summary_6pm.md created with documentation

**Test Procedure:**
```powershell
Get-ScheduledTask -TaskName "AI_Employee_Daily_Summary"  # Returns task details
# Manually run task to test
Start-ScheduledTask -TaskName "AI_Employee_Daily_Summary"
# Check if summary was generated
Test-Path "Plans/Briefings/summary_$(Get-Date -Format 'yyyy-MM-dd').md"  # Returns True
```

**Git Commit:** `feat(scheduler): add daily summary scheduled task (6 PM)`

**Rollback:** `Unregister-ScheduledTask -TaskName "AI_Employee_Daily_Summary" -Confirm:$false`

---

#### SIL-M7-T04: Create Task Definition Files
**Description:** Document all scheduled tasks in Scheduled/ folder for reference
**Files to Create:**
- `Scheduled/filesystem_watcher_15min.md`
- `Scheduled/gmail_watcher_30min.md`
- `Scheduled/daily_summary_6pm.md`

**Skills Involved:** None (documentation)

**Content for Each File:**
- Task name
- Schedule (interval or time)
- Command executed
- Flags used
- Log file location
- Purpose
- PowerShell registration command (for recreation)

**Acceptance Criteria:**
- [ ] All three task definition files created
- [ ] Each file documents full task configuration
- [ ] Files include PowerShell commands for recreation

**Test Procedure:**
```powershell
Test-Path "Scheduled/filesystem_watcher_15min.md", "Scheduled/gmail_watcher_30min.md", "Scheduled/daily_summary_6pm.md"  # All return True
```

**Git Commit:** `docs(scheduler): add task definition files for documentation`

**Rollback:** Remove three task definition files from Scheduled/

---

## Milestone 8: Daily Summary Skill (M8)

**Objective:** Implement brain_generate_summary skill and CLI wrapper
**Duration:** 2 hours
**Dependencies:** M2 (documentation), M4 (plan workflow)
**Priority:** P1

### Tasks

- [ ] SIL-M8-T01 [M8] Implement brain_generate_summary skill guide in Skills/
- [ ] SIL-M8-T02 [M8] Create brain_generate_summary.py CLI wrapper
- [ ] SIL-M8-T03 [M8] Test summary generation with sample data

**Task Details:**

#### SIL-M8-T01: Implement brain_generate_summary Skill
**Description:** Create skill guide for daily/weekly summary generation (Skill 21)
**Files to Create:**
- `Skills/brain_generate_summary.skill.md`

**Skills Involved:**
- Skill 21: brain_generate_summary (this task documents implementation)

**Implementation Requirements:**
1. Read from multiple sources:
   - system_log.md (all operations today/this week)
   - Needs_Action/ (count of pending items)
   - Done/ (count of completed items)
   - Logs/mcp_actions.log (MCP actions taken)
   - Pending_Approval/ (count of items awaiting approval)
2. Generate summary with sections:
   - Date range
   - System activity overview
   - Tasks processed (intake, completed, in progress)
   - MCP actions executed
   - Pending items requiring attention
   - Key metrics (processing time, success rate)
3. Save to Plans/Briefings/summary_{YYYY-MM-DD}.md
4. Update Dashboard.md with pointer to latest summary
5. Log to system_log.md

**Summary Template:**
```markdown
# Daily Summary - {YYYY-MM-DD}

## Activity Overview
- Intake items processed: {count}
- Tasks completed: {count}
- MCP actions executed: {count}
- Items pending approval: {count}

## MCP Actions
{list of MCP calls from mcp_actions.log}

## Pending Attention
{items in Pending_Approval/ and Needs_Action/}

## Metrics
- Total processing time: {duration}
- Success rate: {percentage}

---
Generated: {timestamp}
```

**Acceptance Criteria:**
- [ ] brain_generate_summary.skill.md created
- [ ] Summary generation logic documented
- [ ] Summary template specified
- [ ] Data sources identified

**Test Procedure:**
```powershell
Test-Path "Skills/brain_generate_summary.skill.md"  # Returns True
```

**Git Commit:** `feat(summary): implement brain_generate_summary skill guide`

**Rollback:** Remove Skills/brain_generate_summary.skill.md

---

#### SIL-M8-T02: Create Summary CLI Wrapper
**Description:** Create Python CLI wrapper for brain_generate_summary skill
**Files to Create:**
- `brain_generate_summary.py`
- `Plans/Briefings/` folder (if not exists)

**Skills Involved:**
- Skill 21: brain_generate_summary (implementation)

**CLI Flags:**
- `--daily` - Generate daily summary (default)
- `--weekly` - Generate weekly summary
- `--quiet` - Minimal console output
- `--verbose` - Detailed console output

**Implementation Requirements:**
- Parse system_log.md for today's entries
- Count files in Needs_Action/, Done/, Pending_Approval/
- Parse Logs/mcp_actions.log for MCP actions
- Generate summary using template
- Save to Plans/Briefings/summary_{date}.md
- Update Dashboard.md with latest summary link

**Acceptance Criteria:**
- [ ] brain_generate_summary.py created with CLI
- [ ] --daily and --weekly flags implemented
- [ ] Summary files saved to Plans/Briefings/
- [ ] Dashboard.md updated with summary link

**Test Procedure:**
```powershell
python brain_generate_summary.py --daily --verbose  # Generates summary
Test-Path "Plans/Briefings/summary_$(Get-Date -Format 'yyyy-MM-dd').md"  # Returns True
```

**Git Commit:** `feat(summary): create CLI wrapper for daily summary generation`

**Rollback:** Remove brain_generate_summary.py and Plans/Briefings/

---

#### SIL-M8-T03: Test Summary Generation
**Description:** Verify summary generation with sample system activity
**Files Created:**
- Sample summary file in Plans/Briefings/

**Skills Involved:**
- Skill 21: brain_generate_summary (testing)

**Test Steps:**
1. Run some sample operations (create task, move to Done/, etc.)
2. Run: `python brain_generate_summary.py --daily --verbose`
3. Verify summary file created
4. Verify summary contains correct counts
5. Verify Dashboard.md updated

**Acceptance Criteria:**
- [ ] Summary generated successfully
- [ ] Counts are accurate
- [ ] Summary file is readable
- [ ] Dashboard.md has link to summary

**Test Procedure:**
```powershell
# Run summary generation
python brain_generate_summary.py --daily

# Verify file created
Test-Path "Plans/Briefings/summary_*.md"  # Returns True

# Check content
Get-Content "Plans/Briefings/summary_*.md"  # Should show structured summary
```

**Git Commit:** `test(summary): verify summary generation with sample data`

**Rollback:** Remove test summary files

---

## Milestone 9: End-to-End Testing (M9)

**Objective:** Verify complete Silver Tier workflow from email to MCP execution
**Duration:** 2-3 hours
**Dependencies:** M6 (MCP integration), M7 (scheduling)
**Priority:** P0 (blocking)

### Tasks

- [ ] SIL-M9-T01 [M9] Execute full demo flow: email → watcher → process → plan → approve → MCP send
- [ ] SIL-M9-T02 [M9] Test failure scenario: MCP failure handling and rollback
- [ ] SIL-M9-T03 [M9] Verify all logs written correctly (system_log, mcp_actions, gmail_watcher)
- [ ] SIL-M9-T04 [M9] Verify Bronze Tier functionality preserved (filesystem watcher still works)

**Task Details:**

#### SIL-M9-T01: Execute Full Demo Flow
**Description:** Run complete end-to-end Silver Tier workflow
**Files Created:**
- Multiple files across workflow (intake wrapper, plan, MCP logs)

**Skills Involved:**
- Skill 24: gmail_watcher
- Skill 2: brain_process_inbox_batch
- Skill 16: brain_create_plan
- Skill 17: brain_request_approval
- Skill 18: brain_execute_with_mcp
- Skill 19: brain_log_action

**Test Steps (10-step demo flow):**
1. **Send test email** to your Gmail account with subject "Test: Reply to John"
2. **Run Gmail watcher**: `python gmail_watcher.py --once --verbose`
   - Verify: Intake wrapper created in Needs_Action/
3. **Process inbox**: Use brain_process_inbox_batch
   - Verify: Task file created, routed to Needs_Action/
4. **Create plan**: Use brain_create_plan
   - Verify: Plan file created in Plans/ with Status: Draft
5. **Request approval**: Use brain_request_approval
   - Verify: Plan moved to Pending_Approval/, console shows approval request
6. **User approves**: Manually move plan to Approved/
   - Verify: File in Approved/ folder
7. **Monitor approvals**: Use brain_monitor_approvals
   - Verify: Plan detected in Approved/
8. **Execute dry-run**: brain_execute_with_mcp with --dry-run
   - Verify: Console shows email preview, MCP logs dry-run
9. **Approve dry-run**: User confirms results look good
   - Verify: Ready for execution
10. **Execute plan**: brain_execute_with_mcp with --execute
    - Verify: Email actually sent, plan moved to Plans/completed/, logs written

**Acceptance Criteria:**
- [ ] Email received and intake wrapper created
- [ ] Plan created and routed through approval workflow
- [ ] Dry-run executed and logged
- [ ] Execute phase sends actual email
- [ ] All logs written (system_log, mcp_actions, gmail_watcher)
- [ ] Plan archived to Plans/completed/

**Test Procedure:**
```powershell
# Verify all key files exist
Test-Path "Needs_Action/intake__*.md"  # Returns True (intake wrapper)
Test-Path "Plans/completed/PLAN_*.md"  # Returns True (completed plan)

# Verify logs
Get-Content "Logs/mcp_actions.log" | Select-String -Pattern "send_email"  # Shows 2 entries (dry-run + execute)

# Check received email
# Verify reply email arrived in John's inbox (or your test inbox)
```

**Git Commit:** `test(e2e): verify complete Silver Tier workflow email to MCP`

**Rollback:** Clean up test files from Needs_Action/, Plans/completed/, logs

---

#### SIL-M9-T02: Test Failure Scenario
**Description:** Verify MCP failure handling and rollback procedures
**Files Created:**
- Failure escalation log in Logs/mcp_failures/

**Skills Involved:**
- Skill 18: brain_execute_with_mcp (failure testing)
- Skill 20: brain_handle_mcp_failure

**Test Steps:**
1. Create plan with intentionally invalid email address (e.g., "invalid@invalid@invalid")
2. Move plan to Approved/
3. Run brain_execute_with_mcp
4. Verify: Execution fails with MCP error
5. Verify: brain_handle_mcp_failure called
6. Verify: Escalation log created in Logs/mcp_failures/
7. Verify: Plan Status set to Failed
8. Verify: Execution STOPPED immediately (no further MCP calls)
9. Verify: system_log.md has failure entry

**Acceptance Criteria:**
- [ ] MCP failure detected and handled
- [ ] Escalation log created
- [ ] Plan marked as Failed
- [ ] Execution stopped immediately
- [ ] system_log.md has failure entry

**Test Procedure:**
```powershell
# Check failure log created
Test-Path "Logs/mcp_failures/*.log"  # Returns True

# Verify plan status
Select-String -Path "Plans/PLAN_*.md" -Pattern "Status: Failed"  # Returns match

# Verify no further MCP calls after failure
(Get-Content "Logs/mcp_actions.log" | Select-String -Pattern "after failure").Count  # Returns 0
```

**Git Commit:** `test(error): verify MCP failure handling and rollback`

**Rollback:** Remove test failure files

---

#### SIL-M9-T03: Verify Logs Written Correctly
**Description:** Audit all log files for correct format and completeness
**Files to Check:**
- `system_log.md`
- `Logs/mcp_actions.log`
- `Logs/gmail_watcher.log`
- `Logs/scheduler.log` (if scheduled tasks ran)

**Skills Involved:** All logging skills

**Test Steps:**
1. Check system_log.md has entries for all Silver operations
2. Check Logs/mcp_actions.log has correct format (timestamp, tool, operation, mode, result, duration)
3. Check Logs/gmail_watcher.log has Gmail operations
4. Verify timestamps are UTC
5. Verify log entries are append-only (no overwrites)

**Acceptance Criteria:**
- [ ] All log files exist and are not empty
- [ ] Log entries follow specified formats
- [ ] Timestamps are UTC
- [ ] No log overwrites (append-only verified)
- [ ] All Silver operations logged

**Test Procedure:**
```powershell
# Check log files exist
Test-Path "system_log.md", "Logs/mcp_actions.log", "Logs/gmail_watcher.log", "Logs/scheduler.log"  # All return True

# Verify MCP log format
Get-Content "Logs/mcp_actions.log" | Select-String -Pattern "\[.*UTC\].*Tool:.*Operation:.*Mode:.*Result:"  # Returns matches

# Count Silver operations in system_log
Select-String -Path "system_log.md" -Pattern "silver_tier|Silver Tier" | Measure-Object  # Returns count > 0
```

**Git Commit:** `test(logs): verify all logs written with correct format`

**Rollback:** None (verification only)

---

#### SIL-M9-T04: Verify Bronze Tier Preserved
**Description:** Verify all Bronze Tier functionality still works (no breaking changes)
**Files to Check:**
- `watcher_skill.py` (unchanged)
- Bronze folder structure (Inbox/, Needs_Action/, Done/, Logs/, Plans/)
- `Dashboard.md` (Bronze sections unchanged)
- `Company_Handbook.md` (Skills 1-15 unchanged)

**Skills Involved:**
- Skill 1: watcher_skill (Bronze)
- Skill 2-15: All Bronze skills

**Test Steps:**
1. Run filesystem watcher: `python watcher_skill.py --once --verbose`
2. Create test file in Inbox/
3. Verify watcher creates intake wrapper
4. Verify intake wrapper format unchanged
5. Verify Bronze skills 1-15 still documented and operational
6. Verify Dashboard Bronze sections unchanged

**Acceptance Criteria:**
- [ ] Filesystem watcher still works
- [ ] Intake wrapper format preserved
- [ ] Bronze skills 1-15 unchanged in handbook
- [ ] Dashboard Bronze sections unchanged
- [ ] No breaking changes to Bronze foundation

**Test Procedure:**
```powershell
# Test filesystem watcher
New-Item -ItemType File -Path "Inbox/test_bronze.txt" -Force
python watcher_skill.py --once --verbose
Test-Path "Inbox/inbox__test_bronze.txt__*.md"  # Returns True (intake wrapper created)

# Verify handbook sections
Select-String -Path "Company_Handbook.md" -Pattern "^### Skill ([1-9]|1[0-5]):" | Measure-Object  # Returns 15 (Bronze skills preserved)
```

**Git Commit:** `test(bronze): verify Bronze Tier functionality preserved`

**Rollback:** None (verification only)

---

## Milestone 10: Silver Demo & Documentation (M10)

**Objective:** Create final demo script and documentation for Silver Tier
**Duration:** 1-2 hours
**Dependencies:** M9 (testing)
**Priority:** P0 (blocking)

### Tasks

- [ ] SIL-M10-T01 [M10] Create DEMO_silver_tier.md with 5-minute reproducible demo script
- [ ] SIL-M10-T02 [M10] Update Dashboard.md with final Silver completion status
- [ ] SIL-M10-T03 [M10] Add final system_log.md entry marking Silver Tier complete
- [ ] SIL-M10-T04 [M10] Create Silver Tier completion verification checklist

**Task Details:**

#### SIL-M10-T01: Create Demo Script
**Description:** Create comprehensive 5-minute demo script for Silver Tier
**Files to Create:**
- `DEMO_silver_tier.md`

**Skills Involved:** All Silver skills (demonstration)

**Demo Script Sections:**
1. **Pre-Demo Setup** (2 minutes before demo)
   - Start clean state
   - Ensure scheduled tasks running
   - Prepare test email
2. **Demo Flow** (5 minutes)
   - Minute 1: Show Gmail watcher detecting email, creating intake wrapper
   - Minute 2: Show plan creation workflow
   - Minute 3: Show approval pipeline (Pending → Approved)
   - Minute 4: Show MCP dry-run and execution
   - Minute 5: Show logs, Dashboard update, completed workflow
3. **What to Say** (narration script for each step)
4. **Expected Outputs** (screenshots or console output examples)
5. **Troubleshooting** (common issues and fixes)

**Acceptance Criteria:**
- [ ] DEMO_silver_tier.md created with complete script
- [ ] Demo reproducible in under 5 minutes
- [ ] All Silver features demonstrated
- [ ] Narration script included

**Test Procedure:**
```powershell
Test-Path "DEMO_silver_tier.md"  # Returns True

# Practice demo (should complete in under 5 minutes)
# Follow script exactly and time it
```

**Git Commit:** `docs(demo): add Silver Tier 5-minute demo script`

**Rollback:** Remove DEMO_silver_tier.md

---

#### SIL-M10-T02: Update Dashboard with Completion Status
**Description:** Update Dashboard.md with Silver Tier completion markers
**Files to Modify:**
- `Dashboard.md`

**Skills Involved:** None (documentation)

**Updates to Make:**
1. Update "Active Focus" section: "Silver Tier Complete ✅"
2. Update "Silver Health Check" section: Check all 6 boxes
3. Update "Last Completed Task" with Silver completion timestamp
4. Update "Quick Stats" with final Silver metrics

**Acceptance Criteria:**
- [ ] Dashboard shows Silver Tier complete
- [ ] All Silver health checks green
- [ ] Final metrics updated
- [ ] Dashboard renders correctly in Obsidian

**Test Procedure:**
```powershell
# Verify completion marker
Select-String -Path "Dashboard.md" -Pattern "Silver Tier Complete" | Measure-Object  # Returns count > 0
```

**Git Commit:** `docs(dashboard): mark Silver Tier complete with final metrics`

**Rollback:** Revert Dashboard.md to pre-completion state

---

#### SIL-M10-T03: Add Final System Log Entry
**Description:** Add comprehensive Silver Tier completion entry to system_log.md
**Files to Modify:**
- `system_log.md`

**Skills Involved:** None (documentation)

**Log Entry Content:**
```markdown
### [timestamp] - silver_tier_completion
**Skill:** system_milestone (Silver Tier completion)
**Files Touched:**
- All Silver Tier files (45 tasks completed across 10 milestones)
- [List key files created: gmail_watcher.py, skill guides, MCP integration, etc.]

**Outcome:** ✓ OK - Silver Tier implementation complete and verified
- Duration: [actual duration in hours]
- Tasks Completed: 45/45
- Milestones: M1-M10 all complete
- All acceptance criteria met
- Bronze foundation preserved
- Demo tested and reproducible

**Silver Tier Capabilities Added:**
1. Gmail Watcher (OAuth2-based)
2. Plan-first workflow (mandatory for external actions)
3. Human-in-the-loop approval pipeline (file-based)
4. MCP email integration (send/draft with dry-run)
5. Windows Task Scheduler integration (3 scheduled tasks)
6. 9 new agent skills (total 24 skills: 15 Bronze + 9 Silver)
7. Enhanced dashboard with Silver metrics

**Next Steps:**
- Merge silver-tier branch to main
- Tag release: v1.0.0-silver
- Submit to Hackathon 0
- Plan Gold Tier (see SPEC_silver_tier.md Section 13)

---
```

**Acceptance Criteria:**
- [ ] Final log entry added to system_log.md
- [ ] Entry documents all Silver capabilities
- [ ] Next steps clearly stated
- [ ] Timestamp matches completion time

**Test Procedure:**
```powershell
# Verify entry exists
Select-String -Path "system_log.md" -Pattern "silver_tier_completion"  # Returns match
```

**Git Commit:** `docs(log): add Silver Tier completion entry to system_log.md`

**Rollback:** Remove final log entry

---

#### SIL-M10-T04: Create Completion Verification Checklist
**Description:** Create comprehensive checklist to verify Silver Tier is complete
**Files to Create:**
- `SILVER_COMPLETION_CHECKLIST.md`

**Skills Involved:** None (verification checklist)

**Checklist Categories:**
1. **Vault Structure** (4 folders, 3 logs)
2. **Documentation** (handbook, dashboard, guides)
3. **Watchers** (filesystem preserved, Gmail new)
4. **Planning** (plan workflow, templates)
5. **Approval Pipeline** (HITL workflow functional)
6. **MCP Integration** (Gmail MCP, dry-run, logging)
7. **Scheduling** (3 scheduled tasks registered)
8. **Agent Skills** (all 24 skills documented and functional)
9. **Logging** (all logs written correctly)
10. **Bronze Integrity** (no breaking changes)
11. **Testing** (end-to-end verified)
12. **Demo** (5-minute demo reproducible)

**Acceptance Criteria:**
- [ ] SILVER_COMPLETION_CHECKLIST.md created
- [ ] All 12 categories with detailed items
- [ ] All items checkable ([ ] format)
- [ ] 100% of items checked = Silver complete

**Test Procedure:**
```powershell
Test-Path "SILVER_COMPLETION_CHECKLIST.md"  # Returns True

# Work through checklist and check all boxes
# If all boxes checked: Silver Tier is COMPLETE ✅
```

**Git Commit:** `docs(verify): add Silver Tier completion verification checklist`

**Rollback:** Remove SILVER_COMPLETION_CHECKLIST.md

---

## Recommended Execution Order

**Phase 1: Foundation (M1-M2)** - Must complete sequentially
1. SIL-M1-T01 → SIL-M1-T02 → SIL-M1-T03 (M1: Vault structure)
2. SIL-M2-T01 → SIL-M2-T02 (M2: Documentation)

**Phase 2: Core Workflows (M3-M5)** - Some parallelization possible
3. SIL-M3-T01 → SIL-M3-T02 → SIL-M3-T03 (M3: Gmail watcher - OAuth critical path)
4. SIL-M3-T04 [P] + SIL-M3-T05 [P] (M3: Can run in parallel with M4)
5. SIL-M4-T01 → SIL-M4-T02 → SIL-M4-T03 (M4: Plan workflow)
6. SIL-M5-T01 → SIL-M5-T02 → SIL-M5-T03 (M5: Approval pipeline)

**Phase 3: External Actions (M6)** - Blocking critical path
7. SIL-M6-T01 → SIL-M6-T02 → SIL-M6-T03 (M6: MCP setup - must be sequential)
8. SIL-M6-T04 [P] + SIL-M6-T05 [P] (M6: Can run in parallel)
9. SIL-M6-T06 (M6: MCP testing - must wait for T01-T05)

**Phase 4: Automation & Polish (M7-M8)** - Can run in parallel
10. SIL-M7-T01 → SIL-M7-T02 → SIL-M7-T03 → SIL-M7-T04 (M7: Scheduling)
11. SIL-M8-T01 → SIL-M8-T02 → SIL-M8-T03 (M8: Summary - can run parallel with M7)

**Phase 5: Verification & Demo (M9-M10)** - Must complete sequentially after all previous
12. SIL-M9-T01 → SIL-M9-T02 → SIL-M9-T03 → SIL-M9-T04 (M9: Testing)
13. SIL-M10-T01 → SIL-M10-T02 → SIL-M10-T03 → SIL-M10-T04 (M10: Demo & docs)

**Total: 45 tasks across 10 milestones**

---

## Summary Statistics

**Total Tasks:** 45
**Total Milestones:** 10
**Estimated Duration:** 20-30 hours
**Critical Path:** M1 → M2 → M3 → M6 → M9 → M10

**Tasks by Milestone:**
- M1: 3 tasks (vault structure)
- M2: 2 tasks (documentation)
- M3: 5 tasks (Gmail watcher)
- M4: 3 tasks (plan workflow)
- M5: 3 tasks (approval pipeline)
- M6: 6 tasks (MCP integration)
- M7: 4 tasks (scheduling)
- M8: 3 tasks (daily summary)
- M9: 4 tasks (testing)
- M10: 4 tasks (demo & docs)

**Parallelizable Tasks:** 8 tasks marked with [P]
**OAuth Setup Required:** 3 tasks
**MCP Configuration Required:** 6 tasks
**Windows Task Scheduler Required:** 4 tasks

**Skills Implemented:** 9 new Silver skills (Skills 16-24)
**Bronze Skills Preserved:** 15 Bronze skills (Skills 1-15)
**Total Skills:** 24

---

## First Task to Execute

**Start Here:** SIL-M1-T01

```powershell
# Task: Create approval workflow folders
New-Item -ItemType Directory -Path "Pending_Approval", "Approved", "Rejected" -Force

# Create README files (see task details above)
```

---

## Ready for Implementation

✅ **Task breakdown complete**
✅ **All dependencies mapped**
✅ **Execution order defined**
✅ **Special requirements identified**
✅ **Ready for /sp.implement**

**Next Command:** Begin implementation with first task (SIL-M1-T01) or use `/sp.implement` to execute all tasks systematically.

---

**END OF SILVER TIER TASK BREAKDOWN**
