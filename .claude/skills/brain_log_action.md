# Skill: brain_log_action

**Tier:** Silver
**Type:** Logging Skill
**Version:** 1.0.0
**Skill Number:** 19

## Purpose

Log all MCP actions to audit trail (Logs/mcp_actions.log and system_log.md). Provides complete transparency and debugging capability for all external actions.

## Inputs

- **Log Entry:** Struct containing tool, operation, parameters, mode, result, duration

## Outputs

- **Log Files Updated:** Logs/mcp_actions.log and system_log.md appended

## Preconditions

- Logs/mcp_actions.log exists
- system_log.md initialized

## Approval Gate

**No** (logging skill, no external actions)

## MCP Tools Used

None (audit trail skill)

## Steps

### 1. Format MCP Log Entry

```
[YYYY-MM-DD HH:MM:SS UTC] MCP Call Initiated
Tool: {tool_name}
Operation: {operation}
Parameters:
  {key}: {value}
  {key2}: {value2}
Mode: dry-run | execute
Result: SUCCESS | FAILURE - {details}
Duration: {seconds}s
```

### 2. Append to Logs/mcp_actions.log

```powershell
$logEntry | Out-File -FilePath "Logs/mcp_actions.log" -Append -Encoding UTF8
```

### 3. Append to system_log.md (if significant)

For significant actions (execute mode, failures):
```markdown
### {timestamp} - mcp_action
**Tool:** {tool}.{operation}
**Mode:** {mode}
**Result:** {result}
**Duration:** {seconds}s
```

## Failure Handling

### What to Do:
- If log file unwritable: Display warning, continue execution (don't block on logging)
- If log entry malformed: Log error, write what's available

### What NOT to Do:
- ❌ Do NOT block execution if logging fails
- ❌ Do NOT skip logging silently

## Logging Requirements

Logs to: Logs/mcp_actions.log (all MCP calls), system_log.md (significant calls)

## Definition of Done

- [ ] MCP action logged to Logs/mcp_actions.log
- [ ] Significant actions logged to system_log.md
- [ ] Log format correct and parseable
- [ ] Timestamp is UTC

## Test Procedure (Windows)

```powershell
# Test logging
$testEntry = @{
    Tool = "gmail"
    Operation = "send_email"
    Parameters = @{to="test@example.com"}
    Mode = "dry-run"
    Result = "SUCCESS"
    Duration = 0.45
}

brain_log_action -LogEntry $testEntry

# Verify logged
Get-Content "Logs/mcp_actions.log" | Select-Object -Last 10
```

## Integration

**Called By:** brain_execute_with_mcp (Skill 18)
**Calls:** None

## References

- Constitution: `Specs/sp.constitution.md` (Section 4.3: Logging)
- Specification: `Specs/SPEC_silver_tier.md` (Section 6.2: Audit Trail)

---

**Last Updated:** 2026-02-11
**Status:** Documented (M2 Complete)
