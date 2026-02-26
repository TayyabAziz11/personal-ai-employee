#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Personal AI Employee — Start the 24/7 agent daemon
#
# Usage:
#   ./start_agent.sh          # start in background (nohup)
#   ./start_agent.sh --fg     # run in foreground (useful for debugging)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$REPO_ROOT/Logs"
PID_FILE="$LOGS_DIR/agent_daemon.pid"
LOG_FILE="$LOGS_DIR/agent_daemon.log"
DAEMON="$REPO_ROOT/scripts/agent_daemon.py"

mkdir -p "$LOGS_DIR"

# ── Check for foreground flag ─────────────────────────────────────────────────
FOREGROUND=0
for arg in "$@"; do
    [[ "$arg" == "--fg" || "$arg" == "--foreground" ]] && FOREGROUND=1
done

# ── Already running? ──────────────────────────────────────────────────────────
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "✓ Agent daemon is already running (PID $PID)"
        echo "  Log: $LOG_FILE"
        echo "  Stop with: ./stop_agent.sh"
        exit 0
    else
        echo "⚠  Stale PID file found ($PID) — removing and restarting"
        rm -f "$PID_FILE"
    fi
fi

# ── Foreground mode ───────────────────────────────────────────────────────────
if [ "$FOREGROUND" -eq 1 ]; then
    echo "▶ Starting agent daemon in FOREGROUND (Ctrl+C to stop)"
    exec python3 "$DAEMON"
fi

# ── Background mode (default) ────────────────────────────────────────────────
echo "▶ Starting Personal AI Employee daemon…"
nohup python3 "$DAEMON" >> "$LOG_FILE" 2>&1 &
BG_PID=$!

# Give it 3 seconds to write the PID file
for i in 1 2 3 4 5; do
    sleep 1
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        echo "✓ Daemon started successfully"
        echo "  PID  : $PID"
        echo "  Log  : $LOG_FILE"
        echo ""
        echo "  Follow logs : tail -f $LOG_FILE"
        echo "  Status      : ./agent_status.sh"
        echo "  Stop        : ./stop_agent.sh"
        exit 0
    fi
done

# PID file didn't appear — check if process is still alive
if kill -0 "$BG_PID" 2>/dev/null; then
    echo "⚠  Daemon started (PID $BG_PID) but PID file not yet written"
    echo "   Check log: tail -20 $LOG_FILE"
else
    echo "✗ Daemon failed to start — check log:"
    tail -20 "$LOG_FILE" 2>/dev/null || true
    exit 1
fi
