#!/bin/bash
# NecxaWA backend — one command setup (Linux / Mac)
set -e
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker nahi mila. Pehle Docker install karo: https://docs.docker.com/get-docker/"
  exit 1
fi

if [ ! -f .env ]; then
  KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  printf 'API_MASTER_KEY=%s\nCORS_ORIGINS=*\n' "$KEY" > .env
  chmod 600 .env
  echo "Nayi API key bana di gayi."
fi

docker compose up -d
echo ""
echo "=============================================="
echo " NecxaWA backend LIVE hai"
echo "=============================================="
echo " Backend URL : http://localhost:2785"
echo " API key     : $(grep '^API_MASTER_KEY=' .env | cut -d= -f2)"
echo ""
echo "Ab console kholo:"
echo " https://luczz7.github.io/NecxaWa/console.html"
echo "Connection me upar wali URL + key daal ke Test dabao,"
echo "phir session banao aur QR scan karo."
echo "=============================================="
