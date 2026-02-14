# Personal AI Employee — Hackathon 0

> **Bronze Tier (Foundation + Execution)**
> A markdown-based AI employee system powered by Claude Code CLI

---

## 🎯 Overview

The Personal AI Employee is a Bronze Tier system that manages tasks end-to-end through a structured markdown vault. It combines filesystem monitoring, intelligent task triage, and end-to-end execution with built-in approval gates.

**Bronze Tier** is an **operational mode**, not a folder. It represents the foundation capability level: safe, deterministic, and non-destructive.

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

## 🚀 Quick Start

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
- ⏳ **Silver Tier** - Automation + Intelligence (PLANNED)
- ⏳ **Gold Tier** - Autonomous + Adaptive (PLANNED)

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
