// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://epl-projet-api.onrender.com/api',

  timeout: 0, // ← TIMEOUT INFINI (plus jamais de timeout)
  headers: {
    'Content-Type': 'application/json',
  },
});
// ✅ CACHE GLOBAL (10 minutes)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// ✅ ROUTES AUTORISÉES AU CACHE
const CACHED_ROUTES = [
  "/api/inscription"
];

api.interceptors.request.use((config) => {
  // ✅ On ne met en cache QUE les GET
  if (config.method !== "get") return config;

  // ✅ On vérifie si l'URL fait partie des routes à cacher
  const shouldCache = CACHED_ROUTES.some(route =>
    config.url?.includes(route)
  );

  if (!shouldCache) return config; // ❌ Pas de cache ailleurs

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
});

// ✅ Sauvegarde uniquement pour les routes autorisées
api.interceptors.response.use((response) => {
  if (response.config.method === "get") {
    const shouldCache = CACHED_ROUTES.some(route =>
      response.config.url?.includes(route)
    );

    if (!shouldCache) return response;

    const key = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
    cache.set(key, {
      data: response.data,
      timestamp: Date.now(),
    });

    console.log("✅ Cache SAVED →", key);
  }

  return response;
});

// ✅ Invalidation du cache
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