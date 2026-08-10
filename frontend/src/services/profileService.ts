import api from "../api/client.ts";

export const profileService = {
  getMyProfile: () => api.get("/users/me/profile"),
  createMyWorkerProfile: () => api.post("/worker-profiles/createMyProfile"),
  updateMyWorkerProfile: () => api.post("/worker-profiles/updateMyProfile"),
};
