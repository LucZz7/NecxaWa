#!/bin/bash
# NecxaWA cloud backend — ONE TIME setup (codespace banne par khud chalta hai)
# Kaam: Chromium + OpenWA source + dependencies + build. 5-10 minute lag sakte hain.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BK="$ROOT/.backend"
mkdir -p "$BK"

echo "== [1/4] Chromium install =="
if ! command -v chromium >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq chromium
fi
echo "chromium: $(command -v chromium)"

echo "== [2/4] OpenWA source =="
if [ ! -d "$BK/openwa-src" ]; then
  git clone --depth 1 https://github.com/rmyndharis/OpenWA "$BK/openwa-src"
fi
cd "$BK/openwa-src"

echo "== [3/4] API key =="
if [ ! -f "$BK/.env" ]; then
  KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  printf 'API_MASTER_KEY=%s\nCORS_ORIGINS=https://luczz7.github.io\nPORT=2785\nSERVE_DASHBOARD=false\nNODE_ENV=production\nPUPPETEER_EXECUTABLE_PATH=%s\n' "$KEY" "$(command -v chromium)" > "$BK/.env"
  chmod 600 "$BK/.env"
fi

echo "== [4/4] install + build =="
# better-sqlite3 native build fix: node headers pehle se cache kar do
NODE_VER=$(node --version | tr -d 'v')
GYPDIR="$HOME/.cache/node-gyp/$NODE_VER"
if [ ! -f "$GYPDIR/installVersion" ]; then
  mkdir -p "$GYPDIR"
  curl -sL -o /tmp/node-headers.tar.gz "https://nodejs.org/download/release/v$NODE_VER/node-v$NODE_VER-headers.tar.gz"
  tar --no-same-owner -xzf /tmp/node-headers.tar.gz -C "$GYPDIR" --strip-components=1
  echo "9" > "$GYPDIR/installVersion"
  rm -f /tmp/node-headers.tar.gz
fi
export npm_config_nodedir="$GYPDIR"
if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund
fi
if [ ! -f dist/main.js ]; then
  npx nest build
fi

echo ""
echo "=================================================="
echo " SETUP COMPLETE — backend taiyaar hai"
echo " API key (.backend/.env me saved hai):"
grep '^API_MASTER_KEY=' "$BK/.env" | cut -d= -f2
echo "=================================================="
