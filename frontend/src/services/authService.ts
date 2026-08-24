import api from "../api/client";

export const authService = {
  register: (payload: unknown) => api.post("/auth/register", payload),
  login: (payload: unknown) => api.post("/auth/login", payload),
  refreshUser: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  resendEmailVerification: () => api.post("/auth/resend-verification"),
  getMyProfile: () => api.get("/users/me/profile"),
};
