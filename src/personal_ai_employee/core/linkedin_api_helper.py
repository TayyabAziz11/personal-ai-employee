#!/usr/bin/env python3
"""
LinkedIn API Helper - OAuth2 Authentication + API Operations

Purpose: Provide authenticated LinkedIn API access for watcher (query) and executor (action) operations
Tier: Gold
OAuth Flow: Authorization Code Flow with PKCE (recommended for security)

Security:
- Credentials: .secrets/linkedin_credentials.json (client_id, client_secret, redirect_uri)
- Token: .secrets/linkedin_token.json (access_token, refresh_token, expires_at)
- PII redaction: All logs use redact_pii()
- Rate limiting: Exponential backoff on 429 errors

LinkedIn API Docs: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
"""

import json
import logging
import os
import time
import webbrowser
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import requests
from urllib.parse import urlencode, parse_qs, urlparse

# Configure logging
logger = logging.getLogger(__name__)

# Import mcp_helpers for PII redaction and repo root
try:
    from personal_ai_employee.core.mcp_helpers import redact_pii, get_repo_root
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from personal_ai_employee.core.mcp_helpers import redact_pii, get_repo_root


class LinkedInAPIError(Exception):
    """LinkedIn API error"""
    pass


class LinkedInAuthError(Exception):
    """LinkedIn authentication error"""
    pass


class LinkedInAPIHelper:
    """
    LinkedIn API helper with OAuth2 authentication.

    Features:
    - OAuth2 authorization code flow
    - Token refresh (if LinkedIn provides refresh tokens)
    - Rate limiting with exponential backoff
    - PII redaction in all logs
    - Graceful error handling
    """

    # LinkedIn OAuth2 endpoints
    AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
    TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    USERINFO_URL = "https://api.linkedin.com/v2/userinfo"  # OpenID Connect userinfo endpoint

    # LinkedIn API base URL
    API_BASE = "https://api.linkedin.com/v2"

    # Rate limiting defaults
    MAX_RETRIES = 3
    INITIAL_BACKOFF = 1  # seconds

    def __init__(self, secrets_dir: Optional[Path] = None):
        """
        Initialize LinkedIn API helper.

        Args:
            secrets_dir: Path to .secrets directory (default: repo_root/.secrets)
        """
        if secrets_dir is None:
            repo_root = get_repo_root()
            secrets_dir = repo_root / ".secrets"

        self.secrets_dir = Path(secrets_dir)
        self.credentials_file = self.secrets_dir / "linkedin_credentials.json"
        self.token_file = self.secrets_dir / "linkedin_token.json"

        self._credentials = None
        self._token = None

        logger.info(f"LinkedIn API helper initialized (secrets_dir={self.secrets_dir})")

    def _load_credentials(self) -> Dict[str, str]:
        """
        Load LinkedIn app credentials from .secrets/linkedin_credentials.json.

        Expected format:
        {
            "client_id": "YOUR_CLIENT_ID",
            "client_secret": "YOUR_CLIENT_SECRET",
            "redirect_uri": "http://localhost:8080/callback",
            "scopes": ["openid", "profile", "email", "w_member_social"]  // Optional
        }

        Returns:
            Dict with client_id, client_secret, redirect_uri, scopes (optional)

        Raises:
            LinkedInAuthError: If credentials file missing or invalid
        """
        if self._credentials is not None:
            return self._credentials

        if not self.credentials_file.exists():
            raise LinkedInAuthError(
                f"Credentials file not found: {self.credentials_file}\n"
                "Create .secrets/linkedin_credentials.json with:\n"
                '{\n'
                '  "client_id": "YOUR_CLIENT_ID",\n'
                '  "client_secret": "YOUR_CLIENT_SECRET",\n'
                '  "redirect_uri": "http://localhost:8080/callback",\n'
                '  "scopes": ["openid", "profile", "email", "w_member_social"]\n'
                '}'
            )

        try:
            with open(self.credentials_file, 'r') as f:
                creds = json.load(f)

            required_keys = ['client_id', 'client_secret', 'redirect_uri']
            missing_keys = [k for k in required_keys if k not in creds]
            if missing_keys:
                raise LinkedInAuthError(
                    f"Missing required keys in credentials file: {missing_keys}"
                )

            self._credentials = creds
            logger.info("LinkedIn credentials loaded successfully")
            return self._credentials

        except json.JSONDecodeError as e:
            raise LinkedInAuthError(f"Invalid JSON in credentials file: {e}")

    def _load_token(self) -> Optional[Dict[str, Any]]:
        """
        Load access token from .secrets/linkedin_token.json.

        Expected format:
        {
            "access_token": "TOKEN",
            "expires_at": "2026-02-18T12:00:00Z",
            "refresh_token": "REFRESH_TOKEN" (optional)
        }

        Returns:
            Dict with access_token, expires_at, refresh_token (if available), or None if not found
        """
        if self._token is not None:
            return self._token

        if not self.token_file.exists():
            logger.warning(f"Token file not found: {self.token_file}")
            return None

        try:
            with open(self.token_file, 'r') as f:
                token = json.load(f)

            self._token = token
            logger.info("LinkedIn token loaded successfully")
            return self._token

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in token file: {e}")
            return None

    def _save_token(self, token: Dict[str, Any]):
        """
        Save access token to .secrets/linkedin_token.json.

        Args:
            token: Dict with access_token, expires_in (or expires_at), refresh_token (optional)
        """
        # Ensure .secrets directory exists
        self.secrets_dir.mkdir(parents=True, exist_ok=True)

        # Calculate expires_at if not provided
        if 'expires_at' not in token and 'expires_in' in token:
            expires_in = int(token['expires_in'])
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            token['expires_at'] = expires_at.isoformat() + 'Z'

        # Save token
        with open(self.token_file, 'w') as f:
            json.dump(token, f, indent=2)

        # Secure file permissions (owner read/write only)
        os.chmod(self.token_file, 0o600)

        self._token = token
        logger.info("LinkedIn token saved successfully")

    def _is_token_expired(self, token: Dict[str, Any]) -> bool:
        """
        Check if access token is expired.

        Args:
            token: Dict with expires_at field

        Returns:
            True if expired or expires in <5 minutes
        """
        if 'expires_at' not in token:
            logger.warning("Token has no expires_at field, assuming expired")
            return True

        expires_at = datetime.fromisoformat(token['expires_at'].replace('Z', '+00:00'))
        now = datetime.utcnow()

        # Consider expired if <5 minutes remaining
        time_remaining = (expires_at - now).total_seconds()
        is_expired = time_remaining < 300

        if is_expired:
            logger.info(f"Token expired or expiring soon (time_remaining={time_remaining}s)")

        return is_expired

    def get_authorization_url(self, state: Optional[str] = None, scope: Optional[str] = None) -> str:
        """
        Generate LinkedIn OAuth2 authorization URL.

        Args:
            state: Optional state parameter for CSRF protection
            scope: Optional space-separated scopes
                   Default: "openid profile email w_member_social" (OpenID Connect scopes)
                   Can be overridden via credentials file "scopes" field

        Returns:
            Authorization URL to redirect user to

        Note: User must visit this URL, authorize, and you'll receive a code at redirect_uri

        Scopes:
        - openid: OpenID Connect authentication
        - profile: Read basic profile (name, photo) via OIDC userinfo endpoint
        - email: Read email address via OIDC userinfo endpoint
        - w_member_social: Post content as user (requires "Share on LinkedIn" product)

        Legacy scopes (deprecated for new apps):
        - r_liteprofile: Read profile (replaced by "profile")
        - r_emailaddress: Read email (replaced by "email")
        """
        creds = self._load_credentials()

        if scope is None:
            # Check if scopes defined in credentials file
            if 'scopes' in creds and isinstance(creds['scopes'], list):
                scope = ' '.join(creds['scopes'])
                logger.info(f"Using scopes from credentials file: {creds['scopes']}")
            else:
                # Default to OpenID Connect scopes (recommended for new LinkedIn apps)
                # openid: OpenID Connect authentication
                # profile: Read basic profile via userinfo endpoint
                # email: Read email via userinfo endpoint
                # w_member_social: Post content as user
                scope = "openid profile email w_member_social"
                logger.info("Using default OpenID Connect scopes")

        if state is None:
            state = str(int(time.time()))

        params = {
            'response_type': 'code',
            'client_id': creds['client_id'],
            'redirect_uri': creds['redirect_uri'],
            'state': state,
            'scope': scope
        }

        auth_url = f"{self.AUTH_URL}?{urlencode(params)}"
        logger.info(f"Authorization URL generated (state={state}, scope={redact_pii(scope)})")

        return auth_url

    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.

        Args:
            code: Authorization code from callback URL

        Returns:
            Token dict with access_token, expires_in, refresh_token (if provided)

        Raises:
            LinkedInAuthError: If token exchange fails
        """
        creds = self._load_credentials()

        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': creds['redirect_uri'],
            'client_id': creds['client_id'],
            'client_secret': creds['client_secret']
        }

        logger.info("Exchanging authorization code for access token...")

        try:
            response = requests.post(self.TOKEN_URL, data=data, timeout=30)
            response.raise_for_status()

            token = response.json()

            if 'access_token' not in token:
                raise LinkedInAuthError(f"No access_token in response: {token}")

            logger.info("Access token obtained successfully")

            # Save token
            self._save_token(token)

            return token

        except requests.exceptions.RequestException as e:
            logger.error(f"Token exchange failed: {e}")
            raise LinkedInAuthError(f"Failed to exchange code for token: {e}")

    def refresh_access_token(self) -> Dict[str, Any]:
        """
        Refresh access token using refresh token (if LinkedIn provides one).

        Returns:
            New token dict

        Raises:
            LinkedInAuthError: If refresh fails or no refresh token available

        Note: LinkedIn may not provide refresh tokens. Check API docs for current behavior.
        """
        token = self._load_token()

        if token is None or 'refresh_token' not in token:
            raise LinkedInAuthError(
                "No refresh token available. User must re-authorize.\n"
                "LinkedIn may not provide refresh tokens depending on app configuration."
            )

        creds = self._load_credentials()

        data = {
            'grant_type': 'refresh_token',
            'refresh_token': token['refresh_token'],
            'client_id': creds['client_id'],
            'client_secret': creds['client_secret']
        }

        logger.info("Refreshing access token...")

        try:
            response = requests.post(self.TOKEN_URL, data=data, timeout=30)
            response.raise_for_status()

            new_token = response.json()

            if 'access_token' not in new_token:
                raise LinkedInAuthError(f"No access_token in refresh response: {new_token}")

            logger.info("Access token refreshed successfully")

            # Save new token
            self._save_token(new_token)

            return new_token

        except requests.exceptions.RequestException as e:
            logger.error(f"Token refresh failed: {e}")
            raise LinkedInAuthError(f"Failed to refresh token: {e}")

    def get_access_token(self) -> str:
        """
        Get valid access token (refresh if expired).

        Returns:
            Valid access token

        Raises:
            LinkedInAuthError: If no token available or refresh fails
        """
        token = self._load_token()

        if token is None:
            raise LinkedInAuthError(
                "No access token found. Run OAuth flow first:\n"
                "1. Get authorization URL: helper.get_authorization_url()\n"
                "2. User authorizes at that URL\n"
                "3. Exchange code: helper.exchange_code_for_token(code)"
            )

        # Check if expired
        if self._is_token_expired(token):
            logger.info("Token expired, attempting refresh...")
            try:
                token = self.refresh_access_token()
            except LinkedInAuthError:
                logger.error("Token refresh failed. User must re-authorize.")
                raise

        return token['access_token']

    def check_auth(self) -> Dict[str, Any]:
        """
        Check authentication status and get user profile.

        Supports both:
        - OpenID Connect (OIDC) tokens: Uses /v2/userinfo endpoint
        - Legacy tokens: Falls back to /v2/me endpoint

        Returns:
            Dict with status, profile (if authenticated), error (if failed)

        Example response:
        {
            "status": "authenticated",
            "profile": {"sub": "...", "name": "...", "email": "..."},  # OIDC
            "auth_method": "oidc"
        }
        OR
        {
            "status": "authenticated",
            "profile": {"id": "...", "localizedFirstName": "...", ...},  # Legacy
            "auth_method": "legacy"
        }
        OR
        {
            "status": "unauthenticated",
            "error": "No token found"
        }
        """
        try:
            access_token = self.get_access_token()

            headers = {
                'Authorization': f'Bearer {access_token}'
            }

            # Try OpenID Connect userinfo endpoint first (for OIDC tokens)
            try:
                response = requests.get(
                    self.USERINFO_URL,
                    headers=headers,
                    timeout=30
                )

                if response.status_code == 200:
                    profile = response.json()
                    logger.info(f"OIDC authentication verified (sub={profile.get('sub', 'unknown')})")
                    return {
                        'status': 'authenticated',
                        'profile': profile,
                        'auth_method': 'oidc'
                    }
                elif response.status_code == 401:
                    logger.warning("OIDC userinfo returned 401, trying legacy /me endpoint")
                else:
                    logger.warning(f"OIDC userinfo failed ({response.status_code}), trying legacy /me endpoint")

            except Exception as e:
                logger.warning(f"OIDC userinfo request failed: {e}, trying legacy /me endpoint")

            # Fall back to legacy /me endpoint (for old token scopes)
            headers['X-Restli-Protocol-Version'] = '2.0.0'

            response = requests.get(
                f"{self.API_BASE}/me",
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                profile = response.json()
                logger.info(f"Legacy authentication verified (user_id={profile.get('id', 'unknown')})")
                return {
                    'status': 'authenticated',
                    'profile': profile,
                    'auth_method': 'legacy'
                }
            elif response.status_code == 401:
                logger.error("Token invalid (401 Unauthorized)")
                return {
                    'status': 'unauthenticated',
                    'error': '401 Unauthorized - Token invalid or expired'
                }
            else:
                logger.error(f"Auth check failed: {response.status_code} {response.text}")
                return {
                    'status': 'error',
                    'error': f"{response.status_code}: {response.text}"
                }

        except LinkedInAuthError as e:
            logger.error(f"Auth check failed: {e}")
            return {
                'status': 'unauthenticated',
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Auth check failed: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }

    def _api_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """
        Make authenticated API request with rate limiting and retries.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (e.g., "/me")
            **kwargs: Additional arguments for requests (json, params, etc.)

        Returns:
            Response object

        Raises:
            LinkedInAPIError: If request fails after retries
        """
        access_token = self.get_access_token()

        headers = kwargs.pop('headers', {})
        headers.update({
            'Authorization': f'Bearer {access_token}',
            'X-Restli-Protocol-Version': '2.0.0'
        })

        if 'json' in kwargs:
            headers['Content-Type'] = 'application/json'

        url = f"{self.API_BASE}{endpoint}" if endpoint.startswith('/') else f"{self.API_BASE}/{endpoint}"

        # Retry loop with exponential backoff
        backoff = self.INITIAL_BACKOFF
        for attempt in range(self.MAX_RETRIES):
            try:
                logger.debug(f"API request: {method} {url} (attempt {attempt + 1}/{self.MAX_RETRIES})")

                response = requests.request(
                    method,
                    url,
                    headers=headers,
                    timeout=30,
                    **kwargs
                )

                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', backoff))
                    logger.warning(f"Rate limited (429). Retrying after {retry_after}s...")
                    time.sleep(retry_after)
                    backoff *= 2
                    continue

                # Raise for other errors
                response.raise_for_status()

                return response

            except requests.exceptions.RequestException as e:
                logger.error(f"API request failed (attempt {attempt + 1}): {e}")
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    raise LinkedInAPIError(f"API request failed after {self.MAX_RETRIES} attempts: {e}")

        raise LinkedInAPIError(f"API request failed after {self.MAX_RETRIES} attempts")

    # ============================================================================
    # QUERY METHODS (Perception - Read-Only)
    # ============================================================================

    def list_notifications(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        List recent notifications (if API supports it).

        Note: LinkedIn Social API may not provide notifications endpoint.
        Check current API documentation.

        Args:
            limit: Max number of notifications to return

        Returns:
            List of notification dicts
        """
        logger.warning("LinkedIn notifications endpoint may not be available in current API")

        # Placeholder - actual endpoint depends on LinkedIn API version
        # This is a mock implementation
        return []

    def list_ugc_posts(self, author_urn: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        List recent UGC (User Generated Content) posts by author.

        Args:
            author_urn: Author URN (e.g., "urn:li:person:ABC123")
            limit: Max number of posts to return

        Returns:
            List of post dicts
        """
        params = {
            'q': 'author',
            'author': author_urn,
            'count': limit
        }

        try:
            response = self._api_request('GET', '/ugcPosts', params=params)
            data = response.json()

            posts = data.get('elements', [])
            logger.info(f"Retrieved {len(posts)} UGC posts for author {author_urn}")

            return posts

        except LinkedInAPIError as e:
            logger.error(f"Failed to list UGC posts: {e}")
            return []

    # ============================================================================
    # ACTION METHODS (Execution - Write Operations)
    # ============================================================================

    def create_post(self, text: str, visibility: str = "PUBLIC") -> Dict[str, Any]:
        """
        Create a LinkedIn post (UGC).

        Args:
            text: Post text content
            visibility: Visibility setting (PUBLIC, CONNECTIONS, PRIVATE)

        Returns:
            Created post dict with id

        Raises:
            LinkedInAPIError: If post creation fails
        """
        # Get authenticated user URN
        auth_result = self.check_auth()
        if auth_result['status'] != 'authenticated':
            raise LinkedInAPIError(f"Not authenticated: {auth_result.get('error')}")

        user_id = auth_result['profile']['id']
        author_urn = f"urn:li:person:{user_id}"

        # LinkedIn UGC Post API payload
        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": text
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": visibility
            }
        }

        logger.info(f"Creating LinkedIn post (visibility={visibility}, text_length={len(text)})")

        try:
            response = self._api_request('POST', '/ugcPosts', json=payload)
            post_data = response.json()

            post_id = post_data.get('id', 'unknown')
            logger.info(f"Post created successfully (id={post_id})")

            return post_data

        except LinkedInAPIError as e:
            logger.error(f"Failed to create post: {e}")
            raise

    def reply_comment(self, comment_id: str, text: str) -> Dict[str, Any]:
        """
        Reply to a comment (if API supports it).

        Note: LinkedIn Social API may have limited comment interaction.
        Check current API documentation.

        Args:
            comment_id: Comment URN
            text: Reply text

        Returns:
            Reply dict
        """
        logger.warning("LinkedIn comment reply endpoint may not be available in current API")
        raise LinkedInAPIError("Comment reply not implemented - check LinkedIn API docs for current capabilities")

    def send_message(self, recipient_urn: str, text: str) -> Dict[str, Any]:
        """
        Send a direct message (if API supports it).

        Note: LinkedIn Messaging API may require additional permissions/review.
        Check current API documentation.

        Args:
            recipient_urn: Recipient URN (e.g., "urn:li:person:ABC123")
            text: Message text

        Returns:
            Message dict
        """
        logger.warning("LinkedIn messaging endpoint may require additional permissions")
        raise LinkedInAPIError("Messaging not implemented - check LinkedIn API docs for Messaging API access")


def run_oauth_server_and_get_code(auth_url: str, timeout: int = 300) -> Optional[str]:
    """
    Start local HTTP server on port 8080, open browser, and wait for OAuth callback.

    Args:
        auth_url: Authorization URL to open in browser
        timeout: Max seconds to wait for callback (default 5 minutes)

    Returns:
        Authorization code or None if timeout/error
    """
    import webbrowser
    from http.server import HTTPServer, BaseHTTPRequestHandler
    import threading

    code_container = {'code': None, 'error': None}

    class OAuthCallbackHandler(BaseHTTPRequestHandler):
        """Handle OAuth callback from LinkedIn"""

        def log_message(self, format, *args):
            """Suppress default logging"""
            pass

        def do_GET(self):
            """Handle GET request (OAuth callback)"""
            try:
                parsed = urlparse(self.path)
                query_params = parse_qs(parsed.query)

                if 'code' in query_params:
                    code_container['code'] = query_params['code'][0]

                    # Send success response
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()

                    success_html = """
                    <html>
                    <head><title>LinkedIn Authorization Success</title></head>
                    <body style="font-family: Arial; text-align: center; padding-top: 100px;">
                        <h1 style="color: green;">✅ Authorization Successful!</h1>
                        <p>You can close this window and return to the terminal.</p>
                    </body>
                    </html>
                    """
                    self.wfile.write(success_html.encode())

                elif 'error' in query_params:
                    code_container['error'] = query_params['error'][0]

                    # Send error response
                    self.send_response(400)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()

                    error_html = f"""
                    <html>
                    <head><title>LinkedIn Authorization Error</title></head>
                    <body style="font-family: Arial; text-align: center; padding-top: 100px;">
                        <h1 style="color: red;">❌ Authorization Failed</h1>
                        <p>Error: {query_params['error'][0]}</p>
                        <p>Please close this window and try again.</p>
                    </body>
                    </html>
                    """
                    self.wfile.write(error_html.encode())

            except Exception as e:
                logger.error(f"Callback handler error: {e}")
                code_container['error'] = str(e)

    try:
        # Start server on port 8080
        server = HTTPServer(('localhost', 8080), OAuthCallbackHandler)
        server.timeout = timeout

        # Run server in background thread
        server_thread = threading.Thread(target=server.handle_request)
        server_thread.daemon = True
        server_thread.start()

        print(f"\n🌐 Opening browser for LinkedIn authorization...")
        print(f"   (Local server listening on http://localhost:8080)")

        # Open browser with authorization URL
        webbrowser.open(auth_url)

        # Wait for callback or timeout
        server_thread.join(timeout)

        # Shutdown server
        server.server_close()

        if code_container['code']:
            return code_container['code']
        elif code_container['error']:
            print(f"\n❌ Authorization error: {code_container['error']}")
            return None
        else:
            print(f"\n⏱️  Timeout waiting for authorization callback ({timeout}s)")
            return None

    except OSError as e:
        if 'Address already in use' in str(e):
            print(f"\n❌ Port 8080 is already in use. Please close other applications using this port.")
        else:
            print(f"\n❌ Server error: {e}")
        return None
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return None


def show_status():
    """Show current LinkedIn OAuth status"""
    print("=" * 70)
    print("LinkedIn OAuth2 Status")
    print("=" * 70)

    helper = LinkedInAPIHelper()
    auth_result = helper.check_auth()

    if auth_result['status'] == 'authenticated':
        profile = auth_result['profile']
        token_data = helper._load_token()
        auth_method = auth_result.get('auth_method', 'unknown')

        print(f"\n✅ Status: AUTHENTICATED")
        print(f"   Method: {auth_method.upper()}")

        print(f"\n📋 Profile:")
        # Handle both OIDC and legacy profile formats
        if auth_method == 'oidc':
            # OIDC format: sub, name, email, picture
            print(f"   ID: {profile.get('sub', 'unknown')}")
            print(f"   Name: {profile.get('name', profile.get('given_name', '') + ' ' + profile.get('family_name', ''))}")
            if 'email' in profile:
                print(f"   Email: {profile.get('email')}")
        else:
            # Legacy format: id, localizedFirstName, localizedLastName
            print(f"   ID: {profile.get('id', 'unknown')}")
            print(f"   Name: {profile.get('localizedFirstName', 'unknown')} {profile.get('localizedLastName', '')}")

        if token_data:
            print(f"\n🔑 Token:")
            print(f"   File: {helper.token_file}")
            print(f"   Expires at: {token_data.get('expires_at', 'unknown')}")

            # Check expiration
            if 'expires_at' in token_data:
                try:
                    expires_at = datetime.fromisoformat(token_data['expires_at'].replace('Z', '+00:00'))
                    now = datetime.now(expires_at.tzinfo)
                    time_remaining = expires_at - now

                    if time_remaining.total_seconds() > 0:
                        days = time_remaining.days
                        print(f"   Time remaining: {days} days")
                    else:
                        print(f"   ⚠️  Token EXPIRED")
                except Exception as e:
                    logger.debug(f"Failed to parse expiry: {e}")

        print(f"\n✅ LinkedIn API access is ready")
        print(f"\n💡 Test with:")
        print(f"   python3 scripts/linkedin_watcher_skill.py --mode real --once")

    else:
        error = auth_result.get('error', 'Unknown error')
        print(f"\n❌ Status: NOT AUTHENTICATED")
        print(f"   Error: {error}")
        print(f"\n🔧 To authenticate, run:")
        print(f"   python3 scripts/linkedin_oauth_helper.py --init")

    print("\n" + "=" * 70)


def init_oauth():
    """Initialize OAuth flow with browser auto-open and local server"""
    import sys

    print("=" * 70)
    print("LinkedIn OAuth2 Authorization Flow")
    print("=" * 70)

    helper = LinkedInAPIHelper()

    # Step 1: Check if already authenticated
    print("\nStep 1: Checking existing authentication...")
    auth_result = helper.check_auth()

    if auth_result['status'] == 'authenticated':
        print(f"\n✅ Already authenticated!")
        profile = auth_result['profile']
        print(f"   User: {profile.get('localizedFirstName', 'unknown')}")
        print(f"\nTo re-authenticate, delete: {helper.token_file}")
        return

    print(f"⚠️  Not authenticated: {auth_result.get('error', 'No token found')}")

    # Step 2: Generate authorization URL
    print("\nStep 2: Generating authorization URL...")
    auth_url = helper.get_authorization_url()

    print("\n" + "=" * 70)
    print("BROWSER AUTHORIZATION")
    print("=" * 70)
    print("\nYour browser will open automatically in 3 seconds...")
    print("Please authorize the application in the browser window.")
    print("\n💡 WSL Users: If browser doesn't open automatically,")
    print("   copy the URL below and paste it into your Windows browser.")
    print("\nIf browser doesn't open, visit this URL manually:")
    print(f"\n   {auth_url}\n")
    print("=" * 70)

    time.sleep(3)

    # Step 3: Start local server and open browser
    print("\nStep 3: Starting local server and opening browser...")
    code = run_oauth_server_and_get_code(auth_url, timeout=300)

    if not code:
        print(f"\n❌ Failed to obtain authorization code")
        print(f"\nTroubleshooting:")
        print(f"1. Ensure port 8080 is not in use")
        print(f"2. Check redirect URI in LinkedIn app settings: http://localhost:8080/callback")
        print(f"3. If you see 'invalid_scope' error in browser:")
        print(f"   - This usually means required Products are not enabled in your LinkedIn app")
        print(f"   - Enable 'Share on LinkedIn' product for w_member_social scope")
        print(f"   - Enable 'Sign In with LinkedIn using OpenID Connect' for profile/email scopes")
        print(f"   - Go to: https://www.linkedin.com/developers/apps")
        print(f"4. WSL users: If browser didn't open, copy/paste the URL manually into Windows browser")
        print(f"5. Try again with: python3 scripts/linkedin_oauth_helper.py --init")
        sys.exit(1)

    print(f"\n✅ Authorization code received: {code[:20]}...")

    # Step 4: Exchange code for token
    print("\nStep 4: Exchanging code for access token...")
    try:
        token = helper.exchange_code_for_token(code)
        print(f"\n✅ Access token obtained!")
        print(f"   Expires at: {token.get('expires_at', 'unknown')}")
        print(f"   Token saved to: {helper.token_file}")

    except LinkedInAuthError as e:
        print(f"\n❌ Token exchange failed: {e}")
        sys.exit(1)

    # Step 5: Verify authentication
    print("\nStep 5: Verifying authentication...")
    auth_result = helper.check_auth()

    if auth_result['status'] == 'authenticated':
        profile = auth_result['profile']
        auth_method = auth_result.get('auth_method', 'unknown')

        print(f"\n✅ AUTH OK: LinkedIn authentication successful!")
        print(f"   Method: {auth_method.upper()}")

        # Display minimal PII based on auth method
        if auth_method == 'oidc':
            # OIDC format: name, email (minimal)
            name = profile.get('name', profile.get('given_name', '') + ' ' + profile.get('family_name', '')).strip()
            print(f"   Name: {name or 'unknown'}")
            if 'email' in profile:
                print(f"   Email: {profile.get('email')}")
        else:
            # Legacy format: localizedFirstName, localizedLastName
            print(f"   Name: {profile.get('localizedFirstName', 'unknown')} {profile.get('localizedLastName', '')}")

        print(f"\n🎉 LinkedIn OAuth setup complete!")
        print(f"\nNext steps:")
        print(f"1. Test watcher: python3 scripts/linkedin_watcher_skill.py --mode real --once")
        print(f"2. Check status: python3 scripts/linkedin_oauth_helper.py --status")
    else:
        print(f"\n❌ Verification failed: {auth_result.get('error')}")
        print(f"\nTroubleshooting:")
        print(f"1. Check that token was saved correctly: {helper.token_file}")
        print(f"2. Verify LinkedIn app has required Products enabled")
        print(f"3. Try re-authenticating: python3 scripts/linkedin_oauth_helper.py --init")
        sys.exit(1)


def main():
    """
    LinkedIn OAuth2 CLI Helper

    Commands:
        --init     : Initialize OAuth flow (browser auto-open + local server)
        --status   : Check current authentication status
        --check-auth : Quick authentication check (alias for --status)

    Usage:
        # Initialize OAuth (first time setup)
        python3 scripts/linkedin_oauth_helper.py --init

        # Check authentication status
        python3 scripts/linkedin_oauth_helper.py --status

        # Verify authentication
        python3 scripts/linkedin_oauth_helper.py --check-auth
    """
    import argparse

    parser = argparse.ArgumentParser(
        description='LinkedIn OAuth2 Helper',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # First-time setup (opens browser automatically)
  python3 scripts/linkedin_oauth_helper.py --init

  # Check if authenticated
  python3 scripts/linkedin_oauth_helper.py --status

  # Quick auth check
  python3 scripts/linkedin_oauth_helper.py --check-auth
        """
    )

    parser.add_argument('--init', action='store_true',
                        help='Initialize OAuth flow with browser auto-open')
    parser.add_argument('--status', action='store_true',
                        help='Show current authentication status')
    parser.add_argument('--check-auth', action='store_true',
                        help='Quick authentication check (alias for --status)')

    args = parser.parse_args()

    # If no args provided, show help
    if not (args.init or args.status or args.check_auth):
        parser.print_help()
        return

    # Execute command
    if args.init:
        init_oauth()
    elif args.status or args.check_auth:
        show_status()
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
