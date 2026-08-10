import axios from "axios";

type AppStore = {
  getState: () => { auth: { token: string | null } };
  dispatch: (action: unknown) => unknown;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  timeout: 10_000,
});

let store: AppStore | null = null;

export const injectStore = (nextStore: AppStore) => {
  store = nextStore;
};

api.interceptors.request.use((config) => {
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  } else {
    delete config.headers["Content-Type"];
  }

  const token = store?.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (store) {
        const { clearAuth } = await import("../redux/auth/slice");
        store.dispatch(clearAuth());
      }
    }

    if (!error.response) console.error("Network error:", error.message);

    return Promise.reject(
      Object.assign(
        new Error(error.response?.data?.message ?? "Сталася помилка. Спробуйте ще раз."),
        { response: error.response },
      ),
    );
  },
);

export default api;
