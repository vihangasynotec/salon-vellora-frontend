/**
 * SALON VELLORA — AUTHENTICATION SYSTEM
 * Token management, route guard, login/logout workflows
 */

const auth = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem("salon_user")) || null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem("salon_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("salon_user");
    }
  },

  isAuthenticated() {
    return !!api.getToken() && !!this.getUser();
  },

  async login(email, password) {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.success && res.data.token) {
        api.setToken(res.data.token);
        this.setUser(res.data.user);
        return res;
      }
      throw new Error(res.message || "Invalid login credentials.");
    } catch (err) {
      throw err;
    }
  },

  async logout() {
    try {
      if (api.getToken()) {
        await api.post("/auth/logout").catch(() => {});
      }
    } finally {
      api.setToken(null);
      this.setUser(null);
      window.location.href = "login.html";
    }
  },

  async refreshProfile() {
    try {
      const res = await api.get("/auth/me");
      if (res.success && res.data) {
        this.setUser(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn("Could not refresh user profile:", err);
    }
    return null;
  },

  requireAuth() {
    const isPublicPage = window.location.pathname.endsWith("login.html") ||
                         window.location.pathname.endsWith("index.html") ||
                         window.location.pathname.endsWith("catalog.html");

    if (!isPublicPage && !this.isAuthenticated()) {
      window.location.href = "login.html";
    }

    if (window.location.pathname.endsWith("login.html") && this.isAuthenticated()) {
      window.location.href = "dashboard.html";
    }
  }
};

window.auth = auth;

// Auto-check authentication on page load
document.addEventListener("DOMContentLoaded", () => {
  auth.requireAuth();
});
