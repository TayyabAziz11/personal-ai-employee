# LinkedIn MCP Server Setup

**Purpose**: Configure LinkedIn API integration for perception (QUERY tools) and action (ACTION tools with approval)

**Tier**: Gold (G-M4)

---

## Prerequisites

- LinkedIn account (personal or company page)
- LinkedIn Developer App created
- API access approved by LinkedIn

---

## Required Credentials

LinkedIn API requires:
1. **Client ID** (from LinkedIn Developer App)
2. **Client Secret** (from LinkedIn Developer App)
3. **Access Token** (OAuth 2.0, refreshable)
4. **Refresh Token** (for token renewal)
5. **Member ID / Organization ID** (your profile or company page)

---

## Setup Methods

### Method 1: Environment Variables (Recommended for Development)

Create or update `.env` file in vault root:

```bash
# LinkedIn API Credentials
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_ACCESS_TOKEN=your_access_token_here
LINKEDIN_REFRESH_TOKEN=your_refresh_token_here
LINKEDIN_MEMBER_ID=your_member_id_here
```

**IMPORTANT**: NEVER commit `.env` to git. It's covered by `.gitignore`.

### Method 2: Credentials File (Recommended for Production)

Create `.secrets/linkedin_credentials.json`:

```json
{
  "client_id": "your_client_id_here",
  "client_secret": "your_client_secret_here",
  "access_token": "your_access_token_here",
  "refresh_token": "your_refresh_token_here",
  "member_id": "your_member_id_here",
  "api_version": "202401",
  "scopes": ["r_liteprofile", "r_emailaddress", "w_member_social"]
}
```

**File permissions**: `chmod 600 .secrets/linkedin_credentials.json`

---

## Obtaining Credentials

### Step 1: Create LinkedIn Developer App

1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill in app details:
   - App name: "Personal AI Employee"
   - LinkedIn Page: Select your company page or personal profile
   - App logo: Optional
4. Click "Create app"

### Step 2: Configure App Products

1. In app settings, go to "Products"
2. Request access to:
   - **Sign In with LinkedIn** (required)
   - **Share on LinkedIn** (required for posting)
   - **Marketing Developer Platform** (optional, for analytics)

3. Wait for approval (usually instant for Sign In, may take days for others)

### Step 3: Get Client ID and Secret

1. In app settings, go to "Auth"
2. Copy **Client ID** and **Client Secret**
3. Add redirect URL: `http://localhost:8000/callback` (for OAuth flow)

### Step 4: Generate Access Token

**Option A: Use OAuth 2.0 Authorization Code Flow (Recommended)**

1. Build authorization URL:
   ```
   https://www.linkedin.com/oauth/v2/authorization?
   response_type=code&
   client_id=YOUR_CLIENT_ID&
   redirect_uri=http://localhost:8000/callback&
   scope=r_liteprofile%20r_emailaddress%20w_member_social
   ```

2. Visit URL in browser, authorize app
3. Copy authorization code from redirect URL
4. Exchange code for access token:
   ```bash
   curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
     -d grant_type=authorization_code \
     -d code=YOUR_AUTH_CODE \
     -d redirect_uri=http://localhost:8000/callback \
     -d client_id=YOUR_CLIENT_ID \
     -d client_secret=YOUR_CLIENT_SECRET
   ```

5. Response includes `access_token` and `refresh_token`

**Option B: Use LinkedIn OAuth Helper Tool**

Use a tool like Postman or create a simple Python script with `requests-oauthlib`.

### Step 5: Get Member ID

```bash
# Use access token to get profile
curl -X GET 'https://api.linkedin.com/v2/me' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'

# Extract "id" from response
```

---

## MCP Server Configuration

The LinkedIn MCP server provides these tools:

### QUERY Tools (Perception - No Approval Required)
- `linkedin.list_notifications` - List recent notifications
- `linkedin.get_post` - Get specific post details
- `linkedin.get_post_analytics` - Get post performance metrics
- `linkedin.search_posts` - Search for posts

### ACTION Tools (Execution - Approval Required)
- `linkedin.create_post` - Create new post
- `linkedin.reply_comment` - Reply to comment
- `linkedin.send_message` - Send direct message
- `linkedin.react_to_post` - React (like, celebrate, etc.)

---

## Validation Steps

### Test Query Tools (Perception)

Run the LinkedIn watcher in MCP mode:

```bash
# Test connection with MCP query tools
python linkedin_watcher_skill.py --mode mcp --once --max-results 5

# Expected output:
# ✅ LinkedIn watcher complete: 5 scanned, X created, Y skipped, 0 errors
```

### Test MCP Registry Discovery

```bash
# Refresh MCP tool registry
python brain_mcp_registry_refresh_skill.py --server linkedin

# Check snapshot
cat Logs/mcp_tools_snapshot_linkedin.json
```

---

## Troubleshooting

### Error: "Invalid access token"
- **Cause**: Token expired (LinkedIn access tokens last 60 days)
- **Fix**: Use refresh token to get new access token
- **Refresh command**:
  ```bash
  curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
    -d grant_type=refresh_token \
    -d refresh_token=YOUR_REFRESH_TOKEN \
    -d client_id=YOUR_CLIENT_ID \
    -d client_secret=YOUR_CLIENT_SECRET
  ```

### Error: "Insufficient permissions"
- **Cause**: App doesn't have required scopes
- **Fix**: Request additional products in LinkedIn Developer Console
- **Required scopes**: `r_liteprofile`, `r_emailaddress`, `w_member_social`

### Error: "Rate limit exceeded"
- **Cause**: Too many API calls
- **Fix**: Wait for rate limit reset (usually 15 minutes)
- **Prevention**: Use `rate_limit_and_backoff` helper

### Error: "Member not found"
- **Cause**: Incorrect member ID
- **Fix**: Re-fetch member ID using `/v2/me` endpoint

---

## Security Best Practices

1. **Never commit credentials** to git
2. **Rotate tokens** every 30 days
3. **Use HTTPS** for all OAuth redirects
4. **Validate redirect URIs** in LinkedIn app settings
5. **Enable webhook signature validation** for incoming events
6. **Monitor API usage** in LinkedIn Developer Console

---

## Rate Limits (LinkedIn API)

- **General API calls**: 100 requests per day (default)
- **Posting**: 150 posts per day per member
- **Messaging**: 100 messages per day
- **Analytics**: 1,000 requests per day

**Note**: Rate limits vary by LinkedIn plan and app approval status.

---

## References

- [LinkedIn API Documentation](https://learn.microsoft.com/en-us/linkedin/)
- [OAuth 2.0 Authorization](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)

---

**Last Updated**: 2026-02-15
**Version**: 1.0.0 (Gold Tier - G-M4)
