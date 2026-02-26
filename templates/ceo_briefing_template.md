# Weekly CEO Briefing

**Week Ending**: [YYYY-MM-DD (Sunday date)]
**Generated**: [ISO timestamp]
**Status**: On Track | At Risk | Behind Schedule

---

## 1. KPIs (Key Performance Indicators)

### Revenue Metrics
- **This Week**: $[amount] ([+/-]% vs. last week)
- **Month-to-Date**: $[amount] ([+/-]% vs. target)
- **Quarter-to-Date**: $[amount] ([+/-]% vs. target)
- **Annual Recurring Revenue (ARR)**: $[amount]

### Customer Metrics
- **Active Users**: [count] ([+/-]% vs. last week)
- **New Signups This Week**: [count]
- **Churn Rate**: [percentage]%
- **Customer Satisfaction (CSAT)**: [score]/5

### System Performance
- **Uptime**: [percentage]% (target: 95%+)
- **Average Response Time**: [duration] (target: <2h)
- **Error Rate**: [percentage]% (target: <1%)

**Data Sources**: `system_log.md`, Odoo queries (`odoo.revenue_summary`), social analytics

---

## 2. Wins

### Major Achievements This Week

1. **[Achievement Title]**
   - Description of what was accomplished
   - Impact: Revenue/customer/efficiency gain
   - Team member(s) involved

2. **[Achievement Title]**
   - Description
   - Impact
   - Contributors

3. **[Achievement Title]**
   - Description
   - Impact
   - Contributors

### Customer Feedback Highlights
- [Positive testimonial or feedback quote]
- [Customer success story]

### Milestone Completions
- [Completed project/milestone from `Done/` directory]
- [Strategic goal progress from `Business/Goals/`]

**Data Sources**: `Done/` task completions, `system_log.md`, customer feedback records

---

## 3. Risks

### Current Blockers

1. **[Risk Title]**
   - **Description**: What's the issue?
   - **Impact**: High | Medium | Low
   - **Mitigation**: What's being done to address it?
   - **ETA for Resolution**: [date or "In progress"]

2. **[Risk Title]**
   - Description
   - Impact
   - Mitigation
   - ETA

### Upcoming Challenges
- [Anticipated risk or challenge]
- [Resource constraint or dependency]

**Data Sources**: Failed tasks in `system_log.md`, blocked plans in `Pending_Approval/`, manual notes

---

## 4. Outstanding Invoices + AR Aging

### Unpaid Invoices Summary
- **Total Outstanding**: $[amount] ([count] invoices)
- **Overdue Amount**: $[amount] ([count] invoices)
- **Largest Outstanding Invoice**: $[amount] (Customer: [name], Due: [date])

### AR Aging Breakdown
| Period | Amount | Count | % of Total |
|--------|--------|-------|------------|
| Current (0-30 days) | $[amount] | [count] | [%]% |
| 31-60 days | $[amount] | [count] | [%]% |
| 61-90 days | $[amount] | [count] | [%]% |
| 90+ days | $[amount] | [count] | [%]% |
| **Total** | **$[total]** | **[count]** | **100%** |

### Collections Actions This Week
- [Invoice reminders sent]
- [Follow-up calls made]
- [Payment plans negotiated]

**Data Sources**: Odoo MCP queries (`odoo.list_unpaid_invoices`, `odoo.ar_aging_summary`)

**Note**: If Odoo is unavailable, display: "⚠️ Odoo metrics unavailable (server unreachable). Manual review recommended."

---

## 5. Social Performance

### Message Volume by Channel
| Channel | Messages Received | Responses Sent | Avg Response Time | Engagement Rate |
|---------|------------------|----------------|-------------------|-----------------|
| WhatsApp | [count] | [count] | [duration] | [%]% |
| LinkedIn | [count] | [count] | [duration] | [%]% |
| Twitter | [count] | [count] | [duration] | [%]% |
| **Total** | **[count]** | **[count]** | **[duration avg]** | **[%]%** |

### Top Performing Content
1. **[Post/Message Title]** (LinkedIn)
   - Impressions: [count]
   - Engagement: [count] likes, [count] comments, [count] shares
   - Link: [URL to post or intake wrapper]

2. **[Post/Message Title]** (Twitter)
   - Impressions: [count]
   - Engagement: [count] likes, [count] retweets, [count] replies

3. **[Conversation Topic]** (WhatsApp)
   - Messages exchanged: [count]
   - Outcome: [Sale closed / Support resolved / Ongoing]

### Social Trends
- [Observation about trending topics or common questions]
- [Recommendation for content strategy]

**Data Sources**: `Social/Summaries/`, `Social/Analytics/`, LinkedIn/Twitter MCP analytics

**Note**: If no social summaries exist, display: "ℹ️ No social activity this week."

---

## 6. Next Week Priorities

### Strategic Initiatives
1. **[Initiative Title]** (from `Business/Goals/`)
   - Objective: [what needs to be accomplished]
   - Owner: [team member or role]
   - Deadline: [date]
   - Dependencies: [if any]

2. **[Initiative Title]**
   - Objective
   - Owner
   - Deadline
   - Dependencies

### Key Deliverables
- [Deliverable 1]: [description and due date]
- [Deliverable 2]: [description and due date]
- [Deliverable 3]: [description and due date]

### Meetings & Milestones
- [Important meeting or deadline]
- [Product launch or release]

**Data Sources**: `Business/Goals/`, project roadmaps, `Scheduled/` tasks

---

## 7. Pending Approvals

### Actions Awaiting Executive Decision
- **Count**: [number] plans in `Pending_Approval/`

#### High-Priority Approvals
1. **[Plan Title]** (Priority: High)
   - **Action**: [what action is proposed]
   - **Impact**: [potential outcome or risk]
   - **Waiting Since**: [date/time]
   - **Location**: `Pending_Approval/[filename]`

2. **[Plan Title]** (Priority: Medium)
   - Action
   - Impact
   - Waiting Since
   - Location

### Approval Turnaround Time
- **Average Wait Time**: [duration] (target: <24h)
- **Longest Pending**: [duration] ([plan title])

**Data Sources**: File count and metadata in `Pending_Approval/` directory

---

## 8. Summary

### Executive Overview

[3-5 sentence summary of the week]

**This week, [key achievement or metric]. Revenue [increased/decreased] by [%]%, driven by [factor]. Social performance was [strong/on track/needs improvement] with [highlight]. [Risk or challenge] remains the primary concern, with [mitigation strategy] in progress. Overall, we are [on track/at risk/behind schedule] for [strategic goal] and expect to [next week priority].**

### Overall Status
- **Strategic Goals Progress**: [%]% complete (on track for [quarter/year] targets)
- **Financial Health**: [Strong | Healthy | Concerning] (based on revenue + AR aging)
- **Operational Excellence**: [Excellent | Good | Needs Improvement] (based on uptime + response time)

### Recommended Actions
1. [Executive decision or strategic adjustment needed]
2. [Resource allocation or hiring recommendation]
3. [Process improvement or risk mitigation]

---

**Generated by**: `brain_generate_weekly_ceo_briefing` skill (version [version])
**Data Sources**: `Business/Goals/`, `system_log.md`, `Done/`, `Social/Summaries/`, `Social/Analytics/`, Odoo MCP queries
**Next Briefing**: [YYYY-MM-DD (next Sunday)]

---

## Appendix (Optional)

### Detailed Metrics
- [Link to detailed analytics reports]
- [Link to full social summaries]
- [Link to Odoo dashboard]

### Change Log
- [Notable changes from last week's briefing format or data sources]
