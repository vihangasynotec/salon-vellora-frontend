/**
 * SALON VELLORA — API CLIENT
 * Centralized REST API communication with automatic Authorization token handling
 */

const API_BASE_URL = window.SALON_API_URL || "http://127.0.0.1:8000/api";

const api = {
  getToken() {
    return localStorage.getItem("salon_token");
  },

  setToken(token) {
    if (token) {
      localStorage.setItem("salon_token", token);
    } else {
      localStorage.removeItem("salon_token");
    }
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        localStorage.removeItem("salon_user");
        if (!window.location.pathname.endsWith("login.html") && !window.location.pathname.endsWith("index.html") && !window.location.pathname.endsWith("catalog.html")) {
          window.location.href = "login.html";
        }
        throw new Error(data?.message || "Session expired. Please log in again.");
      }

      if (!response.ok) {
        const error = new Error(data?.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        error.errors = data?.errors || {};
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(fullUrl, { method: "GET" });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
};

window.api = api;
window.API = api;
