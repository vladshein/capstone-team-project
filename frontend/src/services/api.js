import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let store;

export const injectStore = (_store) => {
  store = _store;
};

api.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    } else {
      delete config.headers["Content-Type"];
    }

    if (store) {
      const token = store.getState().auth.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - auto logout
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (store) {
        // Import dynamically to avoid circular dependency
        const { clearAuth } = await import("../redux/auth/slice");
        store.dispatch(clearAuth());
      }
    }

    if (!error.response) {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
