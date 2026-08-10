import api from "../api/client";

// Сервісний шар для auth Redux-thunks.
export const authService = {
  register: (payload: unknown) => api.post("/auth/register", payload),
  login: (payload: unknown) => api.post("/auth/login", payload),
  refreshUser: () => api.get("/auth/refresh"),
  logout: () => api.get("/auth/logout"),
  getMyProfile: () => api.get("/users/me/profile"),
};
