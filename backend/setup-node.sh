#!/bin/bash
# NecxaWA backend — bina Docker ke, seedha Node.js se (Linux / Mac, advanced)
# Docker wala tarika (start.sh) aasan hai — ye sirf jab Docker na ho tab use karo.
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22+ chahiye: https://nodejs.org/"
  exit 1
fi
echo "Node: $(node --version)"

# --- better-sqlite3 native build fix -------------------------------------
# Kuch sandboxed systems par node-gyp ka header download fchown error deta
# hai. Headers pehle se cache kar do to compile seedha ho jata hai.
NODE_VER=$(node --version | tr -d 'v')
GYPDIR="$HOME/.cache/node-gyp/$NODE_VER"
if [ ! -f "$GYPDIR/installVersion" ]; then
  echo "Node headers cache kar raha hoon (better-sqlite3 fix)..."
  mkdir -p "$GYPDIR"
  curl -sL -o /tmp/node-headers.tar.gz "https://nodejs.org/download/release/v$NODE_VER/node-v$NODE_VER-headers.tar.gz"
  tar --no-same-owner -xzf /tmp/node-headers.tar.gz -C "$GYPDIR" --strip-components=1
  echo "9" > "$GYPDIR/installVersion"
  rm -f /tmp/node-headers.tar.gz
fi

# --- repo -----------------------------------------------------------------
if [ ! -d openwa-src ]; then
  git clone --depth 1 https://github.com/rmyndharis/OpenWA openwa-src
fi
cd openwa-src

# --- API key ---------------------------------------------------------------
if [ ! -f .env ]; then
  KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  printf 'API_MASTER_KEY=%s\nCORS_ORIGINS=*\nPORT=2785\nSERVE_DASHBOARD=false\nNODE_ENV=production\n' "$KEY" > .env
  chmod 600 .env
  echo "Nayi API key bana di gayi."
fi

# --- install (native build ke liye pehle se cache kiye headers do) -----------
# npm_config_nodedir set hai to node-gyp download skip karke inhi
# headers se better-sqlite3 compile karega.
export npm_config_nodedir="$GYPDIR"
npm ci --no-audit --no-fund

# --- build & run ------------------------------------------------------------
npx nest build
echo ""
echo "=============================================="
echo " NecxaWA backend LIVE ho raha hai"
echo "=============================================="
echo " Backend URL : http://localhost:2785"
echo " API key     : $(grep '^API_MASTER_KEY=' .env | cut -d= -f2)"
echo ""
echo "Console: https://luczz7.github.io/NecxaWa/console.html"
echo "=============================================="
set -a; . ./.env; set +a
exec node dist/main
