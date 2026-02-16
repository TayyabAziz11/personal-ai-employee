# Personal AI Employee — Hackathon 0

> **Autonomous FTE with Real External Actions**
> Bronze ✅ / Silver ✅ / Gold ⏳ / Platinum ⏳

**Repository:** https://github.com/TayyabAziz11/personal-ai-employee
**Release:** [v0.2-silver](https://github.com/TayyabAziz11/personal-ai-employee/releases/tag/v0.2-silver)

---

## 🎯 Tier Status

| Tier | Status | Description |
|------|--------|-------------|
| **Bronze** | ✅ **Complete** | Foundation + Execution (filesystem watcher, markdown vault, approval gates) |
| **Silver** | ✅ **Complete** | MCP + Human-in-the-Loop Approvals + Real Gmail Actions (verified) |
| **Gold** | ⏳ **Pending** | Multi-Agent Coordination + Advanced Scheduling |
| **Platinum** | ⏳ **Pending** | Self-Improvement + Adaptive Learning |

**Current Focus:** Silver Tier operational with real external action capabilities via Gmail API.

---

## 🏗️ Architecture

**Constitutional Pipeline:**
```
Perception → Plan → Approval → Action → Logging
```

**Key Components:**

1. **Perception Layer** - Dual watchers (filesystem + Gmail)
2. **Planning Brain** - 12-section plan template, risk assessment
3. **Approval Gates** - File-based human-in-the-loop (HITL) approval
4. **Action Execution** - Real Gmail API (dry-run default, explicit --execute)
5. **Audit Trail** - JSON logs with PII redaction, daily summaries

**Safety-First Design:**
- Dry-run mandatory default
- Explicit `--execute` flag required for real actions
- Human approval cannot be bypassed (file movement required)
- Complete audit trail (all actions logged)
- PII redaction in all logs

---

## ✨ What's Implemented (Silver Tier)

### Perception
- **Filesystem Watcher** - Monitors `Needs_Action/` for new tasks
- **Gmail Watcher** - OAuth2 authenticated, searches for task emails with checkpointing

### Planning
- **Plan-First Workflow** - All external actions require structured plans
- **12-Section Template** - Objective, Success Criteria, MCP Tools, Risk Assessment, Execution Steps, Rollback, etc.
- **brain_create_plan skill** - Generates plans from tasks with smart "requires plan" detection

### Approval (HITL)
- **File-Based Approval Pipeline** - `Pending_Approval/` → `Approved/` or `Rejected/`
- **Cannot Be Bypassed** - Requires manual file movement by user
- **brain_request_approval skill** - Creates ACTION files for review
- **brain_monitor_approvals skill** - Processes approval/rejection decisions

### Action (Real Gmail)
- **Gmail API Integration** - Send emails via Gmail API (OAuth2)
- **Dry-Run Default** - `--dry-run` is default mode (preview only)
- **Explicit Execute** - `--execute` flag required for real actions
- **brain_execute_with_mcp skill** - Executes approved plans with MCP
- **Real Gmail Proof** - Email sent and verified on 2026-02-15 03:58:05 UTC

### Scheduling
- **Windows Task Scheduler** - 4 XML tasks for autonomous operation:
  - Filesystem watcher (every 5 min)
  - Gmail watcher (every 10 min)
  - Approval monitor (every 3 min)
  - Daily summary (daily at 8 PM UTC)

### Logging & Audit
- **JSON MCP Logs** - `Logs/mcp_actions.log` (append-only)
- **System Log** - `system_log.md` (Markdown format)
- **PII Redaction** - Emails → `<REDACTED_EMAIL>`, phones → `<REDACTED_PHONE>`
- **Daily Summaries** - Aggregated metrics and activity reports

### Workflow Integration
- **Obsidian** - Dashboard.md as central hub (Reading Mode)
- **VS Code** - Code execution and file editing
- **Git** - Version control with feature branches

---

## 📁 Repository Structure

```
personal-ai-employee/
├── 📊 Dashboard.md                      # System status and metrics (Obsidian hub)
├── 📋 CLAUDE.md                         # Project instructions for Claude Code
├── 📖 Company_Handbook.md               # Skills, governance, operating loops
│
├── 🔧 CORE SKILLS (Python)
│   ├── brain_create_plan_skill.py       # Plan generation
│   ├── brain_request_approval_skill.py  # Approval workflow
│   ├── brain_monitor_approvals_skill.py # Approval processing
│   ├── brain_execute_with_mcp_skill.py  # MCP action execution
│   ├── brain_generate_daily_summary_skill.py # Daily reports
│   ├── gmail_watcher_skill.py           # Gmail perception
│   ├── gmail_api_helper.py              # Gmail OAuth2 + API wrapper
│   └── scheduler_runner.py              # Task scheduler wrapper
│
├── 📂 VAULT STRUCTURE
│   ├── Inbox/                           # New items awaiting triage
│   ├── Needs_Action/                    # Active tasks
│   ├── Done/                            # Completed tasks
│   ├── Plans/                           # Planning documents
│   │   ├── PLAN_silver_tier_implementation.md  # Silver Tier plan
│   │   ├── completed/                   # Executed plans
│   │   └── failed/                      # Failed executions
│   ├── Pending_Approval/                # Awaiting user approval
│   ├── Approved/                        # User-approved actions
│   ├── Rejected/                        # User-rejected actions
│   └── Daily_Summaries/                 # Daily activity reports
│
├── 📚 DOCUMENTATION
│   ├── Docs/
│   │   ├── demo_script_silver.md        # 5-minute judge demo
│   │   ├── silver_completion_checklist.md # Silver requirements
│   │   ├── test_report_silver_e2e.md    # End-to-end test report
│   │   └── mcp_gmail_setup.md           # Gmail API setup guide
│   ├── Specs/
│   │   ├── SPEC_silver_tier.md          # Silver Tier specification
│   │   └── sp.constitution.md           # Constitutional principles
│   ├── Tasks/
│   │   └── SILVER_TASKS.md              # M1-M10 task breakdown
│   └── Plans/
│       └── PLAN_silver_tier_implementation.md # Implementation plan
│
├── ⏰ SCHEDULED TASKS
│   ├── Scheduled/
│   │   ├── filesystem_watcher_task.xml
│   │   ├── gmail_watcher_task.xml
│   │   ├── approval_monitor_task.xml
│   │   └── daily_summary_task.xml
│
├── 🧰 SPECKIT FRAMEWORK (.specify/)
│   ├── scripts/bash/                    # Automation scripts
│   ├── templates/                       # Spec, plan, task templates
│   └── memory/constitution.md           # Project principles
│
├── 📜 PROMPT HISTORY (history/)
│   └── prompts/                         # PHR (Prompt History Records)
│
└── 🔒 SECRETS (.secrets/ - NOT COMMITTED)
    ├── gmail_credentials.json           # OAuth2 credentials
    └── gmail_token.json                 # OAuth2 token
```

---

## 🚀 Setup (Windows + WSL2)

### Prerequisites

**1. Install WSL2 (Ubuntu on Windows):**
```powershell
# Open PowerShell as Administrator
wsl --install
# Restart computer when prompted
```

**2. Install Ubuntu from Microsoft Store**

**3. Clone Repository:**
```bash
git clone https://github.com/TayyabAziz11/personal-ai-employee.git
cd personal-ai-employee
```

### Python Environment

**4. Create Virtual Environment:**
```bash
# Navigate to project directory (WSL path)
cd "/mnt/e/path/to/personal-ai-employee"

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Verify activation
which python  # Should show venv/bin/python
```

**5. Install Dependencies:**
```bash
# Install Gmail API libraries
pip install -r requirements.txt

# Or install manually:
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

# Verify installation
python3 -c "from googleapiclient.discovery import build; print('✓ Gmail API libraries installed')"
```

### Gmail API Credentials

**6. Obtain Gmail API Credentials:**

Follow the detailed guide in `Docs/mcp_gmail_setup.md`:
- Create Google Cloud project
- Enable Gmail API
- Create OAuth2 credentials
- Download `credentials.json` file

**7. Place Credentials:**
```bash
# Create .secrets directory
mkdir -p .secrets

# Copy downloaded credentials
cp ~/Downloads/credentials.json .secrets/gmail_credentials.json
```

**8. Authenticate (First-Time Only):**
```bash
# Run authentication helper
python3 scripts/gmail_api_helper.py --check-auth

# Follow OAuth2 flow in browser
# Token will be saved to .secrets/gmail_token.json

# Verify authentication
python3 scripts/gmail_api_helper.py --check-auth
# Should output: ✓ Gmail API authenticated successfully
```

---

## 📁 Project Structure

The codebase is organized as a Python package under `src/` with backwards-compatible root wrappers:

```
personal-ai-employee/
├── src/personal_ai_employee/          # Main package
│   ├── core/                          # Core utilities
│   │   ├── mcp_helpers.py            # MCP utilities (PII redaction, rate limiting)
│   │   ├── gmail_api_helper.py       # Gmail API authentication
│   │   └── scheduler_runner.py       # Task scheduler runner
│   ├── skills/                       # Skills organized by tier
│   │   ├── silver/                   # Silver tier skills
│   │   │   ├── gmail_watcher_skill.py
│   │   │   ├── brain_create_plan_skill.py
│   │   │   ├── brain_request_approval_skill.py
│   │   │   ├── brain_monitor_approvals_skill.py
│   │   │   └── brain_execute_with_mcp_skill.py
│   │   └── gold/                     # Gold tier skills
│   │       ├── whatsapp_watcher_skill.py
│   │       ├── linkedin_watcher_skill.py
│   │       ├── twitter_watcher_skill.py
│   │       ├── odoo_watcher_skill.py
│   │       ├── brain_execute_social_with_mcp_skill.py
│   │       ├── brain_execute_odoo_with_mcp_skill.py
│   │       ├── brain_ralph_loop_orchestrator_skill.py
│   │       └── brain_generate_weekly_ceo_briefing_skill.py
│   └── __init__.py
├── scripts/                           # Backwards-compatible entrypoint wrappers
│   ├── README.md                     # Wrapper documentation
│   ├── gmail_watcher_skill.py        # Wrapper → silver/gmail_watcher_skill.py
│   ├── brain_create_plan_skill.py    # Wrapper → silver/brain_create_plan_skill.py
│   ├── brain_ralph_loop_orchestrator_skill.py  # Wrapper → gold/...
│   └── ... (22 total wrappers)       # All skills + gmail_api_helper
├── pyproject.toml                     # Package configuration
└── requirements.txt                   # Dependencies
```

### Root Wrappers (Backwards Compatibility)

All skill scripts in the root directory are **wrapper scripts** that maintain compatibility with:
- Existing CLI commands (e.g., `python3 scripts/gmail_watcher_skill.py --once`)
- Scheduled task XML files in `Scheduled/`
- Documentation examples

**How it works:**
- Wrappers add `src/` to Python path
- Import the actual implementation from `src/personal_ai_employee/skills/`
- Call the skill's `main()` function

**Example wrapper:**
```python
#!/usr/bin/env python3
"""Backwards compatibility wrapper for gmail_watcher_skill.py"""
import sys
from pathlib import Path
repo_root = Path(__file__).parent
sys.path.insert(0, str(repo_root / 'src'))
from personal_ai_employee.skills.silver.gmail_watcher_skill import main
if __name__ == '__main__':
    main()
```

### Development Setup (Recommended)

For development, install the package in editable mode:

```bash
# From repo root
pip install -e .

# This allows:
# - Direct imports: from personal_ai_employee.core import mcp_helpers
# - Root wrappers work without manual path manipulation
```

**WSL Note:** The package structure works seamlessly in WSL. Continue using existing commands:
```bash
python3 scripts/gmail_watcher_skill.py --mock --once
python3 scripts/brain_ralph_loop_orchestrator_skill.py --dry-run
python3 scripts/odoo_watcher_skill.py --mode mock --once
```

---

## 💻 Quick Start Commands

### 1. Perception (Watchers)

```bash
# Filesystem watcher (check Needs_Action/ folder)
python3 scripts/filesystem_watcher_skill.py --once

# Gmail watcher (check for new emails)
python3 scripts/gmail_watcher_skill.py --dry-run --once
```

### 2. Create a Plan

```bash
# Generate plan from a task file
python3 scripts/brain_create_plan_skill.py \
  --task Needs_Action/your_task_file.md \
  --objective "Send email to confirm meeting" \
  --risk-level Low \
  --status Draft
```

### 3. Request Approval

```bash
# Create approval request (creates ACTION file in Pending_Approval/)
python3 scripts/brain_request_approval_skill.py \
  --plan Plans/PLAN_YYYYMMDD-HHMM__your_plan.md
```

### 4. Process Approval (Human-in-the-Loop)

```bash
# STEP 1: MANUALLY move ACTION file
# From: Pending_Approval/ACTION_*.md
# To: Approved/ACTION_*.md (or Rejected/)

# STEP 2: Process the approval decision
python3 scripts/brain_monitor_approvals_skill.py
```

### 5. Execute with Dry-Run

```bash
# Dry-run is DEFAULT (no flag needed)
python3 scripts/brain_execute_with_mcp_skill.py \
  --plan Plans/PLAN_YYYYMMDD-HHMM__your_plan.md

# Shows email preview without sending
```

### 6. Execute for Real

```bash
# REQUIRES explicit --execute flag
python3 scripts/brain_execute_with_mcp_skill.py \
  --plan Plans/PLAN_YYYYMMDD-HHMM__your_plan.md \
  --execute

# Sends actual email via Gmail API
```

### 7. View Logs

```bash
# MCP action logs (JSON format)
tail -n 10 Logs/mcp_actions.log

# System log (Markdown format)
tail -n 20 system_log.md

# Daily summary
cat Daily_Summaries/$(date +%Y-%m-%d).md
```

---

## 🎬 Demo Materials

**For Judge Evaluation:**

1. **Dashboard** - Open `Dashboard.md` in Obsidian Reading Mode
   - "🚀 Demo Start Here" section with quick links

2. **Demo Script** - `Docs/demo_script_silver.md`
   - 5-minute structured demo walkthrough
   - Full workflow: Perception → Plan → Approval → Action → Logging

3. **Completion Checklist** - `Docs/silver_completion_checklist.md`
   - All Silver requirements mapped and verified
   - 100% complete (M1-M10)

4. **Test Report** - `Docs/test_report_silver_e2e.md`
   - 7 end-to-end tests (all passed)
   - Real Gmail mode verification addendum
   - Evidence: email sent and received (2026-02-15 03:58:05 UTC)

---

## 🔒 Security & Privacy

### Secrets Protection
- ✅ `.secrets/` directory gitignored
- ✅ `credentials.json` and `token.json` never committed
- ✅ OAuth2 token stored locally only
- ✅ No secrets in version control

### PII Redaction
- ✅ Email addresses → `<REDACTED_EMAIL>`
- ✅ Phone numbers → `<REDACTED_PHONE>`
- ✅ Applied to all logs (`mcp_actions.log`, `system_log.md`)
- ✅ Applied to all documentation

### Approval Gates
- ✅ External actions require approved plan
- ✅ Human-in-the-loop approval (file movement)
- ✅ Cannot be bypassed programmatically

### Audit Trail
- ✅ All actions logged (JSON + Markdown)
- ✅ Timestamps in UTC
- ✅ Append-only logs (no deletions)
- ✅ Duration metrics (real API vs simulation)

---

## 🌳 Branching Strategy

**Branches:**
- `main` - Stable, production-ready (Bronze + Silver complete)
- `bronze-tier` - Historical Bronze Tier development
- `silver-tier` - Historical Silver Tier development (M4-M10)

**Tags:**
- `v0.1-bronze` - Bronze Tier release
- `v0.2-silver` - Silver Tier release (current)

**Workflow:**
```bash
# Clone repository
git clone https://github.com/TayyabAziz11/personal-ai-employee.git

# Main branch has everything (Bronze + Silver)
git checkout main

# View historical development
git checkout silver-tier  # Silver development commits
git checkout bronze-tier  # Bronze foundation
```

---

## 🏆 Hackathon Achievements

### Silver Tier Milestones (M1-M10)

- ✅ **M1-M3:** Perception Layer, Constitutional Pipeline, Logging
- ✅ **M4:** Plan-First Workflow (12-section template)
- ✅ **M5:** Approval Pipeline (HITL file-based)
- ✅ **M6:** MCP Email Execution (dry-run + real modes)
- ✅ **M7:** Scheduled Task Automation (Windows Task Scheduler)
- ✅ **M8:** Daily Summaries + Gmail API Wiring
- ✅ **M9:** End-to-End Testing (7 tests, all passed)
- ✅ **M10:** Demo & Documentation + Real Gmail Proof

### Real Gmail Proof

**Evidence of Real External Actions:**
- ✅ Email sent via Gmail API (not simulated)
- ✅ Timestamp: 2026-02-15 03:58:05 UTC
- ✅ Log entry: `mode: "execute"`, `duration_ms: 1088`, no "SIMULATED" prefix
- ✅ Inbox verification: Email delivered successfully
- ✅ Full audit trail in `Logs/mcp_actions.log` and `system_log.md`

**Technical Details:**
- OAuth2 authentication with Gmail API
- Token refresh handling
- Error handling with graceful fallback
- PII redaction in all logs

---

## 🛠️ Technology Stack

**Languages & Frameworks:**
- Python 3.10+ (core skills, watchers, API integration)
- Markdown (vault structure, documentation)
- XML (Windows Task Scheduler)
- JSON (logs, configuration)

**Libraries:**
- `google-api-python-client` - Gmail API client
- `google-auth-oauthlib` - OAuth2 authentication
- `google-auth-httplib2` - HTTP transport
- Python standard library (pathlib, argparse, json, datetime)

**Platforms:**
- WSL2 (Ubuntu on Windows)
- Windows Task Scheduler
- VS Code (development)
- Obsidian (dashboard and review)
- Git + GitHub (version control)

**AI Engine:**
- Claude Code CLI
- Claude Sonnet 4.5

---

## 📊 Metrics

**Code:**
- 13 Python skills (brain_*.py, gmail_*.py, scheduler_runner.py)
- 2,000+ lines of Python code
- 4 Windows Task Scheduler XML files

**Documentation:**
- 10+ Markdown documentation files
- 5,000+ lines of documentation
- Comprehensive specs, plans, tasks, and test reports

**Testing:**
- 7 end-to-end tests (all passed)
- Real Gmail API verification
- Simulation mode testing

**Workflow:**
- 2 watchers (filesystem + Gmail)
- 12-section plan template
- 4 scheduled tasks (autonomous operation)
- Complete audit trail

---

## 🚧 Roadmap

### Completed

- ✅ **Bronze Tier** - Foundation + Execution
  - Filesystem watcher
  - Markdown vault
  - Task triage and execution
  - Approval gates

- ✅ **Silver Tier** - MCP + HITL Approvals
  - Gmail watcher (OAuth2)
  - Plan-first workflow
  - File-based approval pipeline
  - Real Gmail API integration
  - Windows Task Scheduler automation
  - Daily summaries

### Pending

- ⏳ **Gold Tier** - Multi-Agent + Adaptive
  - Multi-agent coordination
  - Advanced scheduling (priority queues, time-based rules)
  - Multi-channel perception (Slack, GitHub issues)
  - PR reviewer bot
  - Rollback & disaster recovery

- ⏳ **Platinum Tier** - Self-Improvement + Learning
  - Adaptive learning from feedback
  - Self-improvement loops
  - Performance optimization
  - Cost optimization

---

## 🤝 Contributing

This is a Hackathon 0 project demonstrating autonomous FTE capabilities with real external actions.

**Current Status:** Silver Tier complete and operational

**Future Development:**
- Gold Tier planning in progress
- Open to contributions for advanced features
- Focus on security, reliability, and extensibility

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🎓 Built With

- [Claude Code CLI](https://claude.com/claude-code) - AI-powered development assistant
- [Claude Sonnet 4.5](https://anthropic.com) - Reasoning and execution engine
- [Google Gmail API](https://developers.google.com/gmail/api) - Email integration
- Python 3 - Skill implementation and automation
- Markdown - Vault format and documentation
- WSL2 - Linux environment on Windows

---

## 📞 Support & Resources

**Documentation:**
- [README.md](README.md) - This file (Quick Start)
- [Dashboard.md](Dashboard.md) - System status and metrics
- [Docs/demo_script_silver.md](Docs/demo_script_silver.md) - Demo walkthrough
- [Docs/mcp_gmail_setup.md](Docs/mcp_gmail_setup.md) - Gmail API setup
- [Specs/SPEC_silver_tier.md](Specs/SPEC_silver_tier.md) - Full specification

**Troubleshooting:**
- Check `system_log.md` for error messages
- Review `Logs/mcp_actions.log` for action history
- Verify credentials in `.secrets/` directory
- See Gmail API setup guide for OAuth2 issues

**Contact:**
- GitHub Issues: https://github.com/TayyabAziz11/personal-ai-employee/issues
- Repository: https://github.com/TayyabAziz11/personal-ai-employee

---

**🎉 Hackathon 0 - Silver Tier Complete!**

**Made with ❤️ using Claude Code | Powered by Claude Sonnet 4.5**

---

*Note: This is a demonstration project for Hackathon 0. The system is designed to be extended with Gold and Platinum tier capabilities in future iterations.*

**Last Updated:** 2026-02-15
**Version:** v0.2-silver (Bronze ✅ / Silver ✅)
