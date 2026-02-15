#!/usr/bin/env python3
"""
Personal AI Employee - WhatsApp Watcher Skill
Gold Tier - G-M3: Social Watchers

Purpose: WhatsApp message perception-only watcher (creates intake wrappers, NEVER sends/replies)
Tier: Gold
Skill ID: G-M3-T02

CRITICAL: This is PERCEPTION-ONLY. It NEVER sends WhatsApp messages, NEVER replies,
NEVER calls ACTION MCP tools. It only creates intake wrappers in Social/Inbox/.

Features:
- Mock mode with templates/mock_whatsapp.json
- Real mode with MCP query tools (optional, not implemented yet)
- PII redaction using mcp_helpers
- Checkpointing to avoid duplicates
- Privacy-safe intake wrappers
"""

import os
import sys
import json
import argparse
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional

# Import PII redaction helper
try:
    from mcp_helpers import redact_pii
except ImportError:
    # Fallback if mcp_helpers not available
    import re
    def redact_pii(text: str) -> str:
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        text = re.sub(email_pattern, '[EMAIL_REDACTED]', text)
        text = re.sub(phone_pattern, '[PHONE_REDACTED]', text)
        return text


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class WhatsAppWatcher:
    """WhatsApp Watcher - Perception-only message intake"""

    def __init__(self, config: Dict):
        self.config = config
        self.checkpoint_data = self._load_checkpoint()
        self.created_count = 0
        self.skipped_count = 0
        self.errors = []

    def _load_checkpoint(self) -> Dict:
        """Load checkpoint to avoid re-processing messages"""
        checkpoint_path = self.config['checkpoint_path']
        if os.path.exists(checkpoint_path):
            try:
                with open(checkpoint_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load checkpoint: {e}")
                return {'processed_ids': [], 'last_run': None}
        return {'processed_ids': [], 'last_run': None}

    def _save_checkpoint(self):
        """Save checkpoint with processed message IDs"""
        checkpoint_path = self.config['checkpoint_path']
        self.checkpoint_data['last_run'] = datetime.now(timezone.utc).isoformat()

        # Keep only last 500 IDs
        if len(self.checkpoint_data['processed_ids']) > 500:
            self.checkpoint_data['processed_ids'] = self.checkpoint_data['processed_ids'][-500:]

        try:
            os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
            with open(checkpoint_path, 'w') as f:
                json.dump(self.checkpoint_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save checkpoint: {e}")

    def reset_checkpoint(self):
        """Reset checkpoint"""
        self.checkpoint_data = {'processed_ids': [], 'last_run': None}
        self._save_checkpoint()
        print("✓ WhatsApp checkpoint reset")

    def _append_log(self, message: str):
        """Append to whatsapp_watcher.log"""
        log_path = self.config['log_path']
        try:
            os.makedirs(os.path.dirname(log_path), exist_ok=True)
            timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(f"[{timestamp}] {message}\n")
        except Exception as e:
            logger.warning(f"Could not write to log: {e}")

    def _create_intake_wrapper(self, message: Dict, dry_run: bool = False) -> Optional[str]:
        """Create intake wrapper in Social/Inbox/"""
        try:
            # Generate unique ID and filename
            msg_id = message['id']
            sender = message.get('sender', 'unknown')
            timestamp = datetime.now(timezone.utc)
            timestamp_str = timestamp.strftime('%Y%m%d-%H%M')

            # Sanitize sender for filename (remove special chars)
            sender_safe = sender.replace('+', '').replace('-', '').replace(' ', '')[:15]

            filename = f"inbox__whatsapp__{timestamp_str}__{sender_safe}.md"
            output_path = os.path.join(self.config['output_dir'], filename)

            if dry_run:
                print(f"[DRY-RUN] Would create: {filename}")
                return None

            # Extract message data
            body = message.get('body', '')
            sender_name = message.get('sender_name', sender)
            thread_id = message.get('thread_id', f"thread_{sender_safe}")
            is_urgent = message.get('urgent', False)

            # Create privacy-safe excerpt (max 500 chars, PII redacted)
            excerpt = body[:500] if len(body) <= 500 else body[:497] + "..."
            excerpt = redact_pii(excerpt)

            # YAML frontmatter
            frontmatter = f"""---
id: {msg_id}
source: whatsapp
received_at: {message.get('timestamp', timestamp.isoformat())}
sender: {sender}
channel: whatsapp
thread_id: {thread_id}
excerpt: "{excerpt}"
status: pending
plan_required: {str(is_urgent).lower()}
pii_redacted: true
---

# WhatsApp Message - {sender_name}

**⚠️ PERCEPTION-ONLY**: This is an intake wrapper. No WhatsApp actions have been taken.

## Message Details

**From**: {sender_name} ({sender})
**Received**: {message.get('timestamp', timestamp.isoformat())}
**Thread**: {thread_id}
**Type**: {message.get('type', 'incoming')}
**Urgent**: {is_urgent}

## Message Content

{body}

## Suggested Next Steps

**If actionable**:
1. Create plan using `brain_create_plan` (Gold Tier - G-M4)
2. Request approval via `brain_request_approval`
3. Execute via `brain_execute_social_with_mcp` (WhatsApp reply/send)

**If informational only**:
- Archive to Done/ with note

## Privacy Notice

- PII in excerpt has been redacted for privacy
- Full message content preserved above for context
- Never commit this file to git (covered by .gitignore)

---
**Generated by**: whatsapp_watcher
**Watcher Version**: 1.0.0 (Gold Tier - G-M3)
**Checkpoint ID**: {self.checkpoint_data.get('last_run', 'initial')}
"""

            # Write file
            os.makedirs(self.config['output_dir'], exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(frontmatter)

            logger.info(f"Created intake wrapper: {filename}")
            return output_path

        except Exception as e:
            logger.error(f"Failed to create intake wrapper: {e}")
            self.errors.append(str(e))
            return None

    def _load_mock_messages(self) -> List[Dict]:
        """Load mock messages from fixture file"""
        fixture_path = self.config['mock_fixture_path']

        if not os.path.exists(fixture_path):
            raise FileNotFoundError(f"Mock fixture not found: {fixture_path}")

        try:
            with open(fixture_path, 'r') as f:
                messages = json.load(f)

            if not isinstance(messages, list):
                raise ValueError("Mock fixture must be a JSON array")

            logger.info(f"Loaded {len(messages)} mock messages from {fixture_path}")
            return messages

        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in mock fixture: {e}")

    def _fetch_messages_real(self) -> List[Dict]:
        """Fetch messages from real WhatsApp MCP (not implemented yet)"""
        logger.warning("Real WhatsApp MCP not implemented yet - use --mock mode")
        return []

    def run(self, dry_run: bool = False, mock: bool = True, verbose: bool = False) -> Dict:
        """Run WhatsApp watcher"""
        start_time = datetime.now(timezone.utc)

        if verbose:
            logger.setLevel(logging.DEBUG)

        logger.info(f"Starting WhatsApp watcher (mock={mock}, dry_run={dry_run})")

        # Fetch messages
        if mock:
            try:
                messages = self._load_mock_messages()
            except Exception as e:
                logger.error(f"Failed to load mock messages: {e}")
                return {'success': False, 'error': str(e)}
        else:
            messages = self._fetch_messages_real()

        # Apply max_results limit
        max_results = self.config.get('max_results', 10)
        messages = messages[:max_results]

        logger.info(f"Processing {len(messages)} messages")

        # Process each message
        for message in messages:
            msg_id = message.get('id')

            if not msg_id:
                logger.warning("Message missing ID, skipping")
                continue

            # Check if already processed
            if msg_id in self.checkpoint_data['processed_ids']:
                logger.debug(f"Skipping already processed message: {msg_id}")
                self.skipped_count += 1
                continue

            # Create intake wrapper
            output_path = self._create_intake_wrapper(message, dry_run=dry_run)

            if output_path:
                self.created_count += 1
                if not dry_run:
                    self.checkpoint_data['processed_ids'].append(msg_id)

        # Save checkpoint
        if not dry_run and self.created_count > 0:
            self._save_checkpoint()

        # Log summary
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        summary = (
            f"WhatsApp watcher complete: "
            f"{len(messages)} scanned, {self.created_count} created, "
            f"{self.skipped_count} skipped, {len(self.errors)} errors, "
            f"{duration:.2f}s"
        )

        self._append_log(summary)

        # Append to system_log.md
        try:
            with open('system_log.md', 'a', encoding='utf-8') as f:
                f.write(f"\n**[{start_time.isoformat()}]** {summary}\n")
        except:
            pass

        print(f"\n✅ {summary}")

        return {
            'success': True,
            'scanned': len(messages),
            'created': self.created_count,
            'skipped': self.skipped_count,
            'errors': len(self.errors),
            'duration': duration
        }


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='WhatsApp Watcher - Perception-only message intake (Gold Tier)'
    )
    parser.add_argument('--once', action='store_true', default=True,
                        help='Run once and exit (default)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Simulate run without creating files')
    parser.add_argument('--mock', action='store_true', default=True,
                        help='Use mock data from templates/mock_whatsapp.json (default)')
    parser.add_argument('--max-results', type=int, default=10,
                        help='Maximum messages to process (default: 10)')
    parser.add_argument('--reset-checkpoint', action='store_true',
                        help='Reset checkpoint before running')
    parser.add_argument('--verbose', action='store_true',
                        help='Enable verbose logging')

    args = parser.parse_args()

    config = {
        'checkpoint_path': 'Logs/whatsapp_watcher_checkpoint.json',
        'log_path': 'Logs/whatsapp_watcher.log',
        'output_dir': 'Social/Inbox',
        'max_results': args.max_results,
        'mock_fixture_path': 'templates/mock_whatsapp.json'
    }

    watcher = WhatsAppWatcher(config)

    if args.reset_checkpoint:
        watcher.reset_checkpoint()

    result = watcher.run(dry_run=args.dry_run, mock=args.mock, verbose=args.verbose)

    return 0 if result['success'] else 1


if __name__ == "__main__":
    sys.exit(main())
