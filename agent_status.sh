#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Personal AI Employee — Show status of all services
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$REPO_ROOT/Logs"

AGENT_PID_FILE="$LOGS_DIR/agent_daemon.pid"
AGENT_LOG="$LOGS_DIR/agent_daemon.log"
WEB_PID_FILE="$LOGS_DIR/web_server.pid"
WEB_LOG="$LOGS_DIR/web_server.log"
WA_PID_FILE="$LOGS_DIR/wa_auto_reply.pid"
WA_LOG="$LOGS_DIR/wa_auto_reply.log"

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Personal AI Employee — Service Status              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Agent Daemon ──────────────────────────────────────────────────────────────
echo "  Agent Daemon (watchers + Ralph orchestrator)"
if [ -f "$AGENT_PID_FILE" ]; then
    PID=$(cat "$AGENT_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        START=$(ps -o lstart= -p "$PID" 2>/dev/null | xargs || echo "unknown")
        echo "  Status  : ✓ RUNNING (PID $PID)"
        echo "  Started : $START"
    else
        echo "  Status  : ✗ NOT RUNNING (stale PID $PID)"
    fi
else
    echo "  Status  : ✗ NOT RUNNING"
fi
echo "  Log     : $AGENT_LOG"
echo ""

# ── Web Frontend ──────────────────────────────────────────────────────────────
echo "  Web Frontend (Next.js — http://localhost:3000)"
if [ -f "$WEB_PID_FILE" ]; then
    PID=$(cat "$WEB_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        START=$(ps -o lstart= -p "$PID" 2>/dev/null | xargs || echo "unknown")
        echo "  Status  : ✓ RUNNING (PID $PID)"
        echo "  Started : $START"
        # Quick health check
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null | grep -q "200\|301\|302"; then
            echo "  Health  : ✓ responding on port 3000"
        else
            echo "  Health  : ⚠ process alive but port 3000 not responding yet"
        fi
    else
        echo "  Status  : ✗ NOT RUNNING (stale PID $PID)"
    fi
else
    echo "  Status  : ✗ NOT RUNNING"
fi
echo "  Log     : $WEB_LOG"
echo ""

# ── WhatsApp Auto-Reply ───────────────────────────────────────────────────────
echo "  WA Auto-Reply (real-time MutationObserver daemon)"
if [ -f "$WA_PID_FILE" ]; then
    PID=$(cat "$WA_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        START=$(ps -o lstart= -p "$PID" 2>/dev/null | xargs || echo "unknown")
        echo "  Status  : ✓ RUNNING (PID $PID)"
        echo "  Started : $START"
    else
        echo "  Status  : ✗ NOT RUNNING (stale PID $PID)"
    fi
else
    echo "  Status  : ✗ NOT RUNNING"
fi
echo "  Log     : $WA_LOG"
echo ""

# ── Recent agent activity ─────────────────────────────────────────────────────
if [ -f "$AGENT_LOG" ]; then
    echo "────────────────────────────────────────────────────"
    echo "  Recent agent activity (last 20 lines):"
    echo "────────────────────────────────────────────────────"
    tail -20 "$AGENT_LOG"
    echo ""
fi

echo "╔══════════════════════════════════════════════════════╗"
echo "║  Commands                                            ║"
echo "║    Start all  : ./start_all.sh                      ║"
echo "║    Stop all   : ./stop_all.sh                       ║"
echo "║    Agent logs : tail -f $LOGS_DIR/agent_daemon.log  ║"
echo "║    Web logs   : tail -f $LOGS_DIR/web_server.log    ║"
echo "║    WA logs    : tail -f $LOGS_DIR/wa_auto_reply.log ║"
echo "╚══════════════════════════════════════════════════════╝"
