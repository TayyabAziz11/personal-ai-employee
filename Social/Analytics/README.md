# Social Analytics

**Purpose**: Storage for detailed social media analytics and metrics (optional, if MCP analytics tools available).

## Directory Structure

Analytics files organized by channel and metric type:
```
<channel>_<metric_type>_YYYY-MM-DD.json
```

Examples:
- `linkedin_post_analytics_2026-02-15.json` — LinkedIn post performance metrics
- `twitter_engagement_metrics_2026-02-15.json` — Twitter engagement data
- `whatsapp_message_volume_2026-02-15.json` — WhatsApp message volume stats

## Supported Metrics

### LinkedIn Analytics (via `linkedin.get_post_analytics` MCP tool)
- Post impressions, reactions, comments, shares
- Follower growth
- Profile views

### Twitter Analytics (via `twitter.get_post_metrics` MCP tool)
- Tweet impressions, likes, retweets, replies
- Follower count
- Top performing tweets

### WhatsApp Analytics (limited)
- Message volume (sent/received counts)
- Response times (if tracked)

## Data Format

All analytics stored as JSON for easy parsing:

```json
{
  "channel": "linkedin",
  "metric_type": "post_analytics",
  "date": "2026-02-15",
  "data": {
    "impressions": 1250,
    "reactions": 45,
    "comments": 12,
    "shares": 8
  }
}
```

## Generation

Analytics are queried and stored by:
- Social watchers (optional queries during runs)
- `brain_social_generate_summary` skill (queries analytics for summaries)
- `brain_generate_weekly_ceo_briefing` skill (includes top performing content)

## Use Cases

1. **Performance Optimization**: Identify best posting times, content types
2. **CEO Reporting**: Include metrics in weekly briefings
3. **Historical Tracking**: Monitor social presence growth over time

## Note

This directory may be empty if MCP analytics tools are not configured. Social summaries can still be generated using intake wrapper counts alone.

## See Also

- `Social/Summaries/` — Aggregated summaries
- `Docs/mcp_linkedin_setup.md` — LinkedIn analytics setup (G-M4)
- `Docs/mcp_twitter_setup.md` — Twitter analytics setup (G-M4)
