#!/bin/bash
# NecxaWA cloud backend — har codespace start par khud chalta hai
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BK="$ROOT/.backend"
[ -d "$BK/openwa-src" ] || exit 0
cd "$BK/openwa-src"

# Pehle se chal raha ho to dobara start mat karo
if curl -s --max-time 3 http://localhost:2785/api/health/ready 2>/dev/null | grep -q '"status":"ok"'; then
  echo "Backend pehle se chal raha hai."
else
  set -a; . "$BK/.env"; set +a
  export PUPPETEER_EXECUTABLE_PATH
  nohup node dist/main > "$BK/backend.log" 2>&1 &
  echo "Backend start ho raha hai..."
  sleep 10
fi

echo ""
echo "=================================================="
echo " NecxaWA backend LIVE: http://localhost:2785"
echo " API key  (console ke Connection me dalni hai):"
grep '^API_MASTER_KEY=' "$BK/.env" | cut -d= -f2
echo ""
echo " Key .backend/.env file me bhi saved hai."
echo " Logs: .backend/backend.log"
echo "=================================================="

# AI auto-reply poller (port 2786) — backend ke saath chalega
if pgrep -f "[a]uto-reply[.]js" > /dev/null 2>&1; then
  echo "Auto-reply pehle se chal raha hai."
else
  set -a; . "$BK/.env"; set +a
  cd "$ROOT/.devcontainer"
  nohup node auto-reply.js > "$BK/autoreply.log" 2>&1 &
  echo "Auto-reply poller start ho gaya (port 2786)."
fi
