import api from "../api/client";

export const authService = {
  register: (payload: unknown) => api.post("/auth/register", payload),
  login: (payload: unknown) => api.post("/auth/login", payload),
  refreshUser: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  requestPasswordReset: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  resendEmailVerification: () => api.post("/auth/resend-verification"),
  getMyProfile: () => api.get("/users/me/profile"),
};
