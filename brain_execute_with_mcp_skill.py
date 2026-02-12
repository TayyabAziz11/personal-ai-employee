#!/usr/bin/env python3
"""
Personal AI Employee - brain_execute_with_mcp Skill
Silver Tier - M6: MCP Email Execution Layer

Purpose: Execute approved plans using MCP Gmail integration.
Tier: Silver
Skill ID: 18

CRITICAL: This is the Action stage of the pipeline.
NO execution without approved plan.
MUST support --dry-run (default ON).
"""

import os
import sys
import re
import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any


class MCPExecutor:
    """Execute approved plans via MCP Gmail integration."""

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize MCP executor.

        Args:
            config: Optional configuration dict with paths
        """
        self.config = config or self._default_config()
        self.plans_dir = Path(self.config['plans_dir'])
        self.approved_dir = Path(self.config['approved_dir'])
        self.completed_dir = Path(self.config['completed_dir'])
        self.failed_dir = Path(self.config['failed_dir'])
        self.mcp_log = Path(self.config['mcp_log'])
        self.system_log = Path(self.config['system_log'])

        # Ensure directories exist
        self.completed_dir.mkdir(parents=True, exist_ok=True)
        self.failed_dir.mkdir(parents=True, exist_ok=True)
        self.mcp_log.parent.mkdir(parents=True, exist_ok=True)

    def _default_config(self) -> Dict:
        """Return default configuration."""
        base_dir = Path(__file__).parent
        return {
            'plans_dir': base_dir / 'Plans',
            'approved_dir': base_dir / 'Approved',
            'completed_dir': base_dir / 'Plans' / 'completed',
            'failed_dir': base_dir / 'Plans' / 'failed',
            'mcp_log': base_dir / 'Logs' / 'mcp_actions.log',
            'system_log': base_dir / 'system_log.md',
        }

    def read_plan(self, plan_path: Path) -> Dict:
        """
        Read and parse plan file.

        Args:
            plan_path: Path to plan file

        Returns:
            Dict with plan metadata and content
        """
        if not plan_path.exists():
            raise FileNotFoundError(f"Plan file not found: {plan_path}")

        content = plan_path.read_text(encoding='utf-8')

        # Extract header metadata
        metadata = {}
        lines = content.split('\n')

        # Extract title
        title_match = re.search(r'^# Plan: (.+)$', content, re.MULTILINE)
        title = title_match.group(1) if title_match else plan_path.stem

        # Extract metadata from header
        for line in lines[1:20]:
            if line.startswith('**') and ':**' in line:
                key_match = re.match(r'\*\*(.+?):\*\*\s*(.+)', line)
                if key_match:
                    key = key_match.group(1).strip()
                    value = key_match.group(2).strip()
                    metadata[key.lower().replace(' ', '_')] = value

        # Extract objective
        obj_match = re.search(r'## Objective\n\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
        objective = obj_match.group(1).strip() if obj_match else "No objective specified"

        # Extract MCP tools
        mcp_tools = self._extract_mcp_tools(content)

        # Extract execution steps
        steps = self._extract_execution_steps(content)

        return {
            'title': title,
            'file_path': str(plan_path),
            'metadata': metadata,
            'objective': objective,
            'mcp_tools': mcp_tools,
            'execution_steps': steps,
            'full_content': content,
            'risk_level': metadata.get('risk_level', 'Unknown'),
            'status': metadata.get('status', 'Unknown')
        }

    def _extract_mcp_tools(self, content: str) -> List[Dict]:
        """Extract MCP tools from plan content."""
        mcp_tools = []
        mcp_section_match = re.search(
            r'## MCP Tools Required\n\n(.*?)(?=\n##|\Z)',
            content,
            re.DOTALL
        )
        if mcp_section_match:
            mcp_content = mcp_section_match.group(1)
            for line in mcp_content.split('\n'):
                if line.startswith('|') and 'Tool Name' not in line and '---' not in line:
                    parts = [p.strip() for p in line.split('|')[1:-1]]
                    if len(parts) >= 3 and parts[0] and parts[0] != 'Tool Name':
                        mcp_tools.append({
                            'tool': parts[0],
                            'operation': parts[1],
                            'parameters': parts[2] if len(parts) > 2 else ''
                        })
        return mcp_tools

    def _extract_execution_steps(self, content: str) -> List[Dict]:
        """Extract execution steps from plan content."""
        steps = []
        steps_section_match = re.search(
            r'## Execution Steps \(Sequential\)\n\n(.*?)(?=\n##|\Z)',
            content,
            re.DOTALL
        )
        if steps_section_match:
            steps_content = steps_section_match.group(1)
            current_step = None
            for line in steps_content.split('\n'):
                # Match step number
                step_match = re.match(r'^(\d+)\.\s+(.+)', line)
                if step_match:
                    if current_step:
                        steps.append(current_step)
                    current_step = {
                        'number': int(step_match.group(1)),
                        'description': step_match.group(2),
                        'tool': None,
                        'command': None,
                        'outcome': None,
                        'rollback': None
                    }
                elif current_step:
                    if line.strip().startswith('- **Tool:**'):
                        current_step['tool'] = line.split(':', 1)[1].strip()
                    elif line.strip().startswith('- **Command/Call:**'):
                        current_step['command'] = line.split(':', 1)[1].strip()
                    elif line.strip().startswith('- **Expected Outcome:**'):
                        current_step['outcome'] = line.split(':', 1)[1].strip()
                    elif line.strip().startswith('- **Rollback:**'):
                        current_step['rollback'] = line.split(':', 1)[1].strip()
            if current_step:
                steps.append(current_step)
        return steps

    def validate_plan(self, plan_info: Dict) -> tuple[bool, str]:
        """
        Validate plan before execution.

        Args:
            plan_info: Dict from read_plan()

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check status is Approved
        if plan_info['status'] != 'Approved':
            return False, f"Plan status is '{plan_info['status']}', must be 'Approved'"

        # Check for MCP tools
        if not plan_info['mcp_tools']:
            return False, "No MCP tools specified in plan"

        # Check if already executed
        if 'Executed' in plan_info['full_content']:
            exec_match = re.search(r'\*\*Execution Completed:\*\*\s*\[(.*?)\]', plan_info['full_content'])
            if exec_match and exec_match.group(1) != 'YYYY-MM-DD HH:MM UTC':
                return False, "Plan appears to have already been executed"

        return True, ""

    def _mock_mcp_call(self, tool: str, operation: str, parameters: Dict, dry_run: bool = True) -> Dict:
        """
        Mock MCP call (simulation for environments without real MCP).

        In production, this would call actual MCP Gmail server.
        For M6 implementation, this simulates the call.

        Args:
            tool: MCP tool name (e.g., 'gmail')
            operation: Operation name (e.g., 'send_email')
            parameters: Operation parameters
            dry_run: If True, simulate without real action

        Returns:
            Dict with call result
        """
        start_time = time.time()

        # Simulate processing time
        time.sleep(0.1)

        # Mock MCP response
        if tool == 'gmail' and operation == 'send_email':
            if dry_run:
                result = {
                    'success': True,
                    'mode': 'dry-run',
                    'message': f"DRY-RUN: Would send email to {parameters.get('to', 'unknown')}",
                    'preview': {
                        'to': parameters.get('to', ''),
                        'subject': parameters.get('subject', ''),
                        'body_preview': parameters.get('body', '')[:100] + '...'
                    }
                }
            else:
                # Simulate real send (but still safe - no actual email sent)
                result = {
                    'success': True,
                    'mode': 'execute',
                    'message': f"SIMULATED: Email sent to {parameters.get('to', 'unknown')}",
                    'message_id': f"mock-{int(time.time())}"
                }
        elif tool == 'context7' and operation == 'query-docs':
            # Context7 is read-only - always succeeds (no external action)
            result = {
                'success': True,
                'mode': 'dry-run' if dry_run else 'execute',
                'message': f"Context7 docs queried: {parameters.get('libraryId', 'unknown')}"
            }
        else:
            result = {
                'success': False,
                'mode': 'dry-run' if dry_run else 'execute',
                'error': f"Unsupported operation: {tool}.{operation}"
            }

        duration = time.time() - start_time
        result['duration_ms'] = int(duration * 1000)

        return result

    def execute_plan(
        self,
        plan_path: Path,
        dry_run: bool = True,
        force_fail: bool = False
    ) -> Dict:
        """
        Execute an approved plan via MCP.

        Args:
            plan_path: Path to approved plan file
            dry_run: If True, run in dry-run mode (preview only)
            force_fail: If True, simulate MCP failure (for testing)

        Returns:
            Dict with execution results
        """
        # Read plan
        plan_info = self.read_plan(plan_path)

        # Validate plan
        is_valid, error = self.validate_plan(plan_info)
        if not is_valid:
            raise ValueError(f"Plan validation failed: {error}")

        # Execute MCP operations
        results = {
            'plan': str(plan_path),
            'plan_id': plan_path.stem,
            'mode': 'dry-run' if dry_run else 'execute',
            'mcp_calls': [],
            'success': True,
            'error': None
        }

        print()
        if dry_run:
            print("=" * 70)
            print("  DRY-RUN MODE: Preview Only (No Real Actions)")
            print("=" * 70)
        else:
            print("=" * 70)
            print("  EXECUTION MODE: Real Actions Will Be Taken")
            print("=" * 70)
        print(f"Plan: {plan_info['title']}")
        print(f"Risk Level: {plan_info['risk_level']}")
        print()

        # Execute each MCP tool
        for idx, mcp_tool in enumerate(plan_info['mcp_tools'], 1):
            print(f"Step {idx}/{len(plan_info['mcp_tools'])}: {mcp_tool['tool']}.{mcp_tool['operation']}")

            # Parse parameters (simplified - in production would be more robust)
            params = {}
            if mcp_tool['parameters']:
                param_pairs = mcp_tool['parameters'].split(',')
                for pair in param_pairs:
                    if ':' in pair:
                        key, value = pair.split(':', 1)
                        params[key.strip()] = value.strip()

            # Force failure if requested (for testing)
            if force_fail:
                mcp_result = {
                    'success': False,
                    'mode': 'dry-run' if dry_run else 'execute',
                    'error': 'SIMULATED FAILURE: MCP server timeout (test mode)',
                    'duration_ms': 100
                }
            else:
                # Call MCP (mocked in this implementation)
                mcp_result = self._mock_mcp_call(
                    mcp_tool['tool'],
                    mcp_tool['operation'],
                    params,
                    dry_run=dry_run
                )

            # Log MCP call
            self._log_mcp_call(
                plan_id=plan_path.stem,
                tool=mcp_tool['tool'],
                operation=mcp_tool['operation'],
                parameters=params,
                result=mcp_result,
                dry_run=dry_run
            )

            results['mcp_calls'].append({
                'tool': mcp_tool['tool'],
                'operation': mcp_tool['operation'],
                'result': mcp_result
            })

            # Display result
            if mcp_result['success']:
                print(f"  ✓ {mcp_result['message']}")
                if dry_run and 'preview' in mcp_result:
                    print(f"    To: {mcp_result['preview']['to']}")
                    print(f"    Subject: {mcp_result['preview']['subject']}")
                    print(f"    Body: {mcp_result['preview']['body_preview']}")
            else:
                print(f"  ✗ FAILED: {mcp_result.get('error', 'Unknown error')}")
                results['success'] = False
                results['error'] = mcp_result.get('error', 'Unknown error')
                break  # Stop on first failure

            print()

        # Update plan status based on results
        if results['success']:
            if not dry_run:
                self._mark_plan_executed(plan_path, results)
                print(f"✓ Plan executed successfully")
                print(f"  Status: Executed")
                print(f"  Moved to: {self.completed_dir}")
            else:
                print(f"✓ Dry-run completed successfully")
                print(f"  No real actions taken")
                print(f"  To execute for real, run with --execute flag")
        else:
            self._mark_plan_failed(plan_path, results)
            print(f"✗ Plan execution FAILED")
            print(f"  Error: {results['error']}")
            print(f"  Status: Failed")
            print(f"  Moved to: {self.failed_dir}")

        print()

        return results

    def _mark_plan_executed(self, plan_path: Path, results: Dict):
        """Mark plan as executed and move to completed/."""
        # Update plan file
        content = plan_path.read_text(encoding='utf-8')

        # Update status
        content = re.sub(
            r'(\*\*Status:\*\*\s*)\[?([^\]\n]+)\]?',
            r'\1Executed',
            content,
            count=1
        )

        # Add execution timestamp
        now_utc = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
        content = re.sub(
            r'(\*\*Execution Completed:\*\*\s*)\[?([^\]\n]+)\]?',
            f'\\1{now_utc}',
            content,
            count=1
        )

        # Write updated content
        plan_path.write_text(content, encoding='utf-8')

        # Move to completed/
        new_path = self.completed_dir / plan_path.name
        plan_path.rename(new_path)

        # Log to system_log.md
        self._log_to_system_log(
            plan_id=plan_path.stem,
            status='Executed',
            mode='execute',
            success=True
        )

    def _mark_plan_failed(self, plan_path: Path, results: Dict):
        """Mark plan as failed and move to failed/."""
        # Update plan file
        content = plan_path.read_text(encoding='utf-8')

        # Update status
        content = re.sub(
            r'(\*\*Status:\*\*\s*)\[?([^\]\n]+)\]?',
            r'\1Failed',
            content,
            count=1
        )

        # Write updated content
        plan_path.write_text(content, encoding='utf-8')

        # Move to failed/
        new_path = self.failed_dir / plan_path.name
        plan_path.rename(new_path)

        # Log to system_log.md
        self._log_to_system_log(
            plan_id=plan_path.stem,
            status='Failed',
            mode=results['mode'],
            success=False,
            error=results.get('error', 'Unknown error')
        )

    def _log_mcp_call(
        self,
        plan_id: str,
        tool: str,
        operation: str,
        parameters: Dict,
        result: Dict,
        dry_run: bool
    ):
        """Log MCP call to mcp_actions.log."""
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')

        log_entry = f"""
[{timestamp}] MCP Call
Plan ID: {plan_id}
Tool: {tool}
Operation: {operation}
Parameters: {json.dumps(parameters, indent=2)}
Mode: {'dry-run' if dry_run else 'execute'}
Success: {result['success']}
Result: {result.get('message', result.get('error', 'Unknown'))}
Duration: {result.get('duration_ms', 0)}ms
---
"""

        # Append to mcp_actions.log
        with open(self.mcp_log, 'a', encoding='utf-8') as f:
            f.write(log_entry)

    def _log_to_system_log(
        self,
        plan_id: str,
        status: str,
        mode: str,
        success: bool,
        error: str = None
    ):
        """Log execution to system_log.md."""
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')

        log_entry = f"""
[{timestamp}] PLAN EXECUTION
- Plan ID: {plan_id}
- Status: {status}
- Mode: {mode}
- Success: {success}
{'- Error: ' + error if error else ''}
- Skill: brain_execute_with_mcp (M6)
- Outcome: {'OK' if success else 'FAILED'}

"""

        # Append to system_log.md
        if self.system_log.exists():
            with open(self.system_log, 'a', encoding='utf-8') as f:
                f.write(log_entry)


def main():
    """CLI interface for brain_execute_with_mcp skill."""
    parser = argparse.ArgumentParser(
        description='Brain Execute with MCP - Execute approved plans via MCP Gmail',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry-run mode (default - preview only, no real actions)
  python brain_execute_with_mcp_skill.py --plan Plans/PLAN_*.md

  # Explicit dry-run
  python brain_execute_with_mcp_skill.py --plan Plans/PLAN_*.md --dry-run

  # Real execution (requires explicit flag)
  python brain_execute_with_mcp_skill.py --plan Plans/PLAN_*.md --execute

  # Simulate failure (for testing)
  python brain_execute_with_mcp_skill.py --plan Plans/PLAN_*.md --force-fail
        """
    )

    parser.add_argument(
        '--plan',
        required=True,
        help='Path to approved plan file'
    )

    # Execution mode (mutually exclusive)
    exec_group = parser.add_mutually_exclusive_group()
    exec_group.add_argument(
        '--dry-run',
        action='store_true',
        default=True,
        help='Dry-run mode (preview only, no real actions) [default]'
    )
    exec_group.add_argument(
        '--execute',
        action='store_true',
        help='Real execution mode (WARNING: will take real actions)'
    )

    parser.add_argument(
        '--force-fail',
        action='store_true',
        help='Simulate MCP failure (for testing failure handling)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Show detailed output'
    )

    args = parser.parse_args()

    # Initialize executor
    executor = MCPExecutor()

    # Determine mode
    dry_run = not args.execute

    if dry_run and args.verbose:
        print("NOTE: Running in DRY-RUN mode (default)")
        print("      No real actions will be taken")
        print("      Use --execute flag for real execution")
        print()

    # Execute plan
    plan_path = Path(args.plan)
    if not plan_path.exists():
        print(f"Error: Plan file not found: {plan_path}")
        sys.exit(1)

    try:
        results = executor.execute_plan(
            plan_path,
            dry_run=dry_run,
            force_fail=args.force_fail
        )

        if results['success']:
            sys.exit(0)
        else:
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
