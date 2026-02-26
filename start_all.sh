#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Personal AI Employee — Start EVERYTHING (frontend + agent daemon)
#
# Starts both in parallel:
#   1. Next.js web frontend  (http://localhost:3000)
#   2. Python agent daemon   (watchers + Ralph orchestrator, 24/7)
#
# Usage:
#   ./start_all.sh            # start both
#   ./start_all.sh --build    # rebuild Next.js first, then start both
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BUILD_FLAG=""
for arg in "$@"; do
    [[ "$arg" == "--build" ]] && BUILD_FLAG="--build"
done

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Personal AI Employee — Starting All Services       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Start web frontend ────────────────────────────────────────────────────────
echo "── 1/3  Web Frontend ───────────────────────────────────"
bash "$REPO_ROOT/start_web.sh" $BUILD_FLAG
echo ""

# ── Start agent daemon ────────────────────────────────────────────────────────
echo "── 2/3  Agent Daemon ───────────────────────────────────"
bash "$REPO_ROOT/start_agent.sh"
echo ""

# ── Start WhatsApp auto-reply daemon ─────────────────────────────────────────
echo "── 3/3  WhatsApp Auto-Reply ────────────────────────────"
bash "$REPO_ROOT/start_wa_reply.sh"
echo ""

echo "╔══════════════════════════════════════════════════════╗"
echo "║   All services started                               ║"
echo "║                                                      ║"
echo "║   Web UI    : http://localhost:3000                  ║"
echo "║   WA Reply  : auto-replying 24/7                    ║"
echo "║   Status    : ./agent_status.sh                     ║"
echo "║   Stop      : ./stop_all.sh                         ║"
echo "╚══════════════════════════════════════════════════════╝"
