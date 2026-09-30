#!/usr/bin/env node
/* NecxaWA AI Auto-Reply — jab user offline/busy ho, AI khud jawab de.
 *
 * Ye script codespace pe backend ke saath chalta hai.
 * - Har 15 sec me naye incoming messages check karta hai
 * - Auto-reply ON ho aur Gemini API key set ho to AI jawab banata hai
 * - Language auto-detect: jis bhasha me message aaya, usi me jawab
 * - Config: auto-reply-config.json (console se set hota hai)
 * - Config API: port 2786, GET/POST /api/autoreply/config
 *
 * Start: node .devcontainer/auto-reply.js
 * (start-native.sh ise backend ke saath auto-start karta hai)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const CONFIG_PATH = path.join(DIR, "auto-reply-config.json");
const SEEN_PATH = path.join(DIR, "auto-reply-seen.json");
const BACKEND = process.env.BACKEND_URL || "http://localhost:2785";
const PORT = parseInt(process.env.AUTOREPLY_PORT || "2786", 10);
const POLL_MS = 15000;

/* ---------- config ---------- */
function loadConfig() {
  try {
    const c = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return {
      enabled: !!c.enabled,
      geminiApiKey: c.geminiApiKey || "",
      systemPrompt: c.systemPrompt || "",
      replyDelaySec: Math.max(5, Math.min(120, parseInt(c.replyDelaySec, 10) || 20)),
    };
  } catch {
    return { enabled: false, geminiApiKey: "", systemPrompt: "", replyDelaySec: 20 };
  }
}
function saveConfig(c) {
  const cur = loadConfig();
  const next = {
    enabled: typeof c.enabled === "boolean" ? c.enabled : cur.enabled,
    geminiApiKey: typeof c.geminiApiKey === "string" && c.geminiApiKey ? c.geminiApiKey : cur.geminiApiKey,
    systemPrompt: typeof c.systemPrompt === "string" ? c.systemPrompt : cur.systemPrompt,
    replyDelaySec: c.replyDelaySec ? Math.max(5, Math.min(120, parseInt(c.replyDelaySec, 10) || 20)) : cur.replyDelaySec,
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2));
  return next;
}
function publicConfig() {
  const c = loadConfig();
  return { enabled: c.enabled, hasKey: !!c.geminiApiKey, systemPrompt: c.systemPrompt, replyDelaySec: c.replyDelaySec };
}

/* ---------- seen ids ---------- */
let seen = new Set();
try {
  seen = new Set(JSON.parse(fs.readFileSync(SEEN_PATH, "utf8")));
} catch {}
function markSeen(id) {
  seen.add(id);
  if (seen.size > 2000) seen = new Set([...seen].slice(-1500));
  try { fs.writeFileSync(SEEN_PATH, JSON.stringify([...seen].slice(-1500))); } catch {}
}

/* ---------- backend api ---------- */
function apiKey() {
  try {
    const env = fs.readFileSync(path.join(DIR, "..", ".backend", ".env"), "utf8");
    const m = env.match(/^API_MASTER_KEY=(.+)$/m);
    return m ? m[1].trim() : "";
  } catch {
    return process.env.API_MASTER_KEY || "";
  }
}
async function bget(p) {
  const r = await fetch(BACKEND + p, { headers: { "X-API-Key": apiKey() } });
  if (!r.ok) throw new Error("backend " + r.status);
  return r.json();
}
async function bpost(p, body) {
  const r = await fetch(BACKEND + p, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey() },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("backend " + r.status);
  return r.json();
}

/* ---------- gemini ---------- */
async function geminiReply(key, systemPrompt, incoming) {
  const sys = (systemPrompt || "").trim();
  const prompt =
    (sys ? sys + "\n\n" : "") +
    "You are a helpful WhatsApp assistant replying on behalf of the user who is currently busy/offline.\n" +
    "Rules:\n" +
    "- Detect the language of the incoming message and reply in the SAME language (Hindi/Hinglish -> Hinglish, English -> English, etc.).\n" +
    "- Keep replies natural, warm and concise (1-3 sentences).\n" +
    "- Never mention you are an AI unless asked.\n" +
    "- If the message needs the user's personal attention, say they will reply soon.\n\n" +
    "Incoming message: \"" + incoming.replace(/"/g, "'") + "\"";

  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(key),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!r.ok) throw new Error("gemini " + r.status);
  const d = await r.json();
  const t = d?.candidates?.[0]?.content?.parts?.[0]?.text;
  return (t || "").trim() || null;
}

/* ---------- poll loop ---------- */
let pending = []; // {sessionId, chatId, body, id, at}

async function poll() {
  const cfg = loadConfig();
  if (!cfg.enabled || !cfg.geminiApiKey) return;

  try {
    const sessions = await bget("/api/sessions");
    const list = Array.isArray(sessions) ? sessions : sessions.sessions || sessions.data || [];
    for (const s of list) {
      const sid = s.id || s.sessionId;
      if (!sid || (s.status && s.status !== "connected" && s.status !== "ready" && s.status !== "authenticated")) continue;
      let msgs;
      try {
        msgs = await bget(`/api/sessions/${sid}/messages?limit=20&inlineMedia=false`);
      } catch { continue; }
      const arr = msgs.messages || msgs.data || [];
      for (const m of arr) {
        if (!m || m.fromMe) continue;
        if (m.type && m.type !== "text" && m.type !== "chat") continue;
        const body = (m.body || m.text || "").trim();
        if (!body) continue;
        const id = m.id || (m.chatId + ":" + m.timestamp);
        if (seen.has(id)) continue;
        markSeen(id);
        // Ignore very old messages on first run
        if (Date.now() - (m.timestamp || 0) * 1000 > 10 * 60 * 1000) continue;
        pending.push({ sessionId: sid, chatId: m.chatId, body, id, at: Date.now() });
        console.log("[auto-reply] new message queued from", m.chatId);
      }
    }
  } catch (e) {
    console.log("[auto-reply] poll error:", e.message);
  }

  // Send due replies (with human-like delay)
  const cfg2 = loadConfig();
  const now = Date.now();
  const due = pending.filter((p) => now - p.at >= cfg2.replyDelaySec * 1000);
  pending = pending.filter((p) => now - p.at < cfg2.replyDelaySec * 1000);
  for (const p of due) {
    try {
      const reply = await geminiReply(cfg2.geminiApiKey, cfg2.systemPrompt, p.body);
      if (!reply) continue;
      await bpost(`/api/sessions/${p.sessionId}/messages/send-text`, { chatId: p.chatId, text: reply });
      console.log("[auto-reply] replied to", p.chatId);
    } catch (e) {
      console.log("[auto-reply] reply failed:", e.message);
    }
    await new Promise((r) => setTimeout(r, 3000)); // pacing
  }
}

/* ---------- config http server ---------- */
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  if (req.url === "/api/autoreply/config") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(publicConfig()));
      return;
    }
    if (req.method === "POST") {
      let b = "";
      req.on("data", (c) => (b += c));
      req.on("end", () => {
        try {
          const next = saveConfig(JSON.parse(b || "{}"));
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, enabled: next.enabled, hasKey: !!next.geminiApiKey }));
        } catch {
          res.writeHead(400); res.end("bad json");
        }
      });
      return;
    }
  }
  if (req.url === "/api/autoreply/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, pending: pending.length }));
    return;
  }
  res.writeHead(404); res.end("not found");
});

server.listen(PORT, () => {
  console.log(`[auto-reply] config server on :${PORT}, polling every ${POLL_MS / 1000}s`);
  setInterval(poll, POLL_MS);
});
