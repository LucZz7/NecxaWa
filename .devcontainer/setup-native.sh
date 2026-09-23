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

echo "== [3b/4] key ko secret gist me daalo (console one-tap link ke liye) =="
if [ -n "${GITHUB_TOKEN:-}" ] && [ -n "${CODESPACE_NAME:-}" ]; then
  API_KEY="$(grep '^API_MASTER_KEY=' "$BK/.env" | cut -d= -f2)"
  CS_URL="https://${CODESPACE_NAME}-2785.app.github.dev"
  ( GITHUB_TOKEN="$GITHUB_TOKEN" CODESPACE_NAME="$CODESPACE_NAME" API_KEY="$API_KEY" CS_URL="$CS_URL" python3 - <<'PYEOF'
import json, os, urllib.request
token = os.environ["GITHUB_TOKEN"]
name = os.environ["CODESPACE_NAME"]
content = f"NECXAWA_API_KEY={os.environ['API_KEY']}\nCODESPACE_NAME={name}\nAPI_URL={os.environ['CS_URL']}\n"
desc = f"NecxaWA backend key - {name}"
def call(method, url, data=None):
    r = urllib.request.Request(url, data=json.dumps(data).encode() if data else None, method=method)
    r.add_header("Authorization", f"Bearer {token}")
    r.add_header("Accept", "application/vnd.github+json")
    r.add_header("X-GitHub-Api-Version", "2022-11-28")
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, json.loads(resp.read())
    except Exception as e:
        print("gist api note:", str(e)[:120])
        return 0, {}
st, gists = call("GET", "https://api.github.com/gists?per_page=100")
gid = None
if st == 200:
    for g in gists:
        if g.get("description") == desc:
            gid = g["id"]; break
payload = {"description": desc, "public": False, "files": {"necxawa-backend-key.txt": {"content": content}}}
if gid:
    st, _ = call("PATCH", f"https://api.github.com/gists/{gid}", payload)
    print("gist updated:", st)
else:
    st, out = call("POST", "https://api.github.com/gists", payload)
    print("gist created:", st, out.get("html_url", ""))
PYEOF
  ) || echo "(gist step me dikkat aayi — key .backend/.env me safe hai)"
else
  echo "(gist skip: token/name nahi mila — key .backend/.env me safe hai)"
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
