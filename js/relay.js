/* NecxaWA Relay transport — the console talks to the managed backend through a
   private Firebase relay channel. No backend URL or API key is needed in the
   browser; the private link (?t=...) identifies your channel. */
(function () {
  "use strict";
  const DB = "https://leadsync-main-default-rtdb.firebaseio.com";
  const LS_KEY = "necxawa_relay_secret";
  const TIMEOUT_MS = 45000;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function getSecret() {
    try {
      const qp = new URLSearchParams(location.search).get("t");
      if (qp && /^[A-Za-z0-9]{16,64}$/.test(qp.trim())) {
        localStorage.setItem(LS_KEY, qp.trim());
        // scrub the secret out of the address bar / history
        const u = new URL(location.href);
        u.searchParams.delete("t");
        history.replaceState(null, "", u.toString());
      }
    } catch (e) { /* ignore */ }
    try { return localStorage.getItem(LS_KEY) || ""; } catch (e) { return ""; }
  }

  function setSecret(s) {
    s = String(s || "").trim();
    const m = s.match(/[?&]t=([A-Za-z0-9]{16,64})/);
    if (m) s = m[1];
    if (!/^[A-Za-z0-9]{16,64}$/.test(s)) {
      throw new Error("Invalid link — paste the complete private access link.");
    }
    localStorage.setItem(LS_KEY, s);
  }

  function hasSecret() { return !!getSecret(); }

  async function request(method, path, body) {
    const secret = getSecret();
    if (!secret) throw new Error("No private link configured — paste your private access link on the Connection tab.");
    const id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    const base = `${DB}/necxwa_relay/${secret}`;
    let putRes;
    try {
      putRes = await fetch(`${base}/req/${id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ v: 1, id, method, path, body: body === undefined ? null : body }),
      });
    } catch (e) {
      throw new Error("Relay unreachable — check your internet connection.");
    }
    if (!putRes.ok) throw new Error("Relay unreachable (HTTP " + putRes.status + ").");
    const t0 = Date.now();
    while (Date.now() - t0 < TIMEOUT_MS) {
      await sleep(1200);
      let j = null;
      try {
        const r = await fetch(`${base}/res/${id}.json`, { cache: "no-store" });
        if (r.ok) j = await r.json();
      } catch (e) { /* transient network blip — keep polling */ }
      if (j && j.id === id) {
        fetch(`${base}/res/${id}.json`, { method: "DELETE" }).catch(() => {});
        return { status: j.status, data: j.data };
      }
    }
    throw new Error("Backend timeout — no answer in 45s. The backend may be restarting; wait a bit and try again.");
  }

  async function ping() {
    return request("GET", "/api/health/ready");
  }

  window.NECXAWA_RELAY = { request, ping, getSecret, setSecret, hasSecret };
})();
