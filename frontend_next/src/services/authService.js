"use client";
import api from "./api"; 

const TokenStorage = {
  getAccess: () => localStorage.getItem("access"),
  getRefresh: () => localStorage.getItem("refresh"),
  setTokens: ({ access, refresh }) => {
    if (access) localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
  },
  clear: () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  },
};

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.request.use((config) => {
  const token = TokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = TokenStorage.getRefresh();
      if (!refreshToken) {
        TokenStorage.clear();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const res = await api.post("token/refresh/", { refresh: refreshToken });
        const newAccess = res.data.access;
        TokenStorage.setTokens({ access: newAccess });
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        TokenStorage.clear();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username, password) => {
    // ici on envoie les bons noms de champs
    const res = await api.post("auth/login/", { username, password });
    const { access, refresh, user } = res.data;
    TokenStorage.setTokens({ access, refresh });
    return { access, refresh, user };
  },

  register: async (userPayload) => {
    const res = await api.post("auth/register/", userPayload);
    return res.data;
  },

  refresh: async () => {
    const refresh = TokenStorage.getRefresh();
    if (!refresh) throw new Error("Pas de refresh token");
    const res = await api.post("token/refresh/", { refresh });
    const { access } = res.data;
    TokenStorage.setTokens({ access });
    return res.data;
  },

  logout: async (callBackendInvalidate = false) => {
    const refresh = TokenStorage.getRefresh();
    TokenStorage.clear();
    if (callBackendInvalidate && refresh) {
      try {
        await api.post("auth/logout/", { refresh });
      } catch (e) {}
    }
  },

  getProfile: async () => {
    const res = await api.get("utilisateurs/me/");
    return res.data;
  },

  apiInstance: () => api,
};

export default authAPI;
