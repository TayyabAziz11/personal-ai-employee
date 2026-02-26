#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Personal AI Employee — Start WhatsApp Auto-Reply Daemon
#
# Launches wa_auto_reply.py in the background (nohup).
# Real-time detection via MutationObserver — responds like WhatsApp Business.
#
# Usage:
#   ./start_wa_reply.sh          # start in background
#   ./start_wa_reply.sh --fg     # run in foreground (Ctrl+C to stop)
#   ./start_wa_reply.sh --dry-run  # background dry-run (log only, no sends)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$REPO_ROOT/Logs"
PID_FILE="$LOGS_DIR/wa_auto_reply.pid"
LOG_FILE="$LOGS_DIR/wa_auto_reply.log"
SCRIPT="$REPO_ROOT/scripts/wa_auto_reply.py"

mkdir -p "$LOGS_DIR"

# ── Parse flags ───────────────────────────────────────────────────────────────
FOREGROUND=0
EXTRA_FLAGS=""
for arg in "$@"; do
    case "$arg" in
        --fg|--foreground) FOREGROUND=1 ;;
        --dry-run)         EXTRA_FLAGS="--dry-run" ;;
    esac
done

# ── Already running? ──────────────────────────────────────────────────────────
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "✓ WA Auto-Reply is already running (PID $PID)"
        echo "  Log : $LOG_FILE"
        echo "  Stop: ./stop_wa_reply.sh"
        exit 0
    else
        echo "⚠  Stale PID file ($PID) — removing and restarting"
        rm -f "$PID_FILE"
    fi
fi

# ── Foreground mode ───────────────────────────────────────────────────────────
if [ "$FOREGROUND" -eq 1 ]; then
    echo "▶ Starting WA Auto-Reply in FOREGROUND (Ctrl+C to stop)"
    exec python3 "$SCRIPT" $EXTRA_FLAGS
fi

# ── Background mode (default) ─────────────────────────────────────────────────
echo "▶ Starting WhatsApp Auto-Reply daemon…"
nohup python3 "$SCRIPT" $EXTRA_FLAGS >> "$LOG_FILE" 2>&1 &
BG_PID=$!
echo "$BG_PID" > "$PID_FILE"

# Give it 3 seconds to confirm the process is still alive (not an instant crash)
sleep 3
if kill -0 "$BG_PID" 2>/dev/null; then
    echo "✓ WA Auto-Reply daemon started"
    echo "  PID  : $BG_PID"
    echo "  Log  : $LOG_FILE"
    echo ""
    echo "  Follow logs : tail -f $LOG_FILE"
    echo "  Stop        : ./stop_wa_reply.sh"
else
    echo "✗ Daemon crashed at startup — check log:"
    tail -20 "$LOG_FILE" 2>/dev/null || true
    rm -f "$PID_FILE"
    exit 1
fi
