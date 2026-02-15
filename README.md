# Personal AI Employee — Hackathon 0

> **Silver Tier (Foundation + MCP + Human-in-the-Loop Approvals)**
> A markdown-based AI employee system powered by Claude Code CLI with real external action capabilities

---

## 🎯 Overview

The Personal AI Employee is a **Silver Tier** system that manages tasks end-to-end through a structured markdown vault with **real external action capabilities** via Gmail API.

**Key Features:**
- 📥 **Dual Perception:** Filesystem watcher + Gmail watcher (OAuth2 authenticated)
- 📋 **Plan-First Workflow:** All external actions require structured plans
- ✋ **Human-in-the-Loop Approvals:** File-based approval gates (cannot be bypassed)
- 📧 **Real Gmail Integration:** Send emails via Gmail API (with dry-run default)
- ⏰ **Scheduled Automation:** 4 Windows Task Scheduler tasks
- 📊 **Daily Summaries:** Automated activity reports
- 🔒 **Complete Audit Trail:** JSON logs + PII redaction

**Silver Tier** = **Bronze Foundation** + **MCP External Actions** + **Approval Pipeline**

---

## 🏗️ Architecture

```
personal-ai-employee/
├── Dashboard.md              # Single source of truth for system state
├── Company_Handbook.md       # Agent skills, governance rules, workflows
├── watcher_skill.py          # Filesystem watcher (premium CLI UX)
├── system_log.md            # Append-only audit trail
├── Inbox/                    # New items awaiting triage
├── Needs_Action/             # Active tasks requiring work
├── Done/                     # Completed tasks (archive)
├── Plans/                    # Planning documents for complex work
└── Logs/                     # Watcher logs and system state
```

### Core Components

1. **Markdown Vault** - All state stored in human-readable markdown files
2. **Filesystem Watcher** - Python script (standard library only) for inbox monitoring
3. **Agent Skills** - Defined procedures for intake, triage, execution, and completion
4. **Claude Brain** - End-to-end task processing with approval gates
5. **Dashboard** - Real-time view of workflow state

---

## 🛠️ Technology Stack

- **AI Engine:** Claude Code CLI (Sonnet 4.5)
- **Vault:** Markdown files (portable, version-controllable, human-readable)
- **Watcher:** Python 3 (standard library only, Windows-compatible)
- **IDE:** VS Code (dashboard view)
- **VCS:** Git (branching: main, bronze-tier)

---

## 🚀 Silver Tier Quick Start

### Prerequisites (WSL2 Setup)

This system runs on **WSL2 (Ubuntu on Windows)**. Follow these steps if you haven't set up WSL2 yet:

**1. Install WSL2:**
```powershell
# Open PowerShell as Administrator
wsl --install
# Restart computer when prompted
```

**2. Install Ubuntu from Microsoft Store:**
```
Open Microsoft Store → Search "Ubuntu" → Install
```

**3. Create Python Virtual Environment:**
```bash
# Navigate to project directory (WSL path)
cd "/mnt/e/Certified Cloud Native Generative and Agentic AI Engineer/Q4 part 2/Q4 part 2/Hackathon-0/Personal AI Employee"

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Verify activation (should show venv in prompt)
which python  # Should point to venv/bin/python
```

**4. Install Python Dependencies:**
```bash
# Install Gmail API libraries
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

# Verify installation
python3 -c "from googleapiclient.discovery import build; print('✓ Gmail API libraries installed')"
```

### Gmail API Credentials Setup

**IMPORTANT:** Gmail API is required for real external actions. Without credentials, the system runs in **simulation mode**.

**1. Create `.secrets/` directory:**
```bash
mkdir -p .secrets
```

**2. Obtain Gmail API credentials:**

Follow the guide in `Docs/mcp_gmail_setup.md` for detailed instructions:
- Create Google Cloud project
- Enable Gmail API
- Create OAuth2 credentials
- Download `credentials.json` file

**3. Place credentials in `.secrets/`:**
```bash
# Copy downloaded credentials.json to .secrets/
cp ~/Downloads/credentials.json .secrets/gmail_credentials.json
```

**4. Authenticate (first-time only):**
```bash
# Run authentication helper
python3 gmail_api_helper.py --check-auth

# Follow OAuth2 flow in browser
# Token will be saved to .secrets/gmail_token.json
```

**5. Verify authentication:**
```bash
# Check if credentials are valid
python3 gmail_api_helper.py --check-auth

# Should output:
# ✓ Gmail API authenticated successfully
# Email: your-email@gmail.com
# Token expires: YYYY-MM-DD HH:MM:SS UTC
```

### Silver Tier Workflow

**1. Perception (Watchers):**

```bash
# Gmail watcher (check for new emails)
python3 gmail_watcher_skill.py --dry-run --once

# Filesystem watcher (check Needs_Action/ folder)
python3 filesystem_watcher_skill.py --once
```

**2. Create a Plan:**

```bash
# Create plan from a task file
python3 brain_create_plan_skill.py \
  --task Needs_Action/your_task_file.md \
  --objective "Send email to confirm meeting" \
  --risk-level Low \
  --status Draft
```

**3. Request Approval:**

```bash
# Create approval request (creates ACTION file in Pending_Approval/)
python3 brain_request_approval_skill.py \
  --plan Plans/PLAN_YYYYMMDD-HHMM__your_plan.md
```

**4. Process Approval (Human-in-the-Loop):**

```bash
# MANUALLY move ACTION file from Pending_Approval/ to Approved/ or Rejected/

# Then process approval decision
python3 brain_monitor_approvals_skill.py
```

**5. Execute with Dry-Run (Preview):**

```bash
# Dry-run is DEFAULT (no --dry-run flag needed)
python3 brain_execute_with_mcp_skill.py \
  --plan Plans/PLAN_YYYYMMDD-HHMM__your_plan.md

# Shows email preview without sending
```

**6. Execute for Real:**

```bash
# REQUIRES explicit --execute flag
python3 brain_execute_with_mcp_skill.py \
  --plan Plans/PLAN_YYYYMMDD-HHMM__your_plan.md \
  --execute

# Sends actual email via Gmail API
```

**7. View Logs:**

```bash
# MCP action logs (JSON format)
tail -n 10 Logs/mcp_actions.log

# System log (Markdown format)
tail -n 20 system_log.md

# Daily summary
cat Daily_Summaries/$(date +%Y-%m-%d).md
```

### Troubleshooting: Simulation vs Real Mode

**How to tell if you're in simulation mode:**

1. **Check terminal output:**
   - ❌ **Simulation:** `SIMULATED: Email sent to...`
   - ✅ **Real:** `Email sent to...` (no "SIMULATED" prefix)

2. **Check MCP action log:**
   ```bash
   tail -n 1 Logs/mcp_actions.log | python3 -m json.tool
   ```
   - ❌ **Simulation:** `"mode": "execute"`, but `"response_summary": "SIMULATED: ..."`
   - ✅ **Real:** `"mode": "execute"`, `"response_summary": "Email sent to..."`, `"duration_ms": 1000+` (real API calls take longer)

3. **Check Gmail inbox:**
   - ✅ **Real:** Email actually appears in recipient's inbox

**If stuck in simulation mode:**

1. **Verify Gmail libraries installed:**
   ```bash
   python3 -c "from googleapiclient.discovery import build; print('OK')"
   # If ImportError → run: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
   ```

2. **Verify credentials exist:**
   ```bash
   ls -la .secrets/
   # Should show: gmail_credentials.json and gmail_token.json
   ```

3. **Re-authenticate:**
   ```bash
   # Remove old token
   rm .secrets/gmail_token.json

   # Re-authenticate
   python3 gmail_api_helper.py --check-auth
   ```

4. **Check plan status:**
   ```bash
   # Plan must be status: Approved (not Draft or Pending_Approval)
   grep "Status:" Plans/PLAN_*.md
   ```

---

## 🚀 Quick Start (Legacy - Bronze Tier)

### 1. Run the Filesystem Watcher

```bash
# Test mode (preview without changes)
python watcher_skill.py --dry-run

# Single scan (recommended for Bronze)
python watcher_skill.py --once

# Continuous monitoring
python watcher_skill.py --loop --interval 10

# Automation-friendly (quiet mode)
python watcher_skill.py --quiet --no-banner --no-color

# Debug mode
python watcher_skill.py --verbose --dry-run
```

### 2. Process Tasks with Claude

**Process Inbox:**
```
"Process my inbox"
```

**Start Work on a Task:**
```
"Start work on [task name]"
```

**Approve a Task:**
```
"Approve [task]"
```

**Complete a Task:**
```
"Complete [task]"
```

---

## ⏰ Windows Task Scheduler Automation (Silver Tier)

The Silver Tier includes scheduled automation for autonomous operation. Tasks run at regular intervals without manual intervention.

### Scheduled Tasks

| Task | Frequency | Purpose |
|------|-----------|---------|
| **Filesystem Watcher** | Every 5 minutes | Monitor Needs_Action/ for new tasks |
| **Gmail Watcher** | Every 10 minutes | Check inbox for new messages |
| **Approval Monitor** | Every 3 minutes | Process approval/rejection decisions |
| **Daily Summary** | Daily at 8 PM UTC | Generate system activity report |

### Setup Instructions (GUI Method)

1. **Open Task Scheduler**
   - Press `Win + R`
   - Type `taskschd.msc`
   - Press Enter

2. **Import Task XML Files**
   - Click "Action" → "Import Task..."
   - Navigate to: `Personal AI Employee/Scheduled/`
   - Import each XML file:
     - `filesystem_watcher_task.xml`
     - `gmail_watcher_task.xml`
     - `approval_monitor_task.xml`
     - `daily_summary_task.xml`

3. **Verify Task Settings**
   - Check "Triggers" tab: Verify schedule intervals
   - Check "Actions" tab: Ensure Python path is correct
   - Check "Conditions" tab: Disable "Start only if on AC power" if needed
   - Click "OK" to save

4. **Test Scheduled Tasks**
   - Right-click task → "Run"
   - Check `Logs/scheduler.log` for execution results

### Setup Instructions (PowerShell Method)

```powershell
# Navigate to project directory
cd "E:\Certified Cloud Native Generative and Agentic AI Engineer\Q4 part 2\Q4 part 2\Hackathon-0\Personal AI Employee"

# Import all scheduled tasks
schtasks /Create /TN "PersonalAIEmployee\FilesystemWatcher" /XML "Scheduled\filesystem_watcher_task.xml" /F
schtasks /Create /TN "PersonalAIEmployee\GmailWatcher" /XML "Scheduled\gmail_watcher_task.xml" /F
schtasks /Create /TN "PersonalAIEmployee\ApprovalMonitor" /XML "Scheduled\approval_monitor_task.xml" /F
schtasks /Create /TN "PersonalAIEmployee\DailySummary" /XML "Scheduled\daily_summary_task.xml" /F

# Verify tasks are registered
schtasks /Query /TN "PersonalAIEmployee\FilesystemWatcher"
schtasks /Query /TN "PersonalAIEmployee\GmailWatcher"
schtasks /Query /TN "PersonalAIEmployee\ApprovalMonitor"
schtasks /Query /TN "PersonalAIEmployee\DailySummary"

# Test run (optional)
schtasks /Run /TN "PersonalAIEmployee\FilesystemWatcher"
```

### Monitoring Scheduled Tasks

**View Scheduler Logs:**
```bash
# View last 50 entries
tail -n 50 Logs/scheduler.log

# Monitor in real-time
tail -f Logs/scheduler.log
```

**Task Manager:**
```powershell
# List all PersonalAIEmployee tasks
schtasks /Query /FO LIST /TN "PersonalAIEmployee\*"

# Disable a task
schtasks /Change /TN "PersonalAIEmployee\GmailWatcher" /DISABLE

# Enable a task
schtasks /Change /TN "PersonalAIEmployee\GmailWatcher" /ENABLE

# Delete a task
schtasks /Delete /TN "PersonalAIEmployee\GmailWatcher" /F
```

### Troubleshooting

**Task Not Running:**
1. Check Task Scheduler History tab
2. Verify Python is in system PATH
3. Check working directory path in XML
4. Review `Logs/scheduler.log` for errors

**Permission Issues:**
1. Right-click task → Properties
2. Click "Change User or Group..."
3. Ensure user has appropriate permissions
4. Try "Run whether user is logged on or not"

**Crash Loops:**
- The `scheduler_runner.py` wrapper prevents crash loops
- All exceptions are logged to `Logs/scheduler.log`
- Tasks timeout after 5-10 minutes (defined in XML)

---

## 📋 Watcher CLI Flags

| Flag | Description |
|------|-------------|
| `--once` | Run once and exit (default) |
| `--loop` | Continuous monitoring mode |
| `--interval N` | Loop interval in seconds (default: 10) |
| `--dry-run` | Preview changes without executing |
| `--quiet` | Minimal output (errors only) |
| `--verbose` | Detailed debug output |
| `--no-banner` | Skip header (for scripts) |
| `--no-color` | Disable ANSI colors |
| `--vault PATH` | Custom vault root path |

---

## 🔄 Task Workflow

```
1. Drop file into Inbox/ folder
   ↓
2. Run watcher (or ask Claude to "process my inbox")
   ↓
3. Watcher creates intake markdown wrapper
   ↓
4. Claude triages item:
   - Actionable → Needs_Action/
   - Complete → Done/
   - Needs clarification → stays in Inbox
   ↓
5. Ask Claude to "start work on [task]"
   ↓
6. Claude executes task and creates deliverable
   ↓
7. If approval needed → presents for review
   ↓
8. On approval → finalizes and moves to Done/
```

---

## 📁 Vault Structure

```
personal-ai-employee/
│
├── 📊 Dashboard.md                    # System status and workflow overview
├── 📖 Company_Handbook.md             # Skills, governance, operating loops
├── 🐍 watcher_skill.py                # Filesystem watcher (premium CLI)
├── 📝 system_log.md                   # Audit trail (gitignored for privacy)
│
├── 📥 Inbox/                          # New items awaiting triage
│   ├── .gitkeep
│   └── (task files - gitignored)
│
├── 🎯 Needs_Action/                   # Active tasks
│   ├── .gitkeep
│   └── (task files - gitignored)
│
├── ✅ Done/                           # Completed tasks
│   ├── .gitkeep
│   └── (task files - gitignored)
│
├── 📑 Plans/                          # Planning documents
│   ├── .gitkeep
│   └── (plan files - gitignored)
│
└── 📋 Logs/                           # System logs
    ├── watcher.log                    # Watcher activity log (gitignored)
    └── .gitkeep
```

---

## 🎨 Features

### Bronze Tier Capabilities

✅ **Filesystem Watcher**
- Auto-detect new files in Inbox
- Create intake markdown wrappers
- Non-destructive (preserves originals)
- Premium CLI UX with ANSI colors

✅ **Task Processing**
- Intelligent triage (actionable vs. informational)
- Priority assignment (P0/P1/P2)
- Structured task format with audit trails

✅ **End-to-End Execution**
- Read task requirements fully
- Create deliverables (drafts, plans, copy, analysis)
- Approval gates for external actions
- Complete with outcome documentation

✅ **Governance**
- Bronze Tier safety rules (non-destructive)
- Approval required for external communication
- Full audit trails (system_log.md + task change logs)
- Version-controlled task history

---

## 🎯 Agent Skills

| Skill | Purpose |
|-------|---------|
| `setup_vault` | Initialize or repair vault structure |
| `intake_to_inbox` | Convert raw input into structured inbox item |
| `triage_inbox_item` | Process inbox item and route to appropriate stage |
| `update_dashboard` | Refresh Dashboard.md with current system state |
| `close_task_to_done` | Mark task as complete and archive |
| `watcher_skill` | Automated inbox monitoring (Python script) |
| `brain_process_inbox_batch` | Process all inbox items |
| `brain_process_single_item` | Triage one inbox item |
| `brain_start_work` | Begin execution on a task |
| `brain_execute_task` | Produce the deliverable |
| `brain_finalize_and_close` | Complete and archive task |

---

## 🔒 Privacy & Security

- **Task content is gitignored** - Only vault structure and code are committed
- **Logs are gitignored** - system_log.md and watcher.log stay local
- **No secrets committed** - .env, credentials, API keys excluded
- **Approval gates** - External actions require user approval
- **Audit trails** - All operations logged for transparency

---

## 🌟 Hackathon 0 Highlights

**What Makes This Special:**

1. **Markdown-Native** - Everything is version-controllable, portable, human-readable
2. **Premium CLI UX** - Professional terminal output (ANSI colors, stats, summaries)
3. **Standard Library Only** - No external dependencies (Python stdlib + Claude)
4. **Windows Compatible** - ANSI colors auto-enabled via ctypes
5. **Bronze-Safe** - Non-destructive, approval-gated, fully audited
6. **Real Deliverables** - Not just plans—actual work products

**First End-to-End Task:** Instagram caption for café Eid post (drafted, approved, finalized) ✅

---

## 📚 Documentation

- **Company_Handbook.md** - Complete system documentation
  - 15 agent skills defined
  - 5 operating loops
  - Governance rules
  - Standard task format
  - Approval gate logic

- **Dashboard.md** - Live system status
  - Workflow counts (Inbox, Needs_Action, Done)
  - Top priorities
  - Recently completed tasks
  - Watcher status

---

## 🚧 Roadmap

- ✅ **Bronze Tier** - Foundation + Execution (COMPLETE)
- ✅ **Silver Tier** - MCP + Human-in-the-Loop Approvals (COMPLETE) ⭐
  - Gmail watcher with OAuth2
  - Plan-first workflow with 12-section template
  - File-based approval pipeline
  - Real Gmail API integration (verified)
  - Windows Task Scheduler automation
  - Daily summaries with metrics
- ⏳ **Gold Tier** - Multi-Agent + Adaptive (PLANNED)

---

## 🤝 Contributing

This is a Hackathon 0 project. The system is designed to be extended with Silver and Gold tier capabilities in future iterations.

**Branch Strategy:**
- `main` - Stable, working system
- `bronze-tier` - Bronze Tier implementation (historical)
- `silver-tier` - (Future) Automation features
- `gold-tier` - (Future) Autonomous capabilities

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎓 Built With

- [Claude Code CLI](https://claude.com/claude-code) - AI-powered development assistant
- [Claude Sonnet 4.5](https://anthropic.com) - Reasoning and execution engine
- Python 3 - Filesystem watcher implementation
- Markdown - Vault format and documentation

---

**Note:** Bronze Tier is an **operational mode** (capability level), not a folder name. The vault root contains all system files.

---

Made with ❤️ for Hackathon 0 | Powered by Claude Code
