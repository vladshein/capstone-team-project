import api from "./api";

export const profileService = {
  getMyProfile: () => api.get("/users/me/profile"),
};