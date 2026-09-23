#!/bin/bash
# NecxaWA cloud backend — Codespace start hote hi backend auto-start.
# Pehli baar API key bhi khud bana leta hai.
cd "$(dirname "$0")/.." || exit 1

# 1. API key (sirf pehli baar)
if [ ! -f backend/.env ]; then
  KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  printf 'API_MASTER_KEY=%s\nCORS_ORIGINS=*\n' "$KEY" > backend/.env
  chmod 600 backend/.env
fi
set -a; . backend/.env; set +a

# 2. Docker daemon ka wait (max ~60s)
for _ in $(seq 1 30); do
  docker info >/dev/null 2>&1 && break
  sleep 2
done

# 3. Backend container start (purana hata ke fresh)
docker rm -f openwa-api >/dev/null 2>&1 || true
docker run -d --name openwa-api --restart unless-stopped \
  -p 2785:2785 \
  -e "API_MASTER_KEY=$API_MASTER_KEY" \
  -e "CORS_ORIGINS=*" \
  -e "SERVE_DASHBOARD=false" \
  -e "NODE_ENV=production" \
  -v openwa-data:/app/data \
  rmyndharis/openwa:0.23.6 >/dev/null 2>&1

echo ""
echo "=================================================="
echo " NecxaWA backend LIVE hai (port 2785)"
echo "=================================================="
echo " API key  (console ke Connection me dalni hai):"
echo " $API_MASTER_KEY"
echo ""
echo " Backend URL ke liye: PORTS tab me 2785 ko Public"
echo " karo, phir Forwarded Address copy karo."
echo " Poora step-by-step: CLOUD_BACKEND.md kholo."
echo "=================================================="
