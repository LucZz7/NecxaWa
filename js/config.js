/* NecxaWA config - backend connection stored locally in the browser */
(function () {
  const DEFAULT_BASE = "http://localhost:2785";
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
