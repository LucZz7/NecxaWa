/* NecxChat Console - real OpenWA REST API client.
   Base URL + API key are configured on the Connection tab and stored in localStorage.
   All requests use the X-API-Key header (OpenWA auth scheme). */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function log(msg, cls) {
    const el = $("log");
    if (!el) return;
    const t = new Date().toLocaleTimeString();
    el.innerHTML += `<span class="t">[${t}]</span> <span class="${cls || ""}">${esc(msg)}</span>\n`;
    el.scrollTop = el.scrollHeight;
  }

  /* Relay transport: every call goes through the private Firebase relay
     channel to the managed backend. Returns {status, data}; throws on
     transport failure or backend error status.
     Direct mode: if the user configured their own backend URL, use fetch. */
  function isDirectMode() {
    const b = window.NECXAWA.getApiBase();
    return b && !/localhost|127\.0\.0\.1/.test(b) && window.NECXAWA.directEnabled();
  }
  async function api(method, path, body) {
    let res;
    if (isDirectMode()) {
      const base = window.NECXAWA.getApiBase();
      const key = window.NECXAWA.getApiKey();
      const r = await fetch(base + path, {
        method,
        headers: Object.assign({ "Content-Type": "application/json" }, key ? { "X-API-Key": key } : {}),
        body: body ? JSON.stringify(body) : undefined,
      });
      let data = null;
      try { data = await r.json(); } catch (e) { /* empty */ }
      res = { status: r.status, data };
    } else {
      try {
        res = await window.NECXAWA_RELAY.request(method, path, body);
      } catch (e) {
        throw new Error(e && e.message ? e.message : "Relay error");
      }
    }
    const data = res.data;
    if (res.status < 200 || res.status >= 300) {
      const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      throw new Error(Array.isArray(msg) ? msg.join("; ") : String(msg));
    }
    return data;
  }

  function statusChip(s) {
    return `<span class="chip ${esc(s || "created")}">${esc((s || "created").replace("_", " "))}</span>`;
  }

  /* ---------- tabs ---------- */
  document.querySelectorAll(".side button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".side button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      document.querySelectorAll(".tab").forEach((t) => t.classList.add("hidden"));
      const tab = $("tab-" + b.dataset.tab);
      tab.classList.remove("hidden");
      tab.classList.remove("fade"); void tab.offsetWidth; tab.classList.add("fade");
      if (b.dataset.tab === "sessions") loadSessions();
      if (b.dataset.tab === "webhooks") loadWebhooks();
    });
  });

  /* ---------- connection ---------- */
  function setNavStatus(ok) {
    const d = $("nav-dot"), t = $("nav-status");
    if (d) d.style.background = ok ? "#22c55e" : "#e11d2e";
    if (d) d.style.boxShadow = ok ? "0 0 12px #22c55e" : "0 0 12px #e11d2e";
    if (t) t.textContent = ok ? "Backend online" : "Console";
  }

  async function testConnection() {
    const out = $("conn-result");
    const direct = isDirectMode();
    out.innerHTML = `<span class="status-dot warn"></span>${direct ? "Connecting to your backend..." : "Connecting via private relay..."}`;
    try {
      let st;
      if (direct) {
        const h = await api("GET", "/api/health/ready");
        st = h.status || "ready";
      } else {
        const h = await window.NECXAWA_RELAY.ping();
        st = (h.data && h.data.status) || "ready";
      }
      out.innerHTML = `<div class="alert alert-green"><span class="status-dot ok"></span>Backend online — ${esc(st)}. ${direct ? "Direct backend mode." : "Private relay channel working."}</div>`;
      setNavStatus(true);
      log(direct ? "Direct backend connected." : "Relay connected — backend is online.", "ok2");
    } catch (e) {
      setNavStatus(false);
      out.innerHTML = `<div class="alert alert-red"><span class="status-dot bad"></span>Connection failed: ${esc(e.message)}<br><br>
        ${direct ? "URL aur key dobara check karo." : "Apna <b>private access link</b> dobara paste karke <b>Save &amp; Test</b> dabao."}</div>`;
      log("Connection failed: " + e.message, "err");
    }
  }

  /* ---------- sessions ---------- */
  let qrTimer = null;
  function stopQrPoll() { if (qrTimer) { clearInterval(qrTimer); qrTimer = null; } }

  async function loadSessions() {
    const box = $("session-list");
    box.innerHTML = `<p class="desc">Loading sessions...</p>`;
    try {
      const list = await api("GET", "/api/sessions");
      const arr = Array.isArray(list) ? list : (list.sessions || list.data || []);
      if (!arr.length) { box.innerHTML = `<div class="alert alert-amber">No sessions yet. Create one below, then scan the QR with WhatsApp.</div>`; return; }
      box.innerHTML = arr.map((s) => `
        <div class="session">
          <div class="top"><span class="name">${esc(s.name)}</span>${statusChip(s.status)}</div>
          <div class="meta">id: ${esc(s.id)}${s.phone ? " · +" + esc(s.phone) : ""}${s.pushName ? " · " + esc(s.pushName) : ""}</div>
          <div class="actions">
            <button class="btn btn-ghost mini" data-act="qr" data-id="${esc(s.id)}" data-name="${esc(s.name)}">QR / Pair</button>
            <button class="btn btn-ghost mini" data-act="start" data-id="${esc(s.id)}">Start</button>
            <button class="btn btn-ghost mini" data-act="stop" data-id="${esc(s.id)}">Stop</button>
            <button class="btn btn-ghost mini" data-act="use" data-id="${esc(s.id)}">Use in Sender</button>
            <button class="btn btn-ghost mini" data-act="del" data-id="${esc(s.id)}" style="border-color:rgba(225,29,46,.5);color:#ff8a96">Delete</button>
          </div>
        </div>`).join("");
      box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => sessionAction(b.dataset.act, b.dataset.id, b.dataset.name)));
    } catch (e) {
      box.innerHTML = `<div class="alert alert-red">Failed to load sessions: ${esc(e.message)}</div>`;
    }
  }

  async function sessionAction(act, id, name) {
    stopQrPoll();
    try {
      if (act === "use") { window.NECXAWA.setSessionId(id); $("send-session").value = id; log("Session selected for sender: " + name, "inf"); switchTab("send"); return; }
      if (act === "del") {
        if (!confirm(`Delete session "${name}"?`)) return;
        await api("DELETE", `/api/sessions/${encodeURIComponent(id)}`);
        log("Session deleted: " + name, "ok2"); return loadSessions();
      }
      if (act === "start") { await api("POST", `/api/sessions/${encodeURIComponent(id)}/start`); log("Session start requested: " + name, "inf"); return loadSessions(); }
      if (act === "stop") { await api("POST", `/api/sessions/${encodeURIComponent(id)}/stop`); log("Session stopped: " + name, "inf"); return loadSessions(); }
      if (act === "qr") return showPairing(id, name);
    } catch (e) { log("Error: " + e.message, "err"); alert("Error: " + e.message); }
  }

  async function showPairing(id, name) {
    const box = $("qr-box");
    box.classList.remove("hidden");
    box.innerHTML = `<p class="desc">Loading QR for <b>${esc(name)}</b>...</p>`;
    const render = async () => {
      try {
        const r = await api("GET", `/api/sessions/${encodeURIComponent(id)}/qr`);
        if (r.status === "ready") {
          stopQrPoll();
          box.innerHTML = `<div class="alert alert-green"><span class="status-dot ok"></span><b>${esc(name)}</b> is connected and ready.</div>`;
          loadSessions(); return;
        }
        box.innerHTML = `<div class="qrbox">
            <p class="desc">Scan with WhatsApp <span class="mono">Linked devices &gt; Link a device</span> ${statusChip(r.status)}</p>
            <img src="${r.qrCode}" alt="WhatsApp QR code">
            <p class="desc" style="margin-top:12px">QR refreshes automatically. Or use a pairing code below instead.</p>
            <div class="row2" style="max-width:420px;margin:0 auto">
              <input id="pair-phone" placeholder="628123456789" class="mono">
              <button class="btn btn-red mini" id="pair-btn">Get pairing code</button>
            </div>
            <p class="mono" id="pair-out" style="margin-top:10px;font-size:18px"></p>
          </div>`;
        $("pair-btn").onclick = async () => {
          const phone = $("pair-phone").value.replace(/\D/g, "");
          if (!phone) return alert("Enter phone number in international format, digits only.");
          try {
            const pc = await api("POST", `/api/sessions/${encodeURIComponent(id)}/pairing-code`, { phoneNumber: phone });
            $("pair-out").textContent = pc.pairingCode;
            log("Pairing code for " + name + ": " + pc.pairingCode, "ok2");
          } catch (e) { alert("Pairing code failed: " + e.message); }
        };
      } catch (e) { box.innerHTML = `<div class="alert alert-red">QR failed: ${esc(e.message)}</div>`; stopQrPoll(); }
    };
    await render();
    stopQrPoll();
    qrTimer = setInterval(render, 15000);
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function createSession() {
    const name = $("new-session-name").value.trim();
    if (!/^[A-Za-z0-9-]{3,50}$/.test(name)) return alert("Name: 3-50 chars, letters/numbers/hyphens only.");
    try {
      const s = await api("POST", "/api/sessions", { name });
      log("Session created: " + s.name + " (" + s.status + ")", "ok2");
      $("new-session-name").value = "";
      window.NECXAWA.setSessionId(s.id);
      await loadSessions();
      showPairing(s.id, s.name);
    } catch (e) { alert("Create failed: " + e.message); log("Create failed: " + e.message, "err"); }
  }

  /* ---------- sender ---------- */
  function phoneToChatId(phone) {
    const d = phone.replace(/\D/g, "");
    if (!d) return "";
    if (phone.includes("@")) return phone.trim();
    return d + "@c.us";
  }

  async function refreshSendSessions() {
    const sel = $("send-session");
    try {
      const list = await api("GET", "/api/sessions");
      const arr = Array.isArray(list) ? list : (list.sessions || []);
      sel.innerHTML = arr.map((s) => `<option value="${esc(s.id)}" ${s.status === "ready" ? "" : "disabled"}>${esc(s.name)} — ${esc(s.status)}</option>`).join("")
        || `<option value="">No sessions</option>`;
      const saved = window.NECXAWA.getSessionId();
      if (saved) sel.value = saved;
      sel.onchange = () => window.NECXAWA.setSessionId(sel.value);
    } catch (e) { sel.innerHTML = `<option value="">Connect backend first</option>`; }
  }

  async function sendMessage() {
    const sid = $("send-session").value;
    const to = phoneToChatId($("send-to").value);
    const text = $("send-text").value;
    const type = $("send-type").value;
    if (!sid) return alert("Select a connected session first.");
    if (!to) return alert("Enter recipient phone number.");
    const out = $("send-result");
    out.innerHTML = "Sending...";
    try {
      let path = "/messages/send-text", payload = { chatId: to, text };
      if (type === "image" || type === "document") {
        const url = $("send-media-url").value.trim();
        if (!url.startsWith("http")) throw new Error("Media URL must start with http(s).");
        path = type === "image" ? "/messages/send-image" : "/messages/send-document";
        payload = { chatId: to, url, caption: text || undefined };
      } else if (!text) throw new Error("Message text is empty.");
      const r = await api("POST", `/api/sessions/${encodeURIComponent(sid)}${path}`, payload);
      out.innerHTML = `<div class="alert alert-green"><span class="status-dot ok"></span>Sent. Message id: <span class="mono">${esc(r.id || r.messageId || JSON.stringify(r)).slice(0, 120)}</span></div>`;
      log(`Sent ${type} to ${to}`, "ok2");
    } catch (e) {
      out.innerHTML = `<div class="alert alert-red">Send failed: ${esc(e.message)}</div>`;
      log("Send failed: " + e.message, "err");
    }
  }

  /* ---------- chats ---------- */
  async function loadChats() {
    const sid = window.NECXAWA.getSessionId();
    const box = $("chat-list");
    if (!sid) { box.innerHTML = `<div class="alert alert-amber">Select a session in the Sender tab first.</div>`; return; }
    box.innerHTML = `<p class="desc">Loading chats...</p>`;
    try {
      const list = await api("GET", `/api/sessions/${encodeURIComponent(sid)}/chats`);
      const arr = Array.isArray(list) ? list : (list.chats || list.data || []);
      if (!arr.length) { box.innerHTML = `<div class="alert alert-amber">No chats found for this session.</div>`; return; }
      box.innerHTML = `<table><thead><tr><th>Chat</th><th>ID</th><th></th></tr></thead><tbody>` +
        arr.slice(0, 100).map((c) => `<tr><td>${esc(c.name || c.pushName || "(unknown)")}</td>
          <td class="mono">${esc(c.id)}</td>
          <td><button class="btn btn-ghost mini" data-chat="${esc(c.id)}">Send to</button></td></tr>`).join("") + `</tbody></table>`;
      box.querySelectorAll("button").forEach((b) => b.onclick = () => {
        $("send-to").value = b.dataset.chat.replace("@c.us", "").replace("@g.us", "");
        switchTab("send"); log("Recipient set: " + b.dataset.chat, "inf");
      });
    } catch (e) { box.innerHTML = `<div class="alert alert-red">Failed: ${esc(e.message)}</div>`; }
  }

  /* ---------- webhooks ---------- */
  async function loadWebhooks() {
    const sid = window.NECXAWA.getSessionId();
    const box = $("webhook-list");
    if (!sid) { box.innerHTML = `<div class="alert alert-amber">Select a session in the Sender tab first.</div>`; return; }
    try {
      const list = await api("GET", `/api/sessions/${encodeURIComponent(sid)}/webhooks`);
      const arr = Array.isArray(list) ? list : (list.webhooks || list.data || []);
      box.innerHTML = arr.length ? `<table><thead><tr><th>URL</th><th>Events</th><th></th></tr></thead><tbody>` +
        arr.map((w) => `<tr><td class="mono">${esc(w.url)}</td><td class="mono">${esc((w.events || []).join(", "))}</td>
          <td><button class="btn btn-ghost mini" data-id="${esc(w.id)}" style="border-color:rgba(225,29,46,.5);color:#ff8a96">Delete</button></td></tr>`).join("") + `</tbody></table>`
        : `<div class="alert alert-amber">No webhooks registered for this session.</div>`;
      box.querySelectorAll("button").forEach((b) => b.onclick = async () => {
        if (!confirm("Delete this webhook?")) return;
        await api("DELETE", `/api/sessions/${encodeURIComponent(sid)}/webhooks/${encodeURIComponent(b.dataset.id)}`);
        log("Webhook deleted", "ok2"); loadWebhooks();
      });
    } catch (e) { box.innerHTML = `<div class="alert alert-red">Failed: ${esc(e.message)}</div>`; }
  }

  async function createWebhook() {
    const sid = window.NECXAWA.getSessionId();
    const url = $("wh-url").value.trim();
    if (!sid) return alert("Select a session first.");
    if (!url.startsWith("http")) return alert("Webhook URL must start with http(s).");
    try {
      await api("POST", `/api/sessions/${encodeURIComponent(sid)}/webhooks`, { url, events: ["*"] });
      log("Webhook registered: " + url, "ok2");
      $("wh-url").value = "";
      loadWebhooks();
    } catch (e) { alert("Failed: " + e.message); }
  }

  /* ---------- number check ---------- */
  async function checkNumber() {
    const sid = window.NECXAWA.getSessionId();
    const num = $("check-num").value.replace(/\D/g, "");
    const out = $("check-result");
    if (!sid) return alert("Select a session first.");
    if (!num) return alert("Enter a phone number.");
    out.innerHTML = "Checking...";
    try {
      const r = await api("GET", `/api/sessions/${encodeURIComponent(sid)}/contacts/check/${encodeURIComponent(num)}`);
      out.innerHTML = `<div class="alert ${r.exists ? "alert-green" : "alert-amber"}">${r.exists ? "Number is on WhatsApp" : "Number is NOT on WhatsApp"} <span class="mono">${esc(num)}</span></div>`;
    } catch (e) { out.innerHTML = `<div class="alert alert-red">Check failed: ${esc(e.message)}</div>`; }
  }

  function switchTab(name) {
    document.querySelector(`.side button[data-tab="${name}"]`).click();
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("save-conn").onclick = () => {
      try {
        window.NECXAWA_RELAY.setSecret($("relay-link").value);
      } catch (e) { alert(e.message); return; }
      $("relay-link").value = "";
      log("Private link saved.", "inf");
      testConnection();
    };
    $("test-conn").onclick = testConnection;
    $("save-direct").onclick = () => {
      const base = $("api-base").value.trim().replace(/\/+$/, "");
      const key = $("api-key").value.trim();
      if (!/^https:\/\//i.test(base)) return alert("Backend URL https:// se shuru hona chahiye (codespace ka public URL).");
      if (key.length < 8) return alert("API key dalo (codespace ke .backend/.env se).");
      window.NECXAWA.save(base, key);
      window.NECXAWA.setDirect(true);
      $("api-key").value = "";
      log("Direct backend saved.", "inf");
      testConnection();
    };
    $("clear-direct").onclick = () => {
      window.NECXAWA.setDirect(false);
      log("Back to relay mode.", "inf");
      testConnection();
    };
    // pre-fill direct fields if saved
    if (window.NECXAWA.directEnabled()) {
      $("api-base").value = window.NECXAWA.getApiBase();
    }
    $("create-session").onclick = createSession;
    $("send-btn").onclick = sendMessage;
    $("send-type").onchange = (e) => $("media-row").classList.toggle("hidden", e.target.value === "text");
    $("load-chats").onclick = loadChats;
    $("check-btn").onclick = checkNumber;
    $("wh-create").onclick = createWebhook;
    $("aireply-toggle").onclick = toggleAireply;
    $("aireply-save").onclick = saveAireply;
    // load AI reply config when its tab opens
    document.querySelector('[data-tab="aireply"]').addEventListener("click", loadAireply);
    refreshSendSessions();
    log("NecxChat console ready. Configure your backend connection to begin.", "inf");
    // one-tap link (?api=/?key=) or private link (?t=...) already known?
    // auto-test right away, and jump to Sessions on success
    const autoMode = window.NECXAWA_RELAY.hasSecret() || isDirectMode();
    if (autoMode) {
      testConnection().then(() => {
        // if backend is online, take the user straight to Sessions (QR flow)
        const ok = document.querySelector("#conn-result .alert-green");
        if (ok) switchTab("sessions");
      });
    }
  });

  /* ---------- AI auto-reply (codespace direct mode only) ---------- */
  function aireplyBase() {
    if (!isDirectMode()) return null;
    const b = window.NECXAWA.getApiBase();
    // https://<name>-2785.app.github.dev -> https://<name>-2786.app.github.dev
    return b.replace(/-2785(\.|$)/, "-2786$1");
  }
  async function loadAireply() {
    const st = $("aireply-status"), btn = $("aireply-toggle"), state = $("aireply-state");
    const base = aireplyBase();
    if (!base) {
      st.innerHTML = `<div class="alert alert-red">AI Reply ke liye <b>direct backend</b> (codespace) chahiye. Pehle Connection tab me apna codespace backend set karo.</div>`;
      btn.textContent = "Unavailable"; btn.disabled = true;
      return;
    }
    btn.disabled = false;
    st.innerHTML = `<span class="status-dot warn"></span>Loading...`;
    try {
      const r = await fetch(base + "/api/autoreply/config");
      const c = await r.json();
      btn.textContent = c.enabled ? "Turn OFF" : "Turn ON";
      state.textContent = c.enabled ? "● ON — AI jawab de raha hai" : "○ OFF";
      state.style.color = c.enabled ? "#4ade80" : "#888";
      $("aireply-delay").value = c.replyDelaySec || 20;
      if (c.systemPrompt) $("aireply-prompt").value = c.systemPrompt;
      st.innerHTML = c.hasKey
        ? `<div class="alert alert-green"><span class="status-dot ok"></span>Gemini API key set hai.</div>`
        : `<div class="alert alert-red"><span class="status-dot bad"></span>Gemini API key nahi dali — upar link se banao aur yahan paste karo.</div>`;
      btn.dataset.enabled = c.enabled ? "1" : "0";
      log("AI reply config loaded.", "inf");
    } catch (e) {
      st.innerHTML = `<div class="alert alert-red">Auto-reply server nahi mil raha: ${esc(e.message)}<br>Codespace me <b>bash .devcontainer/start-native.sh</b> dobara chalao.</div>`;
      btn.textContent = "Retry"; btn.dataset.enabled = "0";
    }
  }
  async function toggleAireply() {
    const base = aireplyBase();
    if (!base) return;
    const btn = $("aireply-toggle");
    const to = btn.dataset.enabled !== "1";
    btn.disabled = true;
    try {
      const r = await fetch(base + "/api/autoreply/config", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ enabled: to }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      log("AI reply " + (to ? "ON" : "OFF"), "ok2");
    } catch (e) {
      alert("Failed: " + e.message);
    }
    btn.disabled = false;
    loadAireply();
  }
  async function saveAireply() {
    const base = aireplyBase();
    if (!base) return;
    const out = $("aireply-result");
    const key = $("aireply-key").value.trim();
    const delay = Math.max(5, Math.min(120, parseInt($("aireply-delay").value, 10) || 20));
    const prompt = $("aireply-prompt").value.trim();
    if (key && !/^AIza[0-9A-Za-z_-]{20,}$/.test(key)) {
      out.innerHTML = `<div class="alert alert-red">Ye Gemini API key jaisi nahi lag rahi (AIza... se shuru hoti hai). Dobara check karo.</div>`;
      return;
    }
    out.innerHTML = `<span class="status-dot warn"></span>Saving...`;
    try {
      const body = { replyDelaySec: delay, systemPrompt: prompt };
      if (key) body.geminiApiKey = key;
      const r = await fetch(base + "/api/autoreply/config", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      $("aireply-key").value = "";
      out.innerHTML = `<div class="alert alert-green"><span class="status-dot ok"></span>Saved! ${key ? "API key set ho gayi." : ""}</div>`;
      log("AI reply settings saved.", "ok2");
    } catch (e) {
      out.innerHTML = `<div class="alert alert-red">Save failed: ${esc(e.message)}</div>`;
    }
    loadAireply();
  }
})();
