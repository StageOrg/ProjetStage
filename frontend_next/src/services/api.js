// src/services/api.js
import axios from "axios";

const api = axios.create({
  //baseURL: "https://epl-projet-api.onrender.com/api",
  baseURL: "localhost:8000/api",
  timeout: 0, // ✅ Pas de timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ CACHE GLOBAL (10 minutes)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

// ✅ ROUTES AUTORISÉES AU CACHE
const CACHED_ROUTES = [
  "/api/inscription",
];

// ============================================
// ✅ INTERCEPTEUR REQUEST : TOKEN + CACHE
// ============================================
api.interceptors.request.use(
  (config) => {
    // ✅ PROTECTION LOCALSTORAGE (IMPORTANT POUR NEXT.JS)
    let token = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("access_token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ On ne met en cache QUE les GET
    if (config.method !== "get") return config;

    // ✅ Vérifier si la route est autorisée au cache
    const shouldCache = CACHED_ROUTES.some((route) =>
      config.url?.includes(route)
    );
    if (!shouldCache) return config;

    const key = `${config.url}${JSON.stringify(config.params || {})}`;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      config.adapter = () =>
        Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: "OK (cached)",
          headers: config.headers,
          config,
          request: {},
        });

      console.log("✅ Cache HIT →", key);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// ✅ INTERCEPTEUR RESPONSE : CACHE + REFRESH TOKEN
// ============================================
api.interceptors.response.use(
  (response) => {
    // ✅ Sauvegarde uniquement pour les routes autorisées
    if (response.config.method === "get") {
      const shouldCache = CACHED_ROUTES.some((route) =>
        response.config.url?.includes(route)
      );

      if (shouldCache) {
        const key = `${response.config.url}${JSON.stringify(
          response.config.params || {}
        )}`;

        cache.set(key, {
          data: response.data,
          timestamp: Date.now(),
        });

        console.log("✅ Cache SAVED →", key);
      }
    }

    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // ✅ GESTION DU TOKEN EXPIRÉ (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // ✅ PROTECTION LOCALSTORAGE
        let refreshToken = null;
        if (typeof window !== "undefined") {
          refreshToken = localStorage.getItem("refresh_token");
        }

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // ✅ Tentative de refresh
        const { data } = await axios.post(
          "https://epl-projet-api.onrender.com/api/token/refresh/",
          { refresh: refreshToken }
        );

        // ✅ Sauvegarde du nouveau token
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", data.access);
        }

        // ✅ Réessayer la requête originale
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Refresh token échoué");

        // ✅ LOGOUT PROPRE
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// ✅ INVALIDATION DU CACHE
// ============================================
api.invalidateCache = (urlPart = "") => {
  if (!urlPart) {
    cache.clear();
    console.log("🧹 Cache vidé entièrement");
  } else {
    let count = 0;
    for (const key of cache.keys()) {
      if (key.includes(urlPart)) {
        cache.delete(key);
        count++;
      }
    }
    console.log(`🧹 Cache invalidé pour "${urlPart}" → ${count} entrées supprimées`);
  }
};

export default api;
