import api from "./api";

export const profileService = {
  createMyWorkerProfile: () => api.post("/worker-profiles/createMyProfile"),
  updateMyWorkerProfile: () => api.post("/worker-profiles/updateMyProfile"),
};