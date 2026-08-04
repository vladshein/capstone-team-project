import axios from "axios";
import { store } from "../redux/store";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // За потреби: window.location.href = "/login";
    }
    const message =
      error.response?.data?.message ?? "Сталася помилка. Спробуйте ще раз.";
    return Promise.reject(new Error(message));
  },
);

export default api;