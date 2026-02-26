#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Personal AI Employee — Stop the Next.js frontend
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$REPO_ROOT/Logs/web_server.pid"

# Note: lsof doesn't work for network sockets in WSL2; use 'ss' instead.
_port_pids() {
    ss -tlnp "sport = :3000" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u || true
}

# Fall back to port-based kill if no PID file
if [ ! -f "$PID_FILE" ]; then
    EXISTING=$(_port_pids)
    if [ -n "$EXISTING" ]; then
        echo "▶ Stopping process on port 3000 (PIDs: $EXISTING)…"
        for p in $EXISTING; do kill -TERM "$p" 2>/dev/null || true; done
        sleep 2
        EXISTING=$(_port_pids)
        for p in $EXISTING; do kill -KILL "$p" 2>/dev/null || true; done
        echo "✓ Web server stopped"
    else
        echo "✗ Web server is not running"
    fi
    exit 0
fi

PID=$(cat "$PID_FILE")

if ! kill -0 "$PID" 2>/dev/null; then
    echo "✗ No process found with PID $PID — removing stale PID file"
    rm -f "$PID_FILE"
    # Still kill port 3000 if something is running there
    EXISTING=$(_port_pids)
    if [ -n "$EXISTING" ]; then
        echo "▶ Killing process on port 3000 (PIDs: $EXISTING)…"
        for p in $EXISTING; do kill -TERM "$p" 2>/dev/null || kill -KILL "$p" 2>/dev/null || true; done
        echo "✓ Port 3000 cleared"
    fi
    exit 0
fi

echo "▶ Stopping web server (PID $PID)…"
kill -TERM "$PID"

for i in $(seq 15); do
    sleep 1
    if ! kill -0 "$PID" 2>/dev/null; then
        echo "✓ Web server stopped"
        rm -f "$PID_FILE"
        exit 0
    fi
    printf "."
done

echo ""
echo "⚠  Did not stop after 15 s — force killing"
kill -KILL "$PID" 2>/dev/null || true
rm -f "$PID_FILE"
echo "✓ Web server force-stopped"
