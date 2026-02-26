# Gold Tier Tasks — Complete Implementation Breakdown

**Feature**: Gold Tier — Multi-Channel Social + Odoo Accounting + CEO Briefing + Ralph Loop
**Branch**: `001-gold-tier-full`
**Spec**: `specs/001-gold-tier-full/spec.md`
**Plan**: `specs/001-gold-tier-full/plan.md`
**Total Estimated Duration**: 43-56 hours (realistic: 50h)

**Architecture**: Perception → Plan → Approval → Action → Logging
**Critical Path**: G-M1 → G-M2 → G-M3 → G-M4 → G-M6 → G-M8

---

## Task Organization

Tasks are grouped by milestone (G-M1 through G-M8) and must be executed in strict dependency order. Each task follows this format:

**Task ID**: G-M<milestone>-T<number> (e.g., G-M1-T01)
**Description**: Short description
**Files to Create/Modify**: Specific file paths
**Agent Skills Involved**: Agent skills used (if any)
**Acceptance Criteria**: Clear success conditions
**Test Steps**: How to verify completion
**Failure Simulation**: Error scenarios to test (if applicable)
**Suggested Commit Message**: Commit message template
**Rollback Note**: How to revert changes

**Legend**:
- 🔑 = Requires external API credentials
- 🔧 = Requires MCP server setup
- 📅 = Requires scheduling configuration
- 🎭 = Can run in mock mode first

---

## G-M1: Vault + Domain Expansion (2-3 hours)

**Objective**: Create cross-domain vault structure (Social/, Business/, MCP/) and intake wrapper templates without breaking Silver Tier paths.

### G-M1-T01: Create Social directory structure

**Description**: Create `Social/` directories: Inbox/, Summaries/, Analytics/ with README.md files explaining purpose of each.

**Files to Create**:
- `Social/Inbox/README.md`
- `Social/Summaries/README.md`
- `Social/Analytics/README.md`

**Agent Skills Involved**: None (infrastructure setup)

**Acceptance Criteria**:
- [ ] All 3 directories exist under `Social/`
- [ ] Each directory has README.md explaining purpose
- [ ] README files include examples of expected content

**Test Steps**:
1. Run `ls -la Social/` — verify 3 subdirectories exist
2. Run `cat Social/Inbox/README.md` — verify content describes intake wrapper storage
3. Verify Social/ does not break existing Silver paths (Pending_Approval/, Approved/, etc.)

**Failure Simulation**: N/A (directory creation cannot fail)

**Suggested Commit Message**: `feat(gold): G-M1-T01 create Social directory structure`

**Rollback Note**: `git revert <commit>` (safe, no dependencies)

---

### G-M1-T02: Create Business directory structure

**Description**: Create `Business/` directories: Goals/, Briefings/, Accounting/, Clients/, Invoices/ with README.md files.

**Files to Create**:
- `Business/Goals/README.md`
- `Business/Briefings/README.md`
- `Business/Accounting/README.md`
- `Business/Clients/README.md` (optional)
- `Business/Invoices/README.md` (optional)

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] All directories exist under `Business/`
- [ ] Each has README.md explaining purpose
- [ ] Goals/ README includes strategic objective examples
- [ ] Briefings/ README includes CEO briefing format overview

**Test Steps**:
1. Run `ls -la Business/` — verify all subdirectories exist
2. Run `cat Business/Goals/README.md` — verify content describes strategic objectives storage

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M1-T02 create Business directory structure`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M1-T03: Create MCP directory structure

**Description**: Create `MCP/` directory with README.md explaining MCP registry snapshots and server notes.

**Files to Create**:
- `MCP/README.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] `MCP/` directory exists
- [ ] README.md explains MCP tool snapshot storage
- [ ] README.md includes example snapshot file structure

**Test Steps**:
1. Run `ls -la MCP/` — verify directory exists
2. Run `cat MCP/README.md` — verify content explains purpose

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M1-T03 create MCP directory structure`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M1-T04: Create social intake wrapper template

**Description**: Create YAML frontmatter template for social intake wrappers with strict schema: id, source, received_at, sender/handle, channel, thread_id, excerpt, status, plan_required, pii_redacted.

**Files to Create**:
- `templates/social_intake_wrapper_template.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Template file created with all required YAML fields
- [ ] Field descriptions included as comments
- [ ] Example values provided for each field
- [ ] PII redaction flag documented

**Test Steps**:
1. Run `cat templates/social_intake_wrapper_template.md` — verify YAML frontmatter structure
2. Create test intake wrapper from template, verify YAML parses correctly with Python yaml library
3. Verify all 9 required fields present (id, source, received_at, sender, channel, thread_id, excerpt, status, plan_required, pii_redacted)

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M1-T04 create social intake wrapper template`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M1-T05: Create CEO briefing template

**Description**: Create template for weekly CEO briefing with 8 required sections: KPIs, Wins, Risks, Outstanding Invoices + AR Aging, Social Performance, Next Week Priorities, Pending Approvals, Summary.

**Files to Create**:
- `templates/ceo_briefing_template.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Template file created with all 8 sections
- [ ] Each section has placeholder text and examples
- [ ] Template references data sources (Business/Goals, system_log.md, Social/Analytics, Odoo queries)
- [ ] Markdown formatting consistent

**Test Steps**:
1. Run `cat templates/ceo_briefing_template.md` — verify all 8 sections present
2. Verify section headers match spec requirements
3. Verify placeholder text provides guidance

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M1-T05 create CEO briefing template`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M1-T06: Update .gitignore for Gold Tier

**Description**: Add Gold Tier patterns to .gitignore: `Logs/mcp_tools_snapshot_*.json`, `.secrets/`, `Logs/*.log` (if not already present).

**Files to Modify**:
- `.gitignore`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] `.gitignore` includes MCP snapshot pattern
- [ ] `.secrets/` directory pattern present
- [ ] Log file patterns present
- [ ] No duplicate entries

**Test Steps**:
1. Run `grep "mcp_tools_snapshot" .gitignore` — verify pattern exists
2. Run `grep ".secrets/" .gitignore` — verify pattern exists
3. Create test file `Logs/mcp_tools_snapshot_test.json`, run `git status` — verify ignored

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M1-T06 update gitignore for Gold patterns`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M1-T07: Update Dashboard.md with Gold section placeholders

**Description**: Add Gold Tier section headers to Dashboard.md: Social Channel Status, Accounting Status, MCP Registry Status, Latest Social Summary, Latest CEO Briefing, Last External Action.

**Files to Modify**:
- `Dashboard.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Dashboard.md has Gold Tier section
- [ ] 6 subsection headers present
- [ ] Placeholder text for each section (e.g., "No social channels configured yet")
- [ ] Links to documentation

**Test Steps**:
1. Run `cat Dashboard.md | grep "Social Channel Status"` — verify header exists
2. Verify all 6 Gold subsections present
3. Verify markdown formatting consistent with Silver sections

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M1-T07 update Dashboard with Gold placeholders`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M1-T08: Manual test vault structure

**Description**: Create one sample social intake wrapper from template to validate YAML frontmatter parsing and directory structure.

**Files to Create** (temporary test file, can be deleted after):
- `Social/Inbox/test_intake_wrapper.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Sample intake wrapper created using template
- [ ] YAML frontmatter parses without errors
- [ ] All required fields populated
- [ ] File can be read by Python yaml library

**Test Steps**:
1. Copy `templates/social_intake_wrapper_template.md` to `Social/Inbox/test_intake_wrapper.md`
2. Fill in example values
3. Run Python script to parse YAML frontmatter: `python -c "import yaml; print(yaml.safe_load(open('Social/Inbox/test_intake_wrapper.md').read().split('---')[1]))"`
4. Verify no parsing errors
5. Delete test file after validation

**Failure Simulation**: Invalid YAML → verify parser detects error

**Suggested Commit Message**: N/A (test only, do not commit test file)

**Rollback Note**: Delete test file

---

### G-M1 Completion Checklist

**Definition of Done**:
- [ ] All directories exist with README.md files (Social/, Business/, MCP/)
- [ ] YAML frontmatter templates created and validated
- [ ] `.gitignore` updated with Gold patterns
- [ ] Dashboard.md has Gold section placeholders
- [ ] Manual test: Create one sample social intake wrapper from template — YAML parses correctly

**Git Commit** (after all G-M1 tasks complete):
```
feat(gold): G-M1 vault expansion + templates

Objective: Create cross-domain vault structure and intake wrapper templates.

Tasks completed:
- G-M1-T01: Created Social/ directories (Inbox, Summaries, Analytics)
- G-M1-T02: Created Business/ directories (Goals, Briefings, Accounting)
- G-M1-T03: Created MCP/ directory
- G-M1-T04: Created social intake wrapper template
- G-M1-T05: Created CEO briefing template
- G-M1-T06: Updated .gitignore for Gold patterns
- G-M1-T07: Updated Dashboard.md with Gold placeholders
- G-M1-T08: Manual test vault structure

Files created:
- Social/Inbox/README.md, Social/Summaries/README.md, Social/Analytics/README.md
- Business/Goals/README.md, Business/Briefings/README.md, Business/Accounting/README.md
- MCP/README.md
- templates/social_intake_wrapper_template.md
- templates/ceo_briefing_template.md

Files modified:
- .gitignore
- Dashboard.md

Definition of Done:
[X] All checklist items complete

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## G-M2: MCP Registry + Reliability Core (4-5 hours)

**Objective**: Implement MCP tool discovery, failure handling, and rate limiting infrastructure before integrating any MCP servers.

### G-M2-T01: Create mcp_helpers.py with PII redaction

**Description**: Implement `redact_pii(text)` function with regex patterns for emails and phone numbers.

**Files to Create**:
- `mcp_helpers.py`

**Agent Skills Involved**: None (utility library)

**Acceptance Criteria**:
- [ ] Function `redact_pii(text)` exists
- [ ] Redacts email addresses (pattern: `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b`)
- [ ] Redacts phone numbers (pattern: `\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}`)
- [ ] Returns redacted text with `[EMAIL_REDACTED]` and `[PHONE_REDACTED]` placeholders
- [ ] Handles edge cases (multiple emails/phones in one string)

**Test Steps**:
1. Create unit test: `test_redact_pii_email()` — verify `"Contact john@example.com"` → `"Contact [EMAIL_REDACTED]"`
2. Create unit test: `test_redact_pii_phone()` — verify `"Call +1-555-123-4567"` → `"Call [PHONE_REDACTED]"`
3. Create unit test: `test_redact_pii_multiple()` — verify multiple PII instances redacted
4. Run tests: `pytest tests/test_mcp_helpers.py::test_redact_pii_*`

**Failure Simulation**: N/A (pure function)

**Suggested Commit Message**: `feat(gold): G-M2-T01 implement PII redaction in mcp_helpers`

**Rollback Note**: `git revert <commit>` (safe, no dependencies)

---

### G-M2-T02: Add rate_limit_and_backoff to mcp_helpers.py

**Description**: Implement `rate_limit_and_backoff(func, max_retries=4)` decorator for HTTP 429 handling with exponential backoff.

**Files to Modify**:
- `mcp_helpers.py`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Function `rate_limit_and_backoff(func, max_retries=4)` exists
- [ ] Detects HTTP 429 responses
- [ ] Implements exponential backoff: 1s, 2s, 4s, 8s
- [ ] Raises exception after max retries exceeded
- [ ] Logs retry attempts

**Test Steps**:
1. Create unit test with mock HTTP client returning 429
2. Verify backoff delays applied (1s, 2s, 4s, 8s)
3. Verify exception raised after 4 retries
4. Run `pytest tests/test_mcp_helpers.py::test_rate_limit_*`

**Failure Simulation**: HTTP 429 → verify exponential backoff applied

**Suggested Commit Message**: `feat(gold): G-M2-T02 add rate limiting with backoff`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M2-T03: Add check_disk_space to mcp_helpers.py

**Description**: Implement `check_disk_space(min_free_mb=100)` function to verify sufficient disk space before file operations.

**Files to Modify**:
- `mcp_helpers.py`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Function `check_disk_space(min_free_mb=100)` exists
- [ ] Returns True if free space >= min_free_mb
- [ ] Returns False if free space < min_free_mb
- [ ] Uses `shutil.disk_usage()` for cross-platform compatibility

**Test Steps**:
1. Create unit test: `test_check_disk_space_sufficient()` — mock disk usage, verify returns True
2. Create unit test: `test_check_disk_space_insufficient()` — mock low disk, verify returns False
3. Run `pytest tests/test_mcp_helpers.py::test_check_disk_space_*`

**Failure Simulation**: Low disk space → verify function returns False

**Suggested Commit Message**: `feat(gold): G-M2-T03 add disk space check utility`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M2-T04: Implement brain_mcp_registry_refresh_skill.py (core logic)

**Description**: Create skill that queries all configured MCP servers for tool lists and saves snapshots to `Logs/mcp_tools_snapshot_<server>.json`.

**Files to Create**:
- `brain_mcp_registry_refresh_skill.py`

**Agent Skills Involved**: `brain_mcp_registry_refresh`

**Acceptance Criteria**:
- [ ] CLI supports `--dry-run` flag
- [ ] Queries all MCP servers listed in configuration (initially empty list)
- [ ] Saves tool snapshot to `Logs/mcp_tools_snapshot_<server>.json` for each server
- [ ] Logs success/failure to `Logs/mcp_registry.log` and `system_log.md`
- [ ] Handles server unreachable gracefully (log error, continue to next server)

**Test Steps**:
1. Create mock MCP server with test tool list
2. Run `brain_mcp_registry_refresh --dry-run` — verify no files created
3. Run `brain_mcp_registry_refresh` (real mode with mock server) — verify snapshot created
4. Verify snapshot JSON format matches expected structure
5. Simulate server down, verify error logged + continues

**Failure Simulation**: MCP server unreachable → verify graceful degradation (log + continue)

**Suggested Commit Message**: `feat(gold): G-M2-T04 implement MCP registry refresh skill`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M2-T05: Update Dashboard.md with MCP Registry Status logic

**Description**: Extend brain_mcp_registry_refresh to update Dashboard.md with "MCP Registry Status" table showing server reachability.

**Files to Modify**:
- `brain_mcp_registry_refresh_skill.py`
- `Dashboard.md`

**Agent Skills Involved**: `brain_mcp_registry_refresh`

**Acceptance Criteria**:
- [ ] Dashboard.md has "MCP Registry Status" section
- [ ] Table shows: Server Name, Status (Reachable/Unreachable), Last Refresh, Tool Count
- [ ] brain_mcp_registry_refresh updates table after each run
- [ ] Initial state: "No servers configured"

**Test Steps**:
1. Run `brain_mcp_registry_refresh` with mock servers
2. Run `cat Dashboard.md | grep "MCP Registry Status"` — verify table exists
3. Verify table shows correct server count and status
4. Simulate one server down, verify status updates to "Unreachable"

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M2-T05 add MCP registry status to Dashboard`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M2-T06: Implement brain_handle_mcp_failure_skill.py

**Description**: Create skill for standard MCP failure handling: log error + create remediation task + continue operations.

**Files to Create**:
- `brain_handle_mcp_failure_skill.py`

**Agent Skills Involved**: `brain_handle_mcp_failure`

**Acceptance Criteria**:
- [ ] CLI accepts: `--failure-type <type>`, `--server-name <name>`, `--error-message <msg>`
- [ ] Supports failure types: connection_timeout, auth_failure, rate_limit, server_error
- [ ] Logs error to `Logs/mcp_failures.log` (JSON format)
- [ ] Creates remediation task in `Needs_Action/` with format: `remediation__mcp__<server>__YYYYMMDD-HHMM.md`
- [ ] Appends entry to `system_log.md`

**Test Steps**:
1. Run `brain_handle_mcp_failure --failure-type connection_timeout --server-name whatsapp --error-message "Connection timeout after 30s"`
2. Verify remediation task created in `Needs_Action/`
3. Verify JSON log entry in `Logs/mcp_failures.log`
4. Verify system_log.md entry appended
5. Test all 4 failure types

**Failure Simulation**: N/A (pure logging/task creation)

**Suggested Commit Message**: `feat(gold): G-M2-T06 implement MCP failure handler skill`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M2-T07: Create Docs/mcp_tools_snapshot_example.json

**Description**: Create example MCP tool snapshot JSON file documenting expected format.

**Files to Create**:
- `Docs/mcp_tools_snapshot_example.json`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] JSON file with example tool list structure
- [ ] Includes: server_name, tools array (name, description, parameters, required)
- [ ] Includes timestamp and version fields
- [ ] Valid JSON (parses without errors)

**Test Steps**:
1. Run `cat Docs/mcp_tools_snapshot_example.json | jq .` — verify valid JSON
2. Verify structure matches brain_mcp_registry_refresh output format

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M2-T07 add MCP snapshot example`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M2-T08: Create Scheduled/mcp_registry_refresh_task.xml 📅

**Description**: Create Windows Task Scheduler XML template for daily MCP registry refresh at 2 AM UTC.

**Files to Create**:
- `Scheduled/mcp_registry_refresh_task.xml`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] XML file follows Windows Task Scheduler format
- [ ] Trigger: Daily at 2:00 AM UTC
- [ ] Action: Run `python brain_mcp_registry_refresh_skill.py`
- [ ] Logging enabled (task history)
- [ ] Includes import instructions in comments

**Test Steps**:
1. Validate XML schema (well-formed)
2. Import task: `schtasks /Create /XML Scheduled/mcp_registry_refresh_task.xml /TN "PAI_MCP_Registry_Refresh"`
3. Verify task appears in Task Scheduler
4. Run manually: `schtasks /Run /TN "PAI_MCP_Registry_Refresh"`
5. Verify logs created

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M2-T08 add MCP registry refresh scheduled task`

**Rollback Note**: `git revert <commit>` + delete imported task

---

### G-M2 Completion Checklist

**Definition of Done**:
- [ ] `mcp_helpers.py` implemented with 100% test coverage for PII redaction
- [ ] `brain_mcp_registry_refresh` works with mock MCP server
- [ ] `brain_handle_mcp_failure` creates remediation tasks
- [ ] Dashboard.md shows "MCP Registry Status: No servers configured"
- [ ] Scheduled task XML validated and importable

**Git Commit** (after all G-M2 tasks complete):
```
feat(gold): G-M2 MCP registry + reliability core

Objective: Implement MCP tool discovery, failure handling, and rate limiting infrastructure.

Tasks completed:
- G-M2-T01: PII redaction in mcp_helpers.py
- G-M2-T02: Rate limiting with exponential backoff
- G-M2-T03: Disk space check utility
- G-M2-T04: MCP registry refresh skill
- G-M2-T05: Dashboard MCP registry status
- G-M2-T06: MCP failure handler skill
- G-M2-T07: MCP snapshot example documentation
- G-M2-T08: MCP registry scheduled task

Files created:
- mcp_helpers.py
- brain_mcp_registry_refresh_skill.py
- brain_handle_mcp_failure_skill.py
- Docs/mcp_tools_snapshot_example.json
- Scheduled/mcp_registry_refresh_task.xml
- tests/test_mcp_helpers.py

Files modified:
- Dashboard.md

Tests passing:
- test_redact_pii_email, test_redact_pii_phone, test_redact_pii_multiple
- test_rate_limit_backoff, test_check_disk_space

Definition of Done:
[X] All checklist items complete

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## G-M3: Social Watchers (WhatsApp, LinkedIn, Twitter) (8-10 hours)

**Objective**: Implement 3 social watchers following BaseWatcher pattern, with mock mode for testing and real API integration (optional).

### G-M3-T01: Create WhatsApp mock fixture 🎭

**Description**: Create mock fixture JSON file with example WhatsApp messages for testing.

**Files to Create**:
- `tests/fixtures/whatsapp_mock.json`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] JSON file with 3-5 example WhatsApp messages
- [ ] Each message includes: id, sender (phone number), body, timestamp, thread_id
- [ ] Phone numbers use fake format (e.g., +1-555-xxx-xxxx)
- [ ] Valid JSON

**Test Steps**:
1. Run `cat tests/fixtures/whatsapp_mock.json | jq .` — verify valid JSON
2. Verify structure matches expected WhatsApp message format

**Failure Simulation**: N/A

**Suggested Commit Message**: `test(gold): G-M3-T01 add WhatsApp mock fixture`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M3-T02: Implement whatsapp_watcher_skill.py 🎭🔑🔧

**Description**: Implement WhatsApp watcher following BaseWatcher pattern with CLI flags: `--once`, `--dry-run`, `--mock`.

**Files to Create**:
- `whatsapp_watcher_skill.py`

**Agent Skills Involved**: `whatsapp_watcher`

**Acceptance Criteria**:
- [ ] Follows BaseWatcher pattern from Silver Tier
- [ ] CLI flags: `--once`, `--dry-run`, `--mock`
- [ ] Mock mode reads `tests/fixtures/whatsapp_mock.json`
- [ ] Creates intake wrappers in `Social/Inbox/` with naming: `inbox__whatsapp__YYYYMMDD-HHMM__<sender>.md`
- [ ] YAML frontmatter includes all 9 required fields
- [ ] Redacts phone numbers using `mcp_helpers.redact_pii()`
- [ ] Logs to `Logs/whatsapp_watcher.log` and `system_log.md`
- [ ] Checkpoint file: `Logs/whatsapp_watcher_checkpoint.json` (prevents duplicates)

**Test Steps**:
1. Run `python whatsapp_watcher_skill.py --mock --once --dry-run` — verify no files created
2. Run `python whatsapp_watcher_skill.py --mock --once` — verify intake wrapper created in `Social/Inbox/`
3. Verify YAML frontmatter parses correctly
4. Verify phone numbers redacted in excerpt
5. Verify checkpoint file updated
6. Run again with `--once`, verify no duplicates created
7. Verify logs written to `Logs/whatsapp_watcher.log`

**Failure Simulation**:
- Mock fixture missing → verify error logged + exit gracefully
- Invalid JSON → verify validation error + exit

**Suggested Commit Message**: `feat(gold): G-M3-T02 implement WhatsApp watcher skill`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M3-T03: Create LinkedIn mock fixture 🎭

**Description**: Create mock fixture JSON file with example LinkedIn notifications and messages.

**Files to Create**:
- `tests/fixtures/linkedin_mock.json`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] JSON file with 3-5 example LinkedIn items (posts, comments, messages, notifications)
- [ ] Each item includes: id, type (post/comment/message/notification), sender (profile URL), body, timestamp, post_id/comment_id
- [ ] Valid JSON

**Test Steps**:
1. Run `cat tests/fixtures/linkedin_mock.json | jq .` — verify valid JSON
2. Verify structure matches expected LinkedIn API format

**Failure Simulation**: N/A

**Suggested Commit Message**: `test(gold): G-M3-T03 add LinkedIn mock fixture`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M3-T04: Implement linkedin_watcher_skill.py 🎭🔑🔧

**Description**: Implement LinkedIn watcher following BaseWatcher pattern with mock mode support.

**Files to Create**:
- `linkedin_watcher_skill.py`

**Agent Skills Involved**: `linkedin_watcher`

**Acceptance Criteria**:
- [ ] Follows BaseWatcher pattern
- [ ] CLI flags: `--once`, `--dry-run`, `--mock`
- [ ] Mock mode reads `tests/fixtures/linkedin_mock.json`
- [ ] Creates intake wrappers: `inbox__linkedin__YYYYMMDD-HHMM__<sender>.md`
- [ ] YAML frontmatter with LinkedIn-specific metadata (post_id, comment_id, profile_url)
- [ ] Redacts emails using `mcp_helpers.redact_pii()`
- [ ] Logs to `Logs/linkedin_watcher.log` and `system_log.md`
- [ ] Checkpoint: `Logs/linkedin_watcher_checkpoint.json`

**Test Steps**:
1. Run `python linkedin_watcher_skill.py --mock --once --dry-run` — verify no files
2. Run `python linkedin_watcher_skill.py --mock --once` — verify intake wrapper created
3. Verify YAML frontmatter includes LinkedIn-specific fields
4. Verify emails redacted
5. Verify checkpoint prevents duplicates
6. Verify logs

**Failure Simulation**:
- Mock fixture missing → verify graceful error
- Invalid JSON → verify validation error

**Suggested Commit Message**: `feat(gold): G-M3-T04 implement LinkedIn watcher skill`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M3-T05: Create Twitter mock fixture 🎭

**Description**: Create mock fixture JSON file with example Twitter mentions and DMs.

**Files to Create**:
- `tests/fixtures/twitter_mock.json`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] JSON file with 3-5 example Twitter items (mentions, DMs, keyword searches)
- [ ] Each item includes: id, type (mention/dm/search), handle, text (max 280 chars), timestamp, tweet_id
- [ ] Valid JSON

**Test Steps**:
1. Run `cat tests/fixtures/twitter_mock.json | jq .` — verify valid JSON
2. Verify structure matches expected Twitter API v2 format

**Failure Simulation**: N/A

**Suggested Commit Message**: `test(gold): G-M3-T05 add Twitter mock fixture`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M3-T06: Implement twitter_watcher_skill.py 🎭🔑🔧

**Description**: Implement Twitter watcher following BaseWatcher pattern with mock mode support.

**Files to Create**:
- `twitter_watcher_skill.py`

**Agent Skills Involved**: `twitter_watcher`

**Acceptance Criteria**:
- [ ] Follows BaseWatcher pattern
- [ ] CLI flags: `--once`, `--dry-run`, `--mock`
- [ ] Mock mode reads `tests/fixtures/twitter_mock.json`
- [ ] Creates intake wrappers: `inbox__twitter__YYYYMMDD-HHMM__<handle>.md`
- [ ] Excerpt max 280 chars
- [ ] Redacts emails/phones
- [ ] Logs to `Logs/twitter_watcher.log` and `system_log.md`
- [ ] Checkpoint: `Logs/twitter_watcher_checkpoint.json`

**Test Steps**:
1. Run `python twitter_watcher_skill.py --mock --once --dry-run` — verify no files
2. Run `python twitter_watcher_skill.py --mock --once` — verify intake wrapper created
3. Verify excerpt length <= 280 chars
4. Verify PII redacted
5. Verify checkpoint prevents duplicates
6. Verify logs

**Failure Simulation**:
- Mock fixture missing → verify graceful error
- Invalid JSON → verify validation error

**Suggested Commit Message**: `feat(gold): G-M3-T06 implement Twitter watcher skill`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M3-T07: Create scheduled tasks for social watchers 📅

**Description**: Create Windows Task Scheduler XML templates for all 3 social watchers (5-10 minute intervals).

**Files to Create**:
- `Scheduled/whatsapp_watcher_task.xml`
- `Scheduled/linkedin_watcher_task.xml`
- `Scheduled/twitter_watcher_task.xml`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] 3 XML files created
- [ ] WhatsApp: every 5 minutes
- [ ] LinkedIn: every 10 minutes
- [ ] Twitter: every 10 minutes
- [ ] All use `--once` flag (run once per trigger)
- [ ] Include import instructions in comments

**Test Steps**:
1. Validate XML schemas (all 3 files well-formed)
2. Import tasks: `schtasks /Create /XML Scheduled/whatsapp_watcher_task.xml /TN "PAI_WhatsApp_Watcher"`
3. Verify tasks appear in Task Scheduler
4. Run manually (mock mode): `schtasks /Run /TN "PAI_WhatsApp_Watcher"`
5. Verify intake wrappers created
6. Repeat for LinkedIn and Twitter

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M3-T07 add social watcher scheduled tasks`

**Rollback Note**: `git revert <commit>` + delete imported tasks

---

### G-M3-T08: Update Dashboard.md with Social Channel Status

**Description**: Update Dashboard.md to show Social Channel Status table: Channel, Status, Last Check, Message Count, Latest Intake.

**Files to Modify**:
- `Dashboard.md`

**Agent Skills Involved**: None (manual update, later automated by watchers)

**Acceptance Criteria**:
- [ ] Dashboard.md has "Social Channel Status" section under Gold Tier
- [ ] Table columns: Channel, Status, Last Check, Message Count, Latest Intake
- [ ] Initial rows for WhatsApp, LinkedIn, Twitter with "Not configured" status
- [ ] Placeholder links to latest intake wrappers

**Test Steps**:
1. Run `cat Dashboard.md | grep "Social Channel Status"` — verify section exists
2. Verify table structure correct
3. Run watchers in mock mode, manually update table, verify links work

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M3-T08 add Social Channel Status to Dashboard`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M3-T09: Integration test all 3 watchers in mock mode 🎭

**Description**: Run all 3 social watchers in mock mode, verify intake wrappers created, checkpoints prevent duplicates, PII redacted, logs written.

**Files to Create**: None (test execution)

**Agent Skills Involved**: All 3 watcher skills

**Acceptance Criteria**:
- [ ] All 3 watchers run without errors in mock mode
- [ ] Intake wrappers created in `Social/Inbox/` for each channel
- [ ] YAML frontmatter parses correctly for all
- [ ] PII redacted in all excerpts
- [ ] Checkpoints prevent duplicates (run twice, verify no new files)
- [ ] Logs written to `Logs/<watcher>.log` and `system_log.md`
- [ ] Dashboard.md can be manually updated with results

**Test Steps**:
1. Run `python whatsapp_watcher_skill.py --mock --once`
2. Run `python linkedin_watcher_skill.py --mock --once`
3. Run `python twitter_watcher_skill.py --mock --once`
4. Verify 3+ intake wrappers in `Social/Inbox/`
5. Run all 3 again with `--once`, verify no new files (checkpoint working)
6. Check PII redaction: `grep -r "@" Social/Inbox/` — verify no emails (all redacted)
7. Verify logs exist and contain entries

**Failure Simulation**:
- Disk space low → verify watchers skip file creation + log error

**Suggested Commit Message**: N/A (test only, results documented in test report)

**Rollback Note**: Delete test intake wrappers after validation

---

### G-M3 Completion Checklist

**Definition of Done**:
- [ ] All 3 watchers implemented with mock mode working
- [ ] Intake wrappers created with correct YAML frontmatter
- [ ] PII redaction working (100% for mock data)
- [ ] Checkpoints prevent duplicates
- [ ] Scheduled tasks import successfully
- [ ] Dashboard.md shows Social Channel Status with mock data

**Git Commit** (after all G-M3 tasks complete):
```
feat(gold): G-M3 social watchers (WhatsApp, LinkedIn, Twitter)

Objective: Implement 3 social watchers with mock mode for testing.

Tasks completed:
- G-M3-T01: WhatsApp mock fixture
- G-M3-T02: WhatsApp watcher skill
- G-M3-T03: LinkedIn mock fixture
- G-M3-T04: LinkedIn watcher skill
- G-M3-T05: Twitter mock fixture
- G-M3-T06: Twitter watcher skill
- G-M3-T07: Scheduled tasks for all watchers
- G-M3-T08: Dashboard Social Channel Status
- G-M3-T09: Integration test all watchers

Files created:
- whatsapp_watcher_skill.py, linkedin_watcher_skill.py, twitter_watcher_skill.py
- tests/fixtures/whatsapp_mock.json, linkedin_mock.json, twitter_mock.json
- Scheduled/whatsapp_watcher_task.xml, linkedin_watcher_task.xml, twitter_watcher_task.xml

Files modified:
- Dashboard.md

Tests passing:
- All 3 watchers create intake wrappers in mock mode
- PII redaction 100% for mock data
- Checkpoints prevent duplicates

Definition of Done:
[X] All checklist items complete

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## G-M4: Social MCP Execution Layer (6-8 hours)

**Objective**: Implement social MCP executor with dry-run default, approval gates, and multi-channel support (WhatsApp, LinkedIn, Twitter).

### G-M4-T01: Extend brain_create_plan for social action detection

**Description**: Extend brain_create_plan skill to detect social actions (whatsapp.send_message, linkedin.create_post, twitter.create_post) and generate plans with MCP tool references.

**Files to Modify**:
- `brain_create_plan_skill.py`

**Agent Skills Involved**: `brain_create_plan`

**Acceptance Criteria**:
- [ ] Detects social action patterns in intake wrapper or manual request
- [ ] Generates plan with MCP tool references (e.g., `whatsapp.reply_message`)
- [ ] Risk assessment: social actions = Medium risk (public visibility)
- [ ] Plan includes approval requirement flag
- [ ] Compatible with existing email action detection

**Test Steps**:
1. Create WhatsApp intake wrapper manually
2. Run `brain_create_plan` on wrapper
3. Verify plan generated with `whatsapp.reply_message` tool reference
4. Verify plan risk = Medium
5. Verify plan includes approval requirement
6. Test LinkedIn and Twitter detection similarly

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M4-T01 extend brain_create_plan for social actions`

**Rollback Note**: `git revert <commit>` (safe, extends existing skill)

---

### G-M4-T02: Implement brain_execute_social_with_mcp_skill.py 🔧

**Description**: Create skill for executing social MCP actions with dry-run default and explicit `--execute` flag requirement.

**Files to Create**:
- `brain_execute_social_with_mcp_skill.py`

**Agent Skills Involved**: `brain_execute_social_with_mcp`

**Acceptance Criteria**:
- [ ] CLI flags: `--plan-id <id>`, `--dry-run` (default), `--execute`
- [ ] Supports LinkedIn, Twitter, WhatsApp actions
- [ ] Dry-run mode shows preview without executing
- [ ] Explicit `--execute` flag required for real actions
- [ ] Reads approved plan from `Approved/`
- [ ] Calls appropriate MCP tool (whatsapp.send_message, linkedin.create_post, etc.)
- [ ] Logs to `Logs/mcp_actions.log` (JSON format)
- [ ] Updates plan status: `Approved` → `Executed` (or `Failed`)
- [ ] Moves plan to `Done/` on success

**Test Steps**:
1. Create social plan manually, move to `Approved/`
2. Run `brain_execute_social_with_mcp --plan-id <id> --dry-run` — verify preview shown, no real action
3. (IF MCP servers configured) Run with `--execute` — verify action executed
4. Verify JSON log in `Logs/mcp_actions.log` with full parameters
5. Verify plan moved to `Done/`
6. Test without approval → verify ERROR (approval gate enforced)

**Failure Simulation**:
- Execute without approval → verify ERROR
- MCP server down → verify `brain_handle_mcp_failure` invoked

**Suggested Commit Message**: `feat(gold): G-M4-T02 implement social MCP executor skill`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M4-T03: Create MCP tool contract for WhatsApp 🔧

**Description**: Create YAML contract documenting WhatsApp MCP tool signatures and parameters.

**Files to Create**:
- `specs/001-gold-tier-full/contracts/mcp_whatsapp.yaml`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] YAML file with all WhatsApp MCP tools documented
- [ ] Tools: whatsapp.send_message, whatsapp.reply_message, whatsapp.list_messages, whatsapp.get_message
- [ ] Each tool includes: name, description, parameters (name, type, required), return_type
- [ ] Examples for each tool
- [ ] Notes on authentication requirements

**Test Steps**:
1. Validate YAML schema (well-formed)
2. Verify all required tools documented
3. Verify parameter types match expected MCP format

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M4-T03 add WhatsApp MCP contract`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M4-T04: Create MCP tool contracts for LinkedIn and Twitter 🔧

**Description**: Create YAML contracts for LinkedIn and Twitter MCP tools.

**Files to Create**:
- `specs/001-gold-tier-full/contracts/mcp_linkedin.yaml`
- `specs/001-gold-tier-full/contracts/mcp_twitter.yaml`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] LinkedIn contract includes: linkedin.create_post, linkedin.reply_comment, linkedin.send_message, linkedin.list_notifications, linkedin.get_post_analytics
- [ ] Twitter contract includes: twitter.create_post, twitter.reply_post, twitter.send_dm, twitter.search_mentions, twitter.get_post_metrics
- [ ] Both files follow same YAML structure as WhatsApp contract
- [ ] Examples and authentication notes included

**Test Steps**:
1. Validate YAML schemas (both files)
2. Verify all required tools documented
3. Verify consistency across all 3 contract files

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M4-T04 add LinkedIn and Twitter MCP contracts`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M4-T05: Create WhatsApp MCP setup documentation 🔑

**Description**: Create setup guide for WhatsApp MCP server including credentials, API keys, session management.

**Files to Create**:
- `Docs/mcp_whatsapp_setup.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Markdown file with step-by-step setup instructions
- [ ] Sections: Prerequisites, API Key Setup, Session Management, Testing, Troubleshooting
- [ ] Links to WhatsApp Business API docs
- [ ] Example `.secrets/whatsapp_credentials.json` structure
- [ ] Rate limit documentation

**Test Steps**:
1. Review content for completeness
2. Verify links to external docs work
3. Verify example credential structure matches expected format

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M4-T05 add WhatsApp MCP setup guide`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M4-T06: Create LinkedIn and Twitter MCP setup docs 🔑

**Description**: Create setup guides for LinkedIn and Twitter MCP servers.

**Files to Create**:
- `Docs/mcp_linkedin_setup.md`
- `Docs/mcp_twitter_setup.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] LinkedIn doc includes OAuth2 flow, API access, rate limits
- [ ] Twitter doc includes API v2 credentials, bearer token setup, rate limits
- [ ] Both follow same structure as WhatsApp setup doc
- [ ] Example credential structures included

**Test Steps**:
1. Review content for completeness
2. Verify OAuth2 flow documentation accurate
3. Verify Twitter API v2 specifics documented

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M4-T06 add LinkedIn and Twitter setup guides`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M4-T07: Create credential templates in .secrets/ 🔑

**Description**: Create gitignored credential template files for all 3 social MCP servers.

**Files to Create**:
- `.secrets/whatsapp_credentials_template.json`
- `.secrets/linkedin_credentials_template.json`
- `.secrets/twitter_credentials_template.json`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] All 3 template files created with placeholder values
- [ ] JSON format with required fields (api_key, api_secret, access_token, etc.)
- [ ] Comments explain each field
- [ ] `.secrets/` directory gitignored
- [ ] README.md in `.secrets/` with copy instructions

**Test Steps**:
1. Verify `.secrets/` in .gitignore
2. Run `git status` — verify template files ignored
3. Verify JSON structure valid
4. Verify all required fields present per setup docs

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M4-T07 add social MCP credential templates`

**Rollback Note**: `git revert <commit>` + delete .secrets/ directory

---

### G-M4-T08: Update Dashboard.md with Last External Action

**Description**: Add "Last External Action" section to Dashboard.md showing tool/operation/status/timestamp of most recent MCP action.

**Files to Modify**:
- `Dashboard.md`

**Agent Skills Involved**: None (manual update, later automated by executor)

**Acceptance Criteria**:
- [ ] Dashboard.md has "Last External Action" section under Gold Tier
- [ ] Fields: Tool (e.g., linkedin.create_post), Operation (e.g., "Posted update"), Status (Success/Failed), Timestamp
- [ ] Initial value: "(none yet)"
- [ ] brain_execute_social_with_mcp updates this section after each execution

**Test Steps**:
1. Verify section exists in Dashboard.md
2. Run social executor in dry-run, verify section not updated (dry-run doesn't execute)
3. (IF MCP configured) Run with --execute, verify section updates

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M4-T08 add Last External Action to Dashboard`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M4-T09: Integration test social MCP executor dry-run

**Description**: End-to-end test: Create social intake wrapper → generate plan → request approval → approve → execute dry-run.

**Files to Create**: None (test execution)

**Agent Skills Involved**: `brain_create_plan`, `brain_request_approval`, `brain_execute_social_with_mcp`

**Acceptance Criteria**:
- [ ] Create WhatsApp intake wrapper manually
- [ ] Run `brain_create_plan`, verify plan generated with whatsapp.reply_message
- [ ] Run `brain_request_approval`, verify ACTION file in `Pending_Approval/`
- [ ] Manually move to `Approved/`
- [ ] Run `brain_execute_social_with_mcp --dry-run`, verify preview shown (no real action)
- [ ] Verify plan status NOT updated (dry-run doesn't change state)
- [ ] Repeat for LinkedIn and Twitter

**Test Steps**:
1. Execute full workflow for WhatsApp (dry-run only)
2. Verify all steps complete without errors
3. Verify approval gate cannot be bypassed (try executing without approval → ERROR)
4. Repeat for LinkedIn and Twitter
5. Document results

**Failure Simulation**:
- Execute without approval → verify ERROR

**Suggested Commit Message**: N/A (test only)

**Rollback Note**: Delete test files

---

### G-M4 Completion Checklist

**Definition of Done**:
- [ ] `brain_execute_social_with_mcp` implemented with dry-run default
- [ ] Social action detection added to `brain_create_plan`
- [ ] MCP tool contracts documented (3 YAML files)
- [ ] Setup docs created (3 markdown files)
- [ ] Dry-run test passes (preview shown, no real action)
- [ ] Approval gate cannot be bypassed (test: execute without approval → FAIL)
- [ ] Dashboard.md shows "Last External Action: (none yet)"

**Git Commit** (after all G-M4 tasks complete):
```
feat(gold): G-M4 social MCP execution layer

Objective: Implement social MCP executor with dry-run default and approval gates.

Tasks completed:
- G-M4-T01: Extended brain_create_plan for social action detection
- G-M4-T02: Implemented social MCP executor skill
- G-M4-T03: WhatsApp MCP contract
- G-M4-T04: LinkedIn and Twitter MCP contracts
- G-M4-T05: WhatsApp MCP setup guide
- G-M4-T06: LinkedIn and Twitter setup guides
- G-M4-T07: Social MCP credential templates
- G-M4-T08: Dashboard Last External Action section
- G-M4-T09: Integration test dry-run workflow

Files created:
- brain_execute_social_with_mcp_skill.py
- specs/001-gold-tier-full/contracts/mcp_whatsapp.yaml
- specs/001-gold-tier-full/contracts/mcp_linkedin.yaml
- specs/001-gold-tier-full/contracts/mcp_twitter.yaml
- Docs/mcp_whatsapp_setup.md, mcp_linkedin_setup.md, mcp_twitter_setup.md
- .secrets/whatsapp_credentials_template.json, linkedin_credentials_template.json, twitter_credentials_template.json

Files modified:
- brain_create_plan_skill.py
- Dashboard.md

Tests passing:
- Dry-run workflow complete (WhatsApp, LinkedIn, Twitter)
- Approval gate enforced (cannot bypass)

Definition of Done:
[X] All checklist items complete

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## G-M5: Odoo MCP Integration (Query → Action) (6-8 hours)

**Objective**: Implement Odoo accounting integration via JSON-RPC MCP server, supporting both query operations (unpaid invoices, revenue, AR aging) and action operations (create invoice, post invoice, register payment).

### G-M5-T01: Create Odoo mock fixture 🎭

**Description**: Create mock fixture JSON file with example Odoo query results (unpaid invoices, revenue summary).

**Files to Create**:
- `tests/fixtures/odoo_mock.json`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] JSON file with mock Odoo data
- [ ] Includes: unpaid invoices list (3-5 invoices), revenue summary, AR aging summary
- [ ] Each invoice includes: id, customer_name, amount, due_date, status
- [ ] Valid JSON

**Test Steps**:
1. Run `cat tests/fixtures/odoo_mock.json | jq .` — verify valid JSON
2. Verify structure matches Odoo JSON-RPC response format

**Failure Simulation**: N/A

**Suggested Commit Message**: `test(gold): G-M5-T01 add Odoo mock fixture`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M5-T02: Implement odoo_watcher_skill.py (optional) 🎭🔧

**Description**: Implement Odoo watcher (optional but recommended) that queries Odoo for unpaid invoices and creates intake wrappers.

**Files to Create**:
- `odoo_watcher_skill.py`

**Agent Skills Involved**: `odoo_watcher`

**Acceptance Criteria**:
- [ ] CLI flags: `--once`, `--dry-run`, `--mock`
- [ ] Mock mode reads `tests/fixtures/odoo_mock.json`
- [ ] Queries Odoo via MCP (or mock) for unpaid invoices, overdue payments
- [ ] Creates intake wrappers in `Business/Accounting/` with naming: `inbox__odoo__YYYYMMDD-HHMM__<object>.md`
- [ ] YAML frontmatter with Odoo-specific fields (invoice_id, customer_name, amount, due_date)
- [ ] Query-only (no invoice creation/posting)
- [ ] Logs to `Logs/odoo_watcher.log` and `system_log.md`
- [ ] Checkpoint: `Logs/odoo_watcher_checkpoint.json`

**Test Steps**:
1. Run `python odoo_watcher_skill.py --mock --once --dry-run` — verify no files
2. Run `python odoo_watcher_skill.py --mock --once` — verify intake wrapper created in `Business/Accounting/`
3. Verify YAML frontmatter includes Odoo-specific fields
4. Verify checkpoint prevents duplicates
5. Verify logs

**Failure Simulation**:
- Mock fixture missing → verify graceful error
- Odoo server down (if real mode) → verify graceful degradation

**Suggested Commit Message**: `feat(gold): G-M5-T02 implement Odoo watcher skill (optional)`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M5-T03: Extend brain_create_plan for Odoo action detection

**Description**: Extend brain_create_plan to detect Odoo actions (odoo.create_invoice, odoo.post_invoice, odoo.register_payment) and generate plans with MCP tool references.

**Files to Modify**:
- `brain_create_plan_skill.py`

**Agent Skills Involved**: `brain_create_plan`

**Acceptance Criteria**:
- [ ] Detects Odoo action patterns
- [ ] Generates plan with Odoo MCP tool references
- [ ] Risk assessment: Odoo actions = High risk (financial impact)
- [ ] Plan includes approval requirement flag
- [ ] Compatible with existing social/email action detection

**Test Steps**:
1. Create Odoo intake wrapper manually (or via watcher)
2. Run `brain_create_plan` on wrapper
3. Verify plan generated with `odoo.create_invoice` tool reference
4. Verify plan risk = High
5. Verify plan requires approval

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M5-T03 extend brain_create_plan for Odoo actions`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M5-T04: Implement brain_execute_odoo_with_mcp_skill.py 🔧

**Description**: Create skill for executing Odoo MCP actions with dry-run default and approval gates.

**Files to Create**:
- `brain_execute_odoo_with_mcp_skill.py`

**Agent Skills Involved**: `brain_execute_odoo_with_mcp`

**Acceptance Criteria**:
- [ ] CLI flags: `--plan-id <id>`, `--dry-run` (default), `--execute`
- [ ] Supports Odoo accounting actions (create_invoice, post_invoice, register_payment)
- [ ] Dry-run mode shows preview
- [ ] Explicit `--execute` flag required
- [ ] Approval required for all ACTION tools
- [ ] Query tools (list_unpaid_invoices, revenue_summary) do NOT require approval
- [ ] JSON-RPC error handling (401/403 auth, 500 server errors)
- [ ] Logs to `Logs/mcp_actions.log`
- [ ] Updates plan status

**Test Steps**:
1. Create Odoo plan manually, move to `Approved/`
2. Run `brain_execute_odoo_with_mcp --plan-id <id> --dry-run` — verify preview
3. (IF Odoo configured) Run with `--execute` — verify action executed
4. Verify JSON log
5. Test without approval → verify ERROR
6. Simulate Odoo auth failure (401), verify remediation task created

**Failure Simulation**:
- Execute without approval → verify ERROR
- Odoo server down → verify `brain_handle_mcp_failure` invoked
- Auth failure (401) → verify remediation task "Refresh Odoo credentials"

**Suggested Commit Message**: `feat(gold): G-M5-T04 implement Odoo MCP executor skill`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M5-T05: Create Odoo MCP tool contract 🔧

**Description**: Create YAML contract documenting Odoo MCP tools with JSON-RPC patterns.

**Files to Create**:
- `specs/001-gold-tier-full/contracts/mcp_odoo.yaml`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] YAML file with all Odoo MCP tools documented
- [ ] QUERY tools: odoo.list_unpaid_invoices, odoo.get_invoice, odoo.get_customer, odoo.revenue_summary, odoo.ar_aging_summary
- [ ] ACTION tools: odoo.create_customer, odoo.create_invoice, odoo.post_invoice, odoo.register_payment, odoo.create_credit_note
- [ ] JSON-RPC patterns documented (xmlrpc/2/common, xmlrpc/2/object)
- [ ] Example model/method calls (account.move, res.partner)
- [ ] Authentication flow documented

**Test Steps**:
1. Validate YAML schema
2. Verify all required tools documented
3. Verify JSON-RPC examples correct

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M5-T05 add Odoo MCP contract`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M5-T06: Create Odoo MCP setup documentation 🔑🔧

**Description**: Create setup guide for Odoo MCP server including JSON-RPC setup, database config, model/method reference.

**Files to Create**:
- `Docs/mcp_odoo_setup.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Markdown file with Odoo setup instructions
- [ ] Sections: Prerequisites, Odoo Installation (local/Docker), JSON-RPC Setup, Authentication, Testing, Troubleshooting
- [ ] Base URL documented: `http://localhost:8069`
- [ ] Model/method reference (account.move, res.partner)
- [ ] Example credential structure

**Test Steps**:
1. Review content for completeness
2. Verify JSON-RPC patterns match Odoo 19+ documentation
3. Verify example credential structure correct

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M5-T06 add Odoo MCP setup guide`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M5-T07: Create Odoo credential template 🔑

**Description**: Create gitignored credential template file for Odoo MCP server.

**Files to Create**:
- `.secrets/odoo_credentials_template.json`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] JSON file with placeholder values
- [ ] Fields: base_url, database, username, password (or api_key)
- [ ] Comments explain each field
- [ ] File gitignored

**Test Steps**:
1. Verify `.secrets/` in .gitignore
2. Run `git status` — verify template ignored
3. Verify JSON structure valid

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M5-T07 add Odoo credential template`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M5-T08: Create scheduled task for odoo_watcher 📅

**Description**: Create Windows Task Scheduler XML template for Odoo watcher (daily or hourly).

**Files to Create**:
- `Scheduled/odoo_watcher_task.xml`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] XML file for Odoo watcher
- [ ] Trigger: Daily at 9 AM UTC (or hourly)
- [ ] Action: Run `python odoo_watcher_skill.py --once`
- [ ] Logging enabled

**Test Steps**:
1. Validate XML schema
2. Import task: `schtasks /Create /XML Scheduled/odoo_watcher_task.xml /TN "PAI_Odoo_Watcher"`
3. Run manually (mock mode)
4. Verify intake wrapper created

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M5-T08 add Odoo watcher scheduled task`

**Rollback Note**: `git revert <commit>` + delete imported task

---

### G-M5-T09: Update Dashboard.md with Accounting Status

**Description**: Add "Accounting Status" section to Dashboard.md showing Odoo connection, unpaid invoices count, AR aging.

**Files to Modify**:
- `Dashboard.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Dashboard.md has "Accounting Status" section under Gold Tier
- [ ] Fields: Odoo Connection (Connected/Not configured), Unpaid Invoices Count, AR Aging Summary, Last Sync
- [ ] Initial value: "Odoo connection not configured"
- [ ] odoo_watcher updates this section after each run

**Test Steps**:
1. Verify section exists in Dashboard.md
2. Run odoo_watcher in mock mode, manually update section
3. Verify links to latest accounting intake wrappers

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M5-T09 add Accounting Status to Dashboard`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M5 Completion Checklist

**Definition of Done**:
- [ ] `brain_execute_odoo_with_mcp` implemented with dry-run default
- [ ] Odoo action detection added to `brain_create_plan`
- [ ] Odoo MCP tool contract documented (YAML)
- [ ] Setup doc created with JSON-RPC examples
- [ ] Dry-run test passes (mock Odoo query/action)
- [ ] Approval gate enforced for ACTION tools
- [ ] Dashboard.md shows "Accounting Status: Odoo connection not configured"

**Git Commit** (after all G-M5 tasks complete):
```
feat(gold): G-M5 Odoo MCP integration (query + action)

Objective: Implement Odoo accounting integration via JSON-RPC MCP server.

Tasks completed:
- G-M5-T01: Odoo mock fixture
- G-M5-T02: Odoo watcher skill (optional)
- G-M5-T03: Extended brain_create_plan for Odoo action detection
- G-M5-T04: Implemented Odoo MCP executor skill
- G-M5-T05: Odoo MCP contract
- G-M5-T06: Odoo MCP setup guide
- G-M5-T07: Odoo credential template
- G-M5-T08: Odoo watcher scheduled task
- G-M5-T09: Dashboard Accounting Status section

Files created:
- odoo_watcher_skill.py (optional)
- brain_execute_odoo_with_mcp_skill.py
- tests/fixtures/odoo_mock.json
- specs/001-gold-tier-full/contracts/mcp_odoo.yaml
- Docs/mcp_odoo_setup.md
- .secrets/odoo_credentials_template.json
- Scheduled/odoo_watcher_task.xml

Files modified:
- brain_create_plan_skill.py
- Dashboard.md

Tests passing:
- Odoo watcher creates intake wrappers (mock mode)
- Odoo executor dry-run workflow complete
- Approval gate enforced for ACTION tools

Definition of Done:
[X] All checklist items complete

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## G-M6: Weekly CEO Briefing + Accounting Audit (5-6 hours)

**Objective**: Implement weekly CEO briefing generation that synthesizes Business/Goals, system_log.md, Social/Analytics, and Odoo queries into executive summary.

### G-M6-T01: Implement brain_social_generate_summary_skill.py

**Description**: Create skill for aggregating social intake wrappers into daily or weekly summaries.

**Files to Create**:
- `brain_social_generate_summary_skill.py`

**Agent Skills Involved**: `brain_social_generate_summary`

**Acceptance Criteria**:
- [ ] CLI flags: `--period <daily|weekly>`, `--dry-run`
- [ ] Aggregates social intake wrappers from `Social/Inbox/`
- [ ] Queries LinkedIn/Twitter analytics via MCP (if available, optional)
- [ ] Generates `Social/Summaries/YYYY-MM-DD_daily.md` or `YYYY-MM-DD_weekly.md`
- [ ] Includes: message count per channel, top conversations, engagement metrics
- [ ] Links to intake wrappers
- [ ] Logs to `system_log.md`

**Test Steps**:
1. Create 3-5 sample social intake wrappers in `Social/Inbox/`
2. Run `brain_social_generate_summary --period daily --dry-run` — verify preview
3. Run `brain_social_generate_summary --period daily` — verify summary created in `Social/Summaries/`
4. Verify summary includes message counts per channel
5. Verify links to intake wrappers work
6. Test weekly summary similarly

**Failure Simulation**:
- No intake wrappers exist → verify summary includes "No social activity this period"

**Suggested Commit Message**: `feat(gold): G-M6-T01 implement social summary generator`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M6-T02: Implement brain_generate_weekly_ceo_briefing_skill.py

**Description**: Create skill for generating weekly CEO briefing with 8 required sections.

**Files to Create**:
- `brain_generate_weekly_ceo_briefing_skill.py`

**Agent Skills Involved**: `brain_generate_weekly_ceo_briefing`

**Acceptance Criteria**:
- [ ] CLI flags: `--dry-run`
- [ ] Reads data sources:
  - `Business/Goals/*` (strategic objectives)
  - `system_log.md` (activity log)
  - Task completions from `Done/` (weekly count)
  - `Social/Analytics/*` or latest summary (social performance)
  - Odoo MCP queries: `odoo.revenue_summary`, `odoo.ar_aging_summary`, `odoo.list_unpaid_invoices`
- [ ] Writes `Business/Briefings/YYYY-MM-DD_Monday_Briefing.md`
- [ ] 8 sections: KPIs, Wins, Risks, Outstanding Invoices + AR Aging, Social Performance, Next Week Priorities, Pending Approvals, Summary
- [ ] Handles missing data gracefully (e.g., "Odoo metrics unavailable (server unreachable)")
- [ ] Logs to `system_log.md`

**Test Steps**:
1. Create sample Business Goal: `Business/Goals/2026_Q1_goals.md`
2. Create sample social summaries
3. Run `brain_generate_weekly_ceo_briefing --dry-run` — verify preview
4. Run `brain_generate_weekly_ceo_briefing` — verify briefing created in `Business/Briefings/`
5. Verify all 8 sections present
6. Simulate Odoo down, verify briefing still generates with "Odoo metrics unavailable" note
7. Verify no Business Goals → includes "No strategic goals configured"

**Failure Simulation**:
- Odoo server down → verify briefing generates with graceful degradation note
- No social summaries → verify includes "No social activity this week"
- No Business Goals → verify includes "No strategic goals configured"

**Suggested Commit Message**: `feat(gold): G-M6-T02 implement weekly CEO briefing generator`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M6-T03: Create sample Business Goal

**Description**: Create example strategic objectives file to demonstrate CEO briefing functionality.

**Files to Create**:
- `Business/Goals/2026_Q1_goals.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Markdown file with sample Q1 2026 goals
- [ ] 3-5 strategic objectives with target metrics
- [ ] Format: Goal title, Description, Target metrics, Current status, Risks
- [ ] Demonstrates expected structure for CEO briefing

**Test Steps**:
1. Run `cat Business/Goals/2026_Q1_goals.md` — verify content
2. Verify format matches expected structure
3. Run CEO briefing generator, verify goals appear in briefing

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M6-T03 add sample Business Goal for Q1 2026`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M6-T04: Create scheduled task for social daily summary 📅

**Description**: Create Windows Task Scheduler XML template for daily social summary generation (11 PM UTC).

**Files to Create**:
- `Scheduled/social_daily_summary_task.xml`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] XML file for social daily summary
- [ ] Trigger: Daily at 11:00 PM UTC
- [ ] Action: Run `python brain_social_generate_summary_skill.py --period daily`
- [ ] Logging enabled

**Test Steps**:
1. Validate XML schema
2. Import task: `schtasks /Create /XML Scheduled/social_daily_summary_task.xml /TN "PAI_Social_Daily_Summary"`
3. Run manually
4. Verify summary created in `Social/Summaries/`

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M6-T04 add social daily summary scheduled task`

**Rollback Note**: `git revert <commit>` + delete imported task

---

### G-M6-T05: Create scheduled task for weekly CEO briefing 📅

**Description**: Create Windows Task Scheduler XML template for weekly CEO briefing (Sunday 11:59 PM UTC).

**Files to Create**:
- `Scheduled/weekly_ceo_briefing_task.xml`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] XML file for weekly CEO briefing
- [ ] Trigger: Weekly on Sunday at 11:59 PM UTC
- [ ] Action: Run `python brain_generate_weekly_ceo_briefing_skill.py`
- [ ] Logging enabled

**Test Steps**:
1. Validate XML schema
2. Import task: `schtasks /Create /XML Scheduled/weekly_ceo_briefing_task.xml /TN "PAI_Weekly_CEO_Briefing"`
3. Run manually
4. Verify briefing created in `Business/Briefings/`

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M6-T05 add weekly CEO briefing scheduled task`

**Rollback Note**: `git revert <commit>` + delete imported task

---

### G-M6-T06: Update Dashboard.md with briefing links

**Description**: Add "Latest Social Summary" and "Latest CEO Briefing" links to Dashboard.md.

**Files to Modify**:
- `Dashboard.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Dashboard.md has "Latest Social Summary" section with link
- [ ] Dashboard.md has "Latest CEO Briefing" section with link
- [ ] Links update automatically (skills update Dashboard after generation)
- [ ] Initial value: "No summaries/briefings generated yet"

**Test Steps**:
1. Verify sections exist in Dashboard.md
2. Run social summary generator
3. Verify Dashboard link updated to latest summary
4. Run CEO briefing generator
5. Verify Dashboard link updated to latest briefing

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M6-T06 add briefing links to Dashboard`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M6 Completion Checklist

**Definition of Done**:
- [ ] Social summary generator working (aggregates intake wrappers)
- [ ] CEO briefing generator working (all 8 sections)
- [ ] Graceful degradation for missing data sources
- [ ] Scheduled tasks created (daily social summary, weekly CEO briefing)
- [ ] Dashboard.md links to latest briefing
- [ ] Manual test: Generate briefing with mock data, verify all sections populated

**Git Commit** (after all G-M6 tasks complete):
```
feat(gold): G-M6 weekly CEO briefing + accounting audit

Objective: Implement weekly CEO briefing with cross-domain data synthesis.

Tasks completed:
- G-M6-T01: Implemented social summary generator
- G-M6-T02: Implemented weekly CEO briefing generator
- G-M6-T03: Created sample Business Goal
- G-M6-T04: Social daily summary scheduled task
- G-M6-T05: Weekly CEO briefing scheduled task
- G-M6-T06: Dashboard briefing links

Files created:
- brain_social_generate_summary_skill.py
- brain_generate_weekly_ceo_briefing_skill.py
- Business/Goals/2026_Q1_goals.md
- Scheduled/social_daily_summary_task.xml
- Scheduled/weekly_ceo_briefing_task.xml

Files modified:
- Dashboard.md

Tests passing:
- Social summary aggregates intake wrappers correctly
- CEO briefing includes all 8 sections
- Graceful degradation when Odoo down

Definition of Done:
[X] All checklist items complete

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## G-M7: Ralph Loop Autonomous Orchestrator (6-8 hours)

**Objective**: Implement Ralph Wiggum loop for autonomous multi-step task completion with bounded iterations, approval gates respected, and remediation task creation on failure.

### G-M7-T01: Implement brain_ralph_loop_orchestrator_skill.py (core logic)

**Description**: Create Ralph loop orchestrator with bounded iterations, approval gate respect, and remediation task creation.

**Files to Create**:
- `brain_ralph_loop_orchestrator_skill.py`

**Agent Skills Involved**: `brain_ralph_loop_orchestrator`

**Acceptance Criteria**:
- [ ] CLI parameters:
  - `--task-description <desc>` (what to accomplish)
  - `--max-iterations <N>` (default 10, max 50)
  - `--max-plans-per-iteration <N>` (default 5, prevents runaway)
  - `--completion-file <path>` (optional, file to check in `Done/`)
- [ ] Behavior:
  - Reads task, begins execution
  - Loops: check status → act → log → check completion
  - Stops when:
    - Approval required (does NOT bypass HITL)
    - Max iterations reached
    - Completion file appears in `Done/`
    - Critical error (server down, auth failure)
  - Creates remediation tasks on failure
  - Bounded retries: max 3 retries per step
  - Timeout: max 5 minutes per iteration
- [ ] Logs to `Logs/ralph_loop.log` (one line per iteration with status)

**Test Steps**:
1. Create low-risk test task in `Needs_Action/`
2. Run `brain_ralph_loop_orchestrator --task-description "Process all items in Needs_Action/" --max-iterations 5`
3. Verify loop reads task, creates plans, requests approvals
4. Verify loop stops when approval pending (log: "Waiting for approval")
5. Manually approve
6. Re-run loop, verify it detects approval, executes action, continues
7. Test max iterations: Run with `--max-iterations 3`, verify stops after 3
8. Test max plans per iteration: Create scenario with 10+ items, verify stops at 5 plans
9. Verify logs written to `Logs/ralph_loop.log`

**Failure Simulation**:
- MCP timeout → verify remediation task created + loop moves to next step
- Critical error (server down) → verify loop exits gracefully + logs error
- Runaway loop (100 plans) → verify `--max-plans-per-iteration` prevents it

**Suggested Commit Message**: `feat(gold): G-M7-T01 implement Ralph loop orchestrator`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M7-T02: Add Ralph loop state persistence (optional)

**Description**: Implement optional state persistence for Ralph loop to resume execution after interruption.

**Files to Modify**:
- `brain_ralph_loop_orchestrator_skill.py`

**Agent Skills Involved**: `brain_ralph_loop_orchestrator`

**Acceptance Criteria**:
- [ ] Internal state: task_description, max_iterations, current_iteration, status, completion_file, plans_created, last_action
- [ ] State persisted to `Logs/ralph_loop_state.json` after each iteration
- [ ] CLI flag: `--resume` to resume from saved state
- [ ] If state file missing, starts fresh
- [ ] Clears state file on successful completion

**Test Steps**:
1. Run Ralph loop for 2 iterations
2. Kill process (Ctrl+C)
3. Run `brain_ralph_loop_orchestrator --resume`
4. Verify loop resumes from iteration 3
5. Verify state file deleted on completion

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M7-T02 add Ralph loop state persistence`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M7-T03: Create Ralph loop test scenarios

**Description**: Create test scenario files demonstrating Ralph loop capabilities.

**Files to Create**:
- `tests/fixtures/ralph_loop_test_task.md` (low-risk multi-step task)
- `tests/fixtures/ralph_loop_approval_scenario.md` (approval-blocking scenario)
- `tests/fixtures/ralph_loop_max_iterations_scenario.md` (max iterations test)

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] 3 test scenario files created
- [ ] Each file describes expected behavior
- [ ] Scenarios cover: low-risk workflow, approval gate blocking, max iterations limit
- [ ] Instructions for manual testing included

**Test Steps**:
1. Review scenario files for completeness
2. Execute each scenario manually
3. Verify Ralph loop behaves as expected in each case
4. Document results

**Failure Simulation**: N/A

**Suggested Commit Message**: `test(gold): G-M7-T03 add Ralph loop test scenarios`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M7-T04: Create Ralph loop usage documentation

**Description**: Create comprehensive documentation for Ralph loop with examples, parameters, and safety features.

**Files to Create**:
- `Docs/ralph_loop_usage.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Markdown file with Ralph loop documentation
- [ ] Sections: Overview, Parameters, Safety Features, Examples, Troubleshooting
- [ ] Example use cases: multi-step inbox processing, autonomous daily workflow
- [ ] Safety features documented: bounded iterations, approval gates, max plans per iteration, timeout
- [ ] Warnings about misuse

**Test Steps**:
1. Review content for completeness
2. Verify examples accurate
3. Verify safety features clearly documented

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M7-T04 add Ralph loop usage guide`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M7-T05: Update Dashboard.md with Ralph Loop Status

**Description**: Add "Ralph Loop Status" section to Dashboard.md showing running/stopped/complete status.

**Files to Modify**:
- `Dashboard.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Dashboard.md has "Ralph Loop Status" section under Gold Tier
- [ ] Fields: Status (Running/Stopped/Complete), Current Iteration, Task Description, Last Action
- [ ] Initial value: "Stopped"
- [ ] brain_ralph_loop_orchestrator updates this section during execution

**Test Steps**:
1. Verify section exists in Dashboard.md
2. Run Ralph loop
3. Verify Dashboard shows "Running" status
4. After completion, verify shows "Complete" status

**Failure Simulation**: N/A

**Suggested Commit Message**: `feat(gold): G-M7-T05 add Ralph Loop Status to Dashboard`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M7-T06: Integration test Ralph loop workflow

**Description**: End-to-end test of Ralph loop: low-risk multi-step task → approval gate → resume → completion.

**Files to Create**: None (test execution)

**Agent Skills Involved**: `brain_ralph_loop_orchestrator` (and all skills it calls)

**Acceptance Criteria**:
- [ ] Create 3-step workflow test task
- [ ] Run Ralph loop with `--max-iterations 10`
- [ ] Verify loop processes step 1, creates plan, requests approval
- [ ] Verify loop stops (log: "Waiting for approval")
- [ ] Manually approve
- [ ] Re-run loop, verify detects approval, executes, continues to step 2
- [ ] Verify loop completes all 3 steps
- [ ] Verify logs accurate
- [ ] Verify approval gates cannot be bypassed

**Test Steps**:
1. Execute full workflow as described in acceptance criteria
2. Verify all safety features working (bounded iterations, approval gates, max plans per iteration)
3. Document results

**Failure Simulation**:
- MCP timeout in step 2 → verify remediation task created + loop continues to step 3

**Suggested Commit Message**: N/A (test only)

**Rollback Note**: Delete test files

---

### G-M7 Completion Checklist

**Definition of Done**:
- [ ] Ralph loop orchestrator implemented with all safety features
- [ ] Loop stops when approval required (HITL enforced)
- [ ] Max iterations enforced (stops at 10)
- [ ] Max plans per iteration enforced (stops at 5)
- [ ] Remediation tasks created on failure
- [ ] Logs written to `Logs/ralph_loop.log`
- [ ] Manual test: Run 3-step workflow, verify stops for approval, resumes after

**Git Commit** (after all G-M7 tasks complete):
```
feat(gold): G-M7 Ralph loop autonomous orchestrator

Objective: Implement Ralph loop for bounded autonomous multi-step task completion.

Tasks completed:
- G-M7-T01: Implemented Ralph loop orchestrator core logic
- G-M7-T02: Added Ralph loop state persistence (optional)
- G-M7-T03: Created Ralph loop test scenarios
- G-M7-T04: Created Ralph loop usage documentation
- G-M7-T05: Dashboard Ralph Loop Status section
- G-M7-T06: Integration test Ralph loop workflow

Files created:
- brain_ralph_loop_orchestrator_skill.py
- tests/fixtures/ralph_loop_test_task.md
- tests/fixtures/ralph_loop_approval_scenario.md
- tests/fixtures/ralph_loop_max_iterations_scenario.md
- Docs/ralph_loop_usage.md

Files modified:
- Dashboard.md

Tests passing:
- Ralph loop processes 3-step workflow
- Loop stops for approval (HITL enforced)
- Max iterations and max plans per iteration enforced
- Remediation tasks created on failure

Definition of Done:
[X] All checklist items complete

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## G-M8: End-to-End Testing + Demo Documentation (6-8 hours)

**Objective**: Validate all Gold Tier features with end-to-end tests, create demo script, completion checklist, architecture documentation, and lessons learned.

### G-M8-T01: Run acceptance criteria tests (AC-001 through AC-018)

**Description**: Execute all 18 acceptance criteria from spec.md and document results.

**Files to Create**:
- `tests/test_report_gold_e2e.md`

**Agent Skills Involved**: All Gold skills

**Acceptance Criteria**:
- [ ] AC-001: WhatsApp watcher creates intake wrappers (mock mode) — PASS
- [ ] AC-002: LinkedIn watcher creates intake wrappers — PASS
- [ ] AC-003: Twitter watcher creates intake wrappers — PASS
- [ ] AC-004: LinkedIn posting via MCP (plan → approval → execute dry-run) — PASS
- [ ] AC-005: Twitter posting/reply via MCP (dry-run) — PASS
- [ ] AC-006: WhatsApp reply/send via MCP (dry-run) — PASS
- [ ] AC-007: Odoo MCP queries (mock or real) — PASS
- [ ] AC-008: Odoo MCP actions with approval (dry-run) — PASS
- [ ] AC-009: Weekly CEO briefing (all sections) — PASS
- [ ] AC-010: Ralph loop (low-risk task → approval → continue) — PASS
- [ ] AC-011: Ralph loop max iterations — PASS
- [ ] AC-012: Ralph loop remediation tasks — PASS
- [ ] AC-013: Dashboard.md Gold sections — PASS
- [ ] AC-014: Audit trails (no secrets in git) — PASS
- [ ] AC-015: MCP registry refresh — PASS
- [ ] AC-016: Graceful degradation (Twitter down → others continue) — PASS
- [ ] AC-017: Social daily summary — PASS
- [ ] AC-018: Scheduled tasks import successfully — PASS

**Test Steps**:
1. Run each acceptance criteria test sequentially
2. Document PASS/FAIL status in `tests/test_report_gold_e2e.md`
3. For each FAIL, document error details and remediation plan
4. Verify all 18 ACs pass before proceeding

**Failure Simulation**: If any AC fails, fix issue and re-run

**Suggested Commit Message**: `test(gold): G-M8-T01 run all 18 acceptance criteria tests`

**Rollback Note**: N/A (test only, results documented)

---

### G-M8-T02: Create gold_demo_script.md

**Description**: Create 10-minute demo script covering all P1+P2 user stories.

**Files to Create**:
- `Docs/gold_demo_script.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Markdown file with 10-minute demo script
- [ ] Minute-by-minute breakdown:
  - Minute 1-2: Show vault structure (Social/, Business/, MCP/)
  - Minute 3-4: Run social watchers (mock mode), show intake wrappers
  - Minute 5-6: Create plan → request approval → execute (dry-run)
  - Minute 7-8: Generate CEO briefing, show all sections
  - Minute 9: Run Ralph loop, show autonomous execution
  - Minute 10: Show Dashboard.md Gold sections
- [ ] Commands to run at each step
- [ ] Expected outputs documented
- [ ] Screenshots or output examples (optional)

**Test Steps**:
1. Review script for completeness
2. Execute script dry-run, time each section
3. Verify total time ~10 minutes
4. Adjust timing if needed

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M8-T02 create 10-minute demo script`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M8-T03: Create gold_completion_checklist.md

**Description**: Create completion checklist mapping to all 18 acceptance criteria with test evidence.

**Files to Create**:
- `Docs/gold_completion_checklist.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Markdown file with completion checklist
- [ ] Maps to all 18 acceptance criteria from spec.md
- [ ] Each AC includes: checkbox, description, test evidence (log snippet or file path)
- [ ] Status: PASS/FAIL for each
- [ ] Summary section: total ACs, passing count, completion percentage

**Test Steps**:
1. Review checklist for completeness
2. Verify all 18 ACs included
3. Verify test evidence provided for each
4. Verify all checkboxes marked (all PASS)

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M8-T03 create completion checklist`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M8-T04: Create architecture_gold.md

**Description**: Create architecture documentation with diagrams, component overview, and data flow.

**Files to Create**:
- `Docs/architecture_gold.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Markdown file with architecture documentation
- [ ] Sections:
  - Architecture diagram (Perception → Plan → Approval → Action → Logging)
  - Component overview (4 watchers, 4 MCP servers, 16 skills, 7 scheduled tasks)
  - Data flow diagrams (social intake → plan → approval → execution)
  - Cross-domain vault architecture
  - Technology stack
  - Security model (approval gates, PII redaction, secrets management)
- [ ] Diagrams (ASCII art or mermaid.js)
- [ ] Links to related docs (spec.md, plan.md, setup guides)

**Test Steps**:
1. Review content for accuracy
2. Verify diagrams render correctly
3. Verify all components documented

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M8-T04 create architecture documentation`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M8-T05: Create lessons_learned_gold.md

**Description**: Document what worked well, challenges encountered, and future improvements for Gold Tier.

**Files to Create**:
- `Docs/lessons_learned_gold.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] Markdown file with lessons learned
- [ ] Sections:
  - What Worked Well (e.g., graceful degradation, bounded Ralph loop, mock mode testing)
  - Challenges Encountered (e.g., MCP server integration complexity, rate limiting)
  - Future Improvements (e.g., performance optimization, more MCP servers, AI-powered action suggestions)
  - Recommendations for Platinum Tier
- [ ] Honest reflection on development process
- [ ] Actionable insights for future work

**Test Steps**:
1. Review content for completeness
2. Verify reflects actual development experience
3. Verify recommendations actionable

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M8-T05 document lessons learned`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M8-T06: Import and verify all 7 scheduled tasks 📅

**Description**: Import all Gold scheduled tasks into Windows Task Scheduler and verify they run without errors.

**Files to Create**: None (task import)

**Agent Skills Involved**: None (manual task import)

**Acceptance Criteria**:
- [ ] All 7 Gold scheduled tasks imported:
  - mcp_registry_refresh (daily 2 AM)
  - whatsapp_watcher (every 5 min)
  - linkedin_watcher (every 10 min)
  - twitter_watcher (every 10 min)
  - odoo_watcher (daily or hourly)
  - social_daily_summary (daily 11 PM)
  - weekly_ceo_briefing (Sunday 11:59 PM)
- [ ] All tasks appear in Task Scheduler
- [ ] Run each task manually (mock mode)
- [ ] Verify no errors
- [ ] Verify logs created

**Test Steps**:
1. Import each task: `schtasks /Create /XML Scheduled/<task>.xml /TN "PAI_<TaskName>"`
2. Verify import success
3. Run each task: `schtasks /Run /TN "PAI_<TaskName>"`
4. Verify task completes without errors
5. Check logs for each task
6. Document results

**Failure Simulation**: Task import fails → verify XML schema, fix, re-import

**Suggested Commit Message**: N/A (task import, document in test report)

**Rollback Note**: Delete imported tasks

---

### G-M8-T07: Audit git history for secrets

**Description**: Verify no secrets committed to git repository.

**Files to Create**: None (audit only)

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] `.secrets/` never committed
- [ ] `Logs/*.log` gitignored
- [ ] MCP snapshots gitignored
- [ ] No API keys, passwords, tokens in git history
- [ ] No PII in committed files

**Test Steps**:
1. Run `git log --all --full-history -- .secrets/` — should be empty
2. Run `git log --all --full-history -- Logs/*.log` — should be empty (or only gitignore updates)
3. Run `git grep -E "(api_key|password|token|secret)" -- '*.py' '*.md' '*.json'` — verify no hardcoded secrets
4. Search for PII patterns: `git grep -E "\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"` — verify emails redacted
5. Document audit results in test report

**Failure Simulation**: Secrets found → remove from history, re-audit

**Suggested Commit Message**: N/A (audit only, document in test report)

**Rollback Note**: N/A

---

### G-M8-T08: Update README.md with Gold Tier status

**Description**: Update main README.md to mark Gold Tier as complete and link to Gold documentation.

**Files to Modify**:
- `README.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] README.md updated with Gold Tier status: "✅ Complete"
- [ ] Links to Gold docs: spec.md, plan.md, demo script, completion checklist, architecture docs
- [ ] Feature summary: Multi-channel social (WhatsApp/LinkedIn/Twitter), Odoo accounting, CEO briefing, Ralph loop
- [ ] Next steps: Platinum Tier (or "All hackathon tiers complete")

**Test Steps**:
1. Run `cat README.md | grep "Gold Tier"` — verify status updated
2. Verify all links work
3. Verify feature summary accurate

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M8-T08 update README with Gold completion`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M8-T09: Final Dashboard.md polish

**Description**: Final review and polish of Dashboard.md with all Gold sections populated.

**Files to Modify**:
- `Dashboard.md`

**Agent Skills Involved**: None

**Acceptance Criteria**:
- [ ] All Gold sections present and populated
- [ ] Links work
- [ ] No placeholder text remaining
- [ ] Formatting consistent
- [ ] Accurate status for all components

**Test Steps**:
1. Review Dashboard.md for completeness
2. Verify all Gold sections populated
3. Click all links, verify they work
4. Fix any formatting issues

**Failure Simulation**: N/A

**Suggested Commit Message**: `docs(gold): G-M8-T09 final Dashboard polish`

**Rollback Note**: `git revert <commit>` (safe)

---

### G-M8 Completion Checklist

**Definition of Done**:
- [ ] All 18 acceptance criteria PASS
- [ ] Demo script created (10 min, covers P1+P2 user stories)
- [ ] Completion checklist created (maps to all ACs)
- [ ] Architecture docs created (diagrams + component overview)
- [ ] Lessons learned documented
- [ ] All 7 scheduled tasks import successfully
- [ ] Git audit clean (no secrets committed)
- [ ] README.md updated: Gold Tier ✅ Complete

**Git Commit** (after all G-M8 tasks complete):
```
feat(gold): G-M8 e2e testing + demo docs + completion

Objective: Validate all Gold features and complete documentation.

Tasks completed:
- G-M8-T01: Ran all 18 acceptance criteria tests (18/18 PASS)
- G-M8-T02: Created 10-minute demo script
- G-M8-T03: Created completion checklist
- G-M8-T04: Created architecture documentation
- G-M8-T05: Documented lessons learned
- G-M8-T06: Imported and verified all 7 scheduled tasks
- G-M8-T07: Audited git history (no secrets)
- G-M8-T08: Updated README.md with Gold completion
- G-M8-T09: Final Dashboard.md polish

Files created:
- tests/test_report_gold_e2e.md
- Docs/gold_demo_script.md
- Docs/gold_completion_checklist.md
- Docs/architecture_gold.md
- Docs/lessons_learned_gold.md

Files modified:
- README.md
- Dashboard.md

Tests passing:
- All 18 acceptance criteria PASS
- All 7 scheduled tasks import and run successfully
- Git audit clean (no secrets committed)

Definition of Done:
[X] All checklist items complete

Gold Tier: ✅ COMPLETE

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Task Summary

### Total Task Count: 73 tasks

### Tasks Per Milestone:
- **G-M1**: 8 tasks (Vault + Domain Expansion)
- **G-M2**: 8 tasks (MCP Registry + Reliability Core)
- **G-M3**: 9 tasks (Social Watchers)
- **G-M4**: 9 tasks (Social MCP Execution Layer)
- **G-M5**: 9 tasks (Odoo MCP Integration)
- **G-M6**: 6 tasks (Weekly CEO Briefing)
- **G-M7**: 6 tasks (Ralph Loop Orchestrator)
- **G-M8**: 9 tasks (End-to-End Testing + Demo Docs)

### Critical Path Summary:
**G-M1 → G-M2 → G-M3 → G-M4 → G-M6 → G-M8**

**Estimated Duration**: 37-48 hours (critical path)

**Total Duration**: 43-56 hours (all milestones, sequential)

### First Milestone to Implement:
**G-M1: Vault + Domain Expansion** (2-3 hours)

Start with G-M1-T01: Create Social directory structure.

---

## Dependency Order (Strict)

**MUST execute in this order**:

1. **G-M1** (Vault structure) — BLOCKS all others (requires directory structure)
2. **G-M2** (MCP Registry + Reliability) — BLOCKS G-M3, G-M4, G-M5 (requires mcp_helpers.py)
3. **G-M3** (Social Watchers) — BLOCKS G-M4 (watchers create intake wrappers needed for execution testing)
4. **G-M4** (Social MCP Executor) — BLOCKS G-M6 (CEO briefing needs social summaries from executed actions)
5. **G-M5** (Odoo MCP) — Can run after G-M2, but recommend after G-M4 to maintain focus
6. **G-M6** (CEO Briefing) — BLOCKS G-M8 (needs briefing for demo)
7. **G-M7** (Ralph Loop) — Can run after G-M4, but recommend after G-M6 to maintain focus
8. **G-M8** (E2E Testing + Docs) — MUST be last (validates all previous milestones)

**No parallelization** (per user request: "avoid parallel chaos")

---

## Task Execution Notes

### Tasks Requiring External API Credentials (🔑):
- G-M3-T02, G-M3-T04, G-M3-T06 (social watchers, if real mode)
- G-M4-T05, G-M4-T06 (MCP setup docs reference credentials)
- G-M4-T07 (credential templates)
- G-M5-T06, G-M5-T07 (Odoo credentials)

### Tasks Requiring MCP Server Setup (🔧):
- G-M2-T04 (MCP registry refresh, needs configured servers)
- G-M3-T02, G-M3-T04, G-M3-T06 (social watchers, if real mode)
- G-M4-T02 (social executor, if real mode)
- G-M5-T02, G-M5-T04 (Odoo watcher and executor, if real mode)

### Tasks Requiring Scheduling Configuration (📅):
- G-M2-T08, G-M3-T07, G-M5-T08, G-M6-T04, G-M6-T05 (all scheduled tasks)
- G-M8-T06 (import all scheduled tasks)

### Tasks That Can Run in Mock Mode First (🎭):
- G-M3-T02, G-M3-T04, G-M3-T06 (all social watchers)
- G-M5-T02 (Odoo watcher)
- All executor tasks support dry-run mode (G-M4-T02, G-M5-T04)

---

**END OF TASKS FILE**
