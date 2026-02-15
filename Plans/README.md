# Plans Folder

**Purpose:** Short planning documents for projects and tasks requiring structured thinking before execution.

---

## What Plans Are Used For

Plans in this folder are lightweight strategy documents that:
- Break down complex tasks into actionable steps
- Define success criteria and deliverables
- Link to related task files in `Needs_Action/`
- Serve as reference during execution
- Capture decisions and rationale

---

## Naming Convention

**Format:** `YYYY-MM-DD__topic.md`

**Examples:**
- `2026-02-09__bronze-watcher-implementation.md`
- `2026-02-10__client-onboarding-system.md`
- `2026-02-15__database-migration-strategy.md`

---

## Structure Template

```markdown
# Plan: [Topic]

**Created:** YYYY-MM-DD
**Status:** Draft | Active | Completed | Archived

## Objective
[What we're trying to achieve]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Approach
[High-level strategy]

## Steps
1. Step 1
2. Step 2
3. Step 3

## Related Tasks
- [Link to Needs_Action/task-file.md]
- [Link to Done/completed-task.md]

## Decisions & Assumptions
- Decision: [what was decided and why]
- Assumption: [what we're assuming is true]

## Notes
[Any additional context]
```

---

## Rules

1. **Link to Tasks:** When a plan generates actionable work, create task files in `Needs_Action/` and link them here
2. **Keep Updated:** Mark plan status as you progress (Draft → Active → Completed)
3. **Preserve History:** Don't delete plans; mark as Archived when no longer relevant
4. **One Plan Per Topic:** Keep focused; split large initiatives into multiple plans

---

*Plans are thinking documents. Tasks are doing documents.*
