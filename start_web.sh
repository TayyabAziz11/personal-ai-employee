#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Personal AI Employee — Start the Next.js frontend (24/7)
#
# Usage:
#   ./start_web.sh              # start in background (production — next start)
#   ./start_web.sh --build      # rebuild first, then start
#   ./start_web.sh --dev        # start in dev mode (next dev)
#   ./start_web.sh --fg         # run in foreground
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"
LOGS_DIR="$REPO_ROOT/Logs"
PID_FILE="$LOGS_DIR/web_server.pid"
LOG_FILE="$LOGS_DIR/web_server.log"
PORT=3000

mkdir -p "$LOGS_DIR"

# ── Parse flags ───────────────────────────────────────────────────────────────
BUILD=0; DEV=0; FOREGROUND=0
for arg in "$@"; do
    case "$arg" in
        --build)           BUILD=1 ;;
        --dev)             DEV=1 ;;
        --fg|--foreground) FOREGROUND=1 ;;
    esac
done

# ── Already running? ──────────────────────────────────────────────────────────
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "✓ Web server is already running (PID $PID) on http://localhost:$PORT"
        echo "  Stop with: ./stop_web.sh"
        exit 0
    else
        rm -f "$PID_FILE"
    fi
fi

# ── Kill everything currently on port 3000 ───────────────────────────────────
# Note: lsof doesn't work for network sockets in WSL2; use 'ss' instead.
_port_pids() {
    ss -tlnp "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u || true
}
_kill_port() {
    local PIDS
    PIDS=$(_port_pids)
    if [ -n "$PIDS" ]; then
        echo "⚠  Clearing port $PORT (PIDs: $PIDS)"
        for p in $PIDS; do
            kill -TERM "$p" 2>/dev/null || true
        done
        sleep 2
        # Force kill any survivors
        PIDS=$(_port_pids)
        for p in $PIDS; do
            kill -KILL "$p" 2>/dev/null || true
        done
        sleep 1
        echo "  Port $PORT cleared"
    fi
}
_kill_port

# ── Resolve the next binary ───────────────────────────────────────────────────
NEXT_BIN="$WEB_DIR/node_modules/.bin/next"
if [ ! -f "$NEXT_BIN" ]; then
    echo "✗ next binary not found: $NEXT_BIN"
    echo "  Run: cd apps/web && npm install"
    exit 1
fi

# ── Optional rebuild ──────────────────────────────────────────────────────────
if [ "$BUILD" -eq 1 ]; then
    echo "▶ Building Next.js production bundle…"
    cd "$WEB_DIR" && npm run build
    echo "✓ Build complete"
fi

# ── Subcommand: "start" (production) or "dev" ────────────────────────────────
if [ "$DEV" -eq 1 ]; then
    SUBCMD="dev"
    MODE_LABEL="dev"
else
    SUBCMD="start"
    MODE_LABEL="production"
fi

# ── Foreground mode ───────────────────────────────────────────────────────────
if [ "$FOREGROUND" -eq 1 ]; then
    echo "▶ Starting web server in FOREGROUND ($MODE_LABEL, port $PORT)"
    cd "$WEB_DIR"
    exec node "$NEXT_BIN" "$SUBCMD"
fi

# ── Background mode ───────────────────────────────────────────────────────────
echo "▶ Starting Next.js web server ($MODE_LABEL, port $PORT)…"
cd "$WEB_DIR"

nohup node "$NEXT_BIN" "$SUBCMD" >> "$LOG_FILE" 2>&1 &
WEB_PID=$!
echo "$WEB_PID" > "$PID_FILE"

# Wait for the server to respond on port 3000
echo -n "  Waiting for server"
for i in $(seq 20); do
    sleep 1
    printf "."
    if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
        if ! kill -0 "$WEB_PID" 2>/dev/null; then
            echo ""
            echo "✗ Port $PORT responded but our process (PID $WEB_PID) died — check log:"
            tail -10 "$LOG_FILE" 2>/dev/null || true
            rm -f "$PID_FILE"
            exit 1
        fi
        echo ""
        echo "✓ Web server is up"
        echo "  PID    : $WEB_PID"
        echo "  URL    : http://localhost:$PORT"
        echo "  Log    : $LOG_FILE"
        echo ""
        echo "  Follow logs : tail -f $LOG_FILE"
        echo "  Status      : ./agent_status.sh"
        echo "  Stop        : ./stop_web.sh"
        exit 0
    fi
done
echo ""

# Timed out — check if process alive and give benefit of the doubt
if kill -0 "$WEB_PID" 2>/dev/null; then
    echo "⚠  Server started (PID $WEB_PID) but not yet responding on port $PORT"
    echo "   Still booting — check: tail -f $LOG_FILE"
else
    echo "✗ Web server failed to start — check log:"
    tail -20 "$LOG_FILE" 2>/dev/null || true
    rm -f "$PID_FILE"
    exit 1
fi
