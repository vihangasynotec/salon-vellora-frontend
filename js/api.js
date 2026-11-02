/**
 * SALON VELLORA — API CLIENT (Powered by Axios via CDN)
 * Centralized REST API communication with automatic Authorization token handling
 * Base API Route: https://api.salonvellora.com.lk/
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

// Fallback loader in case Axios CDN script hasn't completed loading yet
function ensureAxios() {
  if (typeof axios !== "undefined") {
    return Promise.resolve(axios);
  }
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      return reject(new Error("Axios is not available in non-browser environment."));
    }
    const existingScript = document.querySelector('script[src*="axios"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.axios));
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Axios CDN.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js";
    script.onload = () => resolve(window.axios);
    script.onerror = () => reject(new Error("Failed to load Axios CDN. Please check your internet connection."));
    document.head.appendChild(script);
  });
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
    return typeof localStorage !== "undefined" ? localStorage.getItem("salon_token") : null;
  },

  setToken(token) {
    if (typeof localStorage === "undefined") return;
    if (token) {
      localStorage.setItem("salon_token", token);
    } else {
      localStorage.removeItem("salon_token");
    }
  },

  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const client = typeof axios !== "undefined" ? axios : await ensureAxios();

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Support both data and body for request payload
    let payload = options.data !== undefined ? options.data : options.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        // Keep string if not valid JSON
      }
    }

    const config = {
      url,
      method: (options.method || "GET").toUpperCase(),
      headers,
      data: payload,
      params: options.params || null,
      timeout: options.timeout || 30000
    };

    try {
      const response = await client(config);
      return response.data;
    } catch (err) {
      console.error(`API Error [${endpoint}] -> [${url}]:`, err);

      if (err.response) {
        const status = err.response.status;
        const responseData = err.response.data;

        if (status === 401) {
          this.setToken(null);
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem("salon_user");
          }
          if (typeof window !== "undefined" && window.location) {
            const p = window.location.pathname;
            if (!p.endsWith("login.html") && !p.endsWith("index.html") && !p.endsWith("catalog.html")) {
              window.location.href = "login.html";
            }
          }
        }

        const message = responseData?.message || `Request failed with status ${status}`;
        const customError = new Error(message);
        customError.status = status;
        customError.data = responseData;
        customError.errors = responseData?.errors || {};
        customError.response = err.response;
        throw customError;
      }

      // Network / CORS / Timeout error
      let netMsg = err.message || "Network Error";
      if (netMsg === "Network Error") {
        netMsg = `Unable to connect to backend server (${resolveApiBaseUrl()}). Please ensure the server is online and CORS is configured.`;
      }
      const networkError = new Error(netMsg);
      networkError.status = 0;
      networkError.originalError = err;
      throw networkError;
    }
  },

  get(endpoint, params = {}) {
    return this.request(endpoint, {
      method: "GET",
      params
    });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: "POST",
      data: body
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: "PUT",
      data: body
    });
  },

  delete(endpoint, params = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      params
    });
  }
};

window.api = api;
window.API = api;
