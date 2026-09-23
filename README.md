# NecxaWA — Real WhatsApp API Gateway Console

A real, working web console for the open-source **[OpenWA](https://github.com/rmyndharis/OpenWA)** WhatsApp API gateway (MIT licensed).

**This is not a simulation.** Every button in the console calls the genuine OpenWA REST API:
- `POST /api/sessions` — create WhatsApp sessions
- `GET /api/sessions/{id}/qr` — live QR pairing (or 8-digit pairing codes)
- `POST /api/sessions/{id}/messages/send-text|send-image|send-document|...` — real sending
- `GET /api/sessions/{id}/chats`, `/contacts/check/{number}` — real account data
- `POST /api/sessions/{id}/webhooks` — live event delivery

Live site: **https://luczz7.github.io/NecxaWa/** (static frontend, free on GitHub Pages)

## Architecture

```
Your browser (this site, GitHub Pages)
        │  HTTPS / X-API-Key
        ▼
OpenWA backend (YOU run this — Docker, port 2785)
        │  WhatsApp Web protocol
        ▼
   WhatsApp account (paired via QR)
```

The backend cannot run on GitHub Pages (static hosting only). You run it yourself — free — on your own machine or any server.

## Quickstart (5 minutes, free)

```bash
# 1. Run the backend
git clone https://github.com/rmyndharis/OpenWA
cd OpenWA
docker compose up -d

# 2. Copy the first-boot admin API key
docker logs openwa-api 2>&1 | grep -i "api key"

# 3. Open the console, enter http://localhost:2785 + your key, create a session, scan the QR
```

See `.env.example` for backend settings (notably `CORS_ORIGINS` when the console and backend are on different origins).

## 24/7 hosting (still free)

Run the same `docker compose up -d` on an always-on machine: a home server, or a free-tier VPS (e.g. Oracle Cloud Always Free). Put a TLS reverse proxy (Caddy/nginx) in front and set `CORS_ORIGINS=https://luczz7.github.io` on the backend.

## Project layout

| File | What it is |
|---|---|
| `index.html` | Landing page |
| `console.html` | The real console (sessions, QR pairing, sender, chats, webhooks) |
| `docs.html` | API docs with real curl/JS examples |
| `js/config.js` | Backend URL + API key storage (localStorage only) |
| `js/console.js` | Real OpenWA REST client (`X-API-Key` auth) |
| `css/style.css` | Red/black/white glassmorphism theme |
| `.env.example` | Backend environment template |

## Honest notes

- This automates **WhatsApp Web (unofficial)**. WhatsApp may restrict numbers with spammy/bulk behaviour. Use your own number, warm up gradually, message only people expecting you.
- API shapes above were extracted from OpenWA `openapi.json` (v0.23.6). If OpenWA changes its API, update `js/console.js` accordingly.
- Never commit your API key. The console keeps it in browser localStorage only.
