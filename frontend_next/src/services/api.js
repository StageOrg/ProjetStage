// src/services/api.js
import axios from "axios";

const api = axios.create({
  //baseURL: 'http://127.0.0.1:8000/api', 
  //baseURL: 'http://172.20.1.22/api', 
  //baseURL: 'https://epl.univ-lome.tg/api',
  baseURL: "/api/",

  timeout: 0, // ✅ Pas de timeout  
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});

// ✅ CACHE GLOBAL (10 minutes)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

const CACHED_ROUTES = ["/api/inscription"];

api.interceptors.response.use((response) => {
  if (response.config.method === "get") {
    const shouldCache = CACHED_ROUTES.some(route =>
      response.config.url?.includes(route)
    );

    if (shouldCache) {
      const key = response.config.url;
      cache.set(key, {
        data: response.data,
        timestamp: Date.now(),
      });
    }
  }
  return response;
});


export default api;
