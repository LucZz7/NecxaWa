/* NecxaWA config - backend connection stored locally in the browser.
   Tip: console.html?api=https://xxx-2785.app.github.dev pre-fills the URL. */
(function () {
  const DEFAULT_BASE = "http://localhost:2785";
  // ?api= query param (e.g. from the 1-click cloud backend link) pre-fills + saves the URL
  try {
    const q = new URLSearchParams(location.search).get("api");
    if (q && /^https?:\/\//i.test(q)) {
      localStorage.setItem("necxawa_api_base", q.replace(/\/+$/, ""));
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
