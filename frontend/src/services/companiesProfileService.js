import api from "../api/client";

export const profileService = {
  getCompanyProfileById: (id) => api.get(`/companies/${id}`),
  getMyCompanies: () => api.get("/companies/my"),
  createCompanyProfile: (data) => api.post("/companies", data),
  updateCompanyProfile: (id, data) => api.patch(`/companies/${id}`, data),
  deleteCompanyProfile: (id) => api.delete(`/companies/${id}`),
};