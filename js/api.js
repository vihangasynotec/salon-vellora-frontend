/**
 * SALON VELLORA — API CLIENT
 * Centralized REST API communication with automatic Authorization token handling
 * Configured for production cloud API: https://api.salonvellora.com.lk/
 */

const DEFAULT_API_BASE_URL = "https://api.salonvellora.com.lk/api";

function resolveApiBaseUrl() {
  const storedUrl = typeof localStorage !== "undefined" ? localStorage.getItem("salon_api_url") : null;
  let url = (typeof window !== "undefined" && window.SALON_API_URL) || storedUrl || DEFAULT_API_BASE_URL;
  url = String(url).trim().replace(/\/+$/, "");

  // Prevent Mixed Content: If the current webpage is loaded via HTTPS, automatically upgrade HTTP to HTTPS
  if (typeof window !== "undefined" && window.location && window.location.protocol === "https:" && url.startsWith("http://") && !url.includes("127.0.0.1") && !url.includes("localhost")) {
    url = url.replace(/^http:\/\//, "https://");
  }

  // Ensure the route prefix '/api' is present for Laravel REST routes if not already in URL
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
}

const api = {
  getBaseUrl() {
    return resolveApiBaseUrl();
  },

  setBaseUrl(newUrl) {
    if (typeof localStorage === "undefined") return;
    if (newUrl) {
      localStorage.setItem("salon_api_url", newUrl);
    } else {
      localStorage.removeItem("salon_api_url");
    }
  },

  resetBaseUrl() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("salon_api_url");
    }
  },

  buildUrl(endpoint) {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      if (typeof window !== "undefined" && window.location && window.location.protocol === "https:" && endpoint.startsWith("http://") && !endpoint.includes("127.0.0.1") && !endpoint.includes("localhost")) {
        return endpoint.replace(/^http:\/\//, "https://");
      }
      return endpoint;
    }
    const base = resolveApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    // Prevent duplicate /api if endpoint already starts with /api
    if (cleanEndpoint.startsWith("/api/") && base.endsWith("/api")) {
      return `${base.slice(0, -4)}${cleanEndpoint}`;
    }

    return `${base}${cleanEndpoint}`;
  },

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
    const url = this.buildUrl(endpoint);
    
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
      console.error(`API Error [${endpoint}] -> [${url}]:`, err);
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
