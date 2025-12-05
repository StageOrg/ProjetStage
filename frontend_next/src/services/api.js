// src/services/api.js → VERSION FINALE STABLE (2025)
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 0,
  headers: {
    "Content-Type": "application/json",
  },
});


let sessionActive = false;

api.interceptors.request.use((config) => {
  // Si on a un token JWT, on l'envoie 
  const token = localStorage.getItem("access_token");
  if (token && !sessionActive) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const hasSession = document.cookie.includes("sessionid");
  if (hasSession) {
    sessionActive = true;
    delete config.headers.Authorization; 
  }

  if (config.method !== "get") return config;

  const key = `${config.url}${JSON.stringify(config.params || {})}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    config.adapter = () => Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: "OK (cached)",
      headers: config.headers,
      config,
      request: {},
    });
    console.log("Cache HIT →", key);
    return config;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Sauvegarde en cache
    if (response.config.method === "get") {
      const key = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(key, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  (error) => {
    // Si 401 → déconnexion propre
    if (error.response?.status === 401) {
      localStorage.clear();
      sessionActive = false;
      alert("Session expirée. Veuillez vous reconnecter.");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Cache 
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

api.invalidateCache = (urlPart = "") => {
  if (!urlPart) {
    cache.clear();
    console.log("Cache vidé entièrement");
  } else {
    let count = 0;
    for (const key of cache.keys()) {
      if (key.includes(urlPart)) {
        cache.delete(key);
        count++;
      }
    }
    console.log(`Cache invalidé pour "${urlPart}" → ${count} entrées supprimées`);
  }
};

// Fonction  forcer la session Django (après login)
api.enableSessionMode = () => {
  sessionActive = true;
  delete api.defaults.headers.common.Authorization;
};

export default api;