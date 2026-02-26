#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Personal AI Employee — Stop the 24/7 agent daemon
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$REPO_ROOT/Logs/agent_daemon.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "✗ Daemon is not running (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ! kill -0 "$PID" 2>/dev/null; then
    echo "✗ No process found with PID $PID — removing stale PID file"
    rm -f "$PID_FILE"
    exit 0
fi

echo "▶ Sending SIGTERM to daemon (PID $PID)…"
kill -TERM "$PID"

# Wait up to 15 seconds for a clean exit
for i in $(seq 15); do
    sleep 1
    if ! kill -0 "$PID" 2>/dev/null; then
        echo "✓ Daemon stopped cleanly"
        rm -f "$PID_FILE"
        exit 0
    fi
    printf "."
done

echo ""
echo "⚠  Daemon did not stop after 15 s — force killing"
kill -KILL "$PID" 2>/dev/null || true
rm -f "$PID_FILE"
echo "✓ Daemon force-stopped"
