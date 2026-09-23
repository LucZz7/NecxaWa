# NecxaWA — Website

Premium self-hosted WhatsApp automation platform website.
Red / Black / White glassmorphism UI · Fully animated · Zero emojis (premium SVG icons only).

## Pages

| File | Page |
|------|------|
| `index.html` | Landing page — hero, features, how-it-works, API preview, showcase, pricing, FAQ |
| `docs.html` | Full API reference — real OpenWA endpoints with code samples in **cURL, JavaScript, Python, PHP, Go** |
| `dashboard.html` | Command-center UI — overview, chats, auto-reply rules, bulk sender, scheduler, logs, settings |

## Structure

```
necxawa-website/
├── index.html
├── docs.html
├── dashboard.html
├── css/
│   └── style.css        # Glassmorphism design system + animations + responsive
├── js/
│   └── main.js          # Nav, reveal animations, counters, tabs, copy, FAQ, dashboard
├── assets/
│   └── img/             # AI-generated premium visuals (hero, dashboard, automation)
└── README.md
```

## Run locally

Just open `index.html` in a browser — no build step needed.
Or serve it: `python3 -m http.server 8080` → http://localhost:8080

## Deploy (GitHub Pages)

1. Create a repo (e.g. `necxawa-website`) and push these files
2. Repo → Settings → Pages → Deploy from branch → `main` / root
3. Site goes live at `https://<username>.github.io/necxawa-website/`

## Connect the backend

The dashboard UI is front-end ready. Point it at your OpenWA gateway:

- Base URL: `http://your-server:3000/api`
- Auth header: `x-api-key: YOUR_API_KEY`
- Example: `POST /api/sessions/{sessionId}/messages/send-text`

Deploy OpenWA with: `docker compose up -d` (see https://github.com/rmyndharis/OpenWA)

## API endpoints documented (real, from OpenWA v0.23.6)

- `POST /api/sessions` — create session
- `GET /api/sessions` — list sessions
- `POST /api/sessions/{sessionId}/messages/send-text` — send text
- `POST /api/sessions/{sessionId}/messages/send-image` — send image
- `POST /api/sessions/{sessionId}/messages/send-bulk` — bulk send
- `POST /api/sessions/{sessionId}/automation-rules` — auto-reply rules
- `GET /api/sessions/{sessionId}/chats` — list chats
- `GET /api/sessions/{sessionId}/contacts/check/{number}` — check contact
- Webhooks — `message.received` event payload + receiver example

---
© 2026 NecxaWA · Built on the open-source OpenWA gateway (MIT) · Not affiliated with WhatsApp/Meta.
