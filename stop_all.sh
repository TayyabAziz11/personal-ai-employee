#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Personal AI Employee — Stop EVERYTHING (frontend + agent daemon)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Personal AI Employee — Stopping All Services       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

echo "── 1/3  WA Auto-Reply ──────────────────────────────────"
bash "$REPO_ROOT/stop_wa_reply.sh"
echo ""

echo "── 2/3  Agent Daemon ───────────────────────────────────"
bash "$REPO_ROOT/stop_agent.sh"
echo ""

echo "── 3/3  Web Frontend ───────────────────────────────────"
bash "$REPO_ROOT/stop_web.sh"
echo ""

echo "✓ All services stopped"
