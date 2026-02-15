# Business Goals

**Purpose**: Storage for strategic business objectives and goals (quarterly, annual).

## Directory Structure

Goals files organized by time period:
```
YYYY_<period>_goals.md
```

Examples:
- `2026_Q1_goals.md` — Q1 2026 strategic objectives
- `2026_annual_goals.md` — Annual goals for 2026
- `2026_H1_okrs.md` — H1 OKRs (Objectives and Key Results)

## Content Format

Each goals file contains:

### 1. **Goal Title**
Clear, concise objective statement.

### 2. **Description**
Detailed explanation of the goal, its importance, and expected outcomes.

### 3. **Target Metrics**
Quantifiable success criteria (KPIs):
- Revenue targets (e.g., "Achieve $500K ARR")
- Customer metrics (e.g., "Reach 1,000 active users")
- Efficiency gains (e.g., "Reduce response time by 50%")

### 4. **Current Status**
Progress tracking:
- On track / At risk / Behind schedule
- Current vs. target metrics
- Completion percentage

### 5. **Risks**
Potential obstacles and mitigation strategies.

### 6. **Related Initiatives**
Links to specific plans, tasks, or projects supporting this goal.

## Example Goal Structure

```markdown
## Goal 1: Expand Multi-Channel Social Presence

**Description**: Establish active presence on WhatsApp, LinkedIn, and Twitter to engage with customers and prospects directly, reducing response time from 24h to 2h.

**Target Metrics**:
- WhatsApp: 100+ active conversations/month
- LinkedIn: 500+ post impressions/week
- Twitter: 200+ mentions/month
- Response time: <2 hours (80% of messages)

**Current Status**: In Progress (60% complete)
- WhatsApp: 45 conversations/month (45% of target)
- LinkedIn: 320 impressions/week (64% of target)
- Response time: 4.5 hours average

**Risks**:
- MCP server downtime → Mitigation: Mock mode + graceful degradation
- Rate limiting → Mitigation: Exponential backoff + monitoring

**Related Initiatives**:
- Gold Tier implementation (G-M3, G-M4)
- Social watcher automation (scheduled tasks)
```

## Use Cases

1. **CEO Briefings**: Weekly briefings include progress toward strategic goals
2. **Team Alignment**: Ensure all work ties back to strategic objectives
3. **Performance Review**: Quarterly/annual goal retrospectives

## See Also

- `Business/Briefings/` — Weekly CEO briefings reference goals
- `system_log.md` — Activity log showing goal-related work
- `Done/` — Completed tasks contributing to goals
