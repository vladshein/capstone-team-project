import api from "../api/client";

export const workerProfileService = {
  getMyProfile: () => api.get("/worker-profiles/me"),
  createProfile: (data) => api.post("/worker-profiles", data),
  updateProfile: (data) => api.patch("/worker-profiles/me", data),
};