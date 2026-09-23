/* NecxaWA config - backend connection stored locally in the browser.
   Tip: console.html?api=https://xxx&key=yyy pre-fills the URL + key. */
(function () {
  const DEFAULT_BASE = "http://localhost:2785";
  // ?api= / ?key= query params pre-fill + save the connection (one-tap setup links)
  try {
    const qp = new URLSearchParams(location.search);
    const q = qp.get("api");
    if (q && /^https?:\/\//i.test(q)) {
      localStorage.setItem("necxawa_api_base", q.replace(/\/+$/, ""));
    }
    const k = qp.get("key");
    if (k && k.trim().length >= 8) {
      localStorage.setItem("necxawa_api_key", k.trim());
    }
  } catch (e) {}
  window.NECXAWA = {
    getApiBase() {
      return (localStorage.getItem("necxawa_api_base") || DEFAULT_BASE).replace(/\/+$/, "");
    },
    getApiKey() {
      return localStorage.getItem("necxawa_api_key") || "";
    },
    save(base, key) {
      localStorage.setItem("necxawa_api_base", (base || DEFAULT_BASE).replace(/\/+$/, ""));
      localStorage.setItem("necxawa_api_key", key || "");
    },
    getSessionId() {
      return localStorage.getItem("necxawa_session_id") || "";
    },
    setSessionId(id) {
      if (id) localStorage.setItem("necxawa_session_id", id);
      else localStorage.removeItem("necxawa_session_id");
    }
  };
})();
