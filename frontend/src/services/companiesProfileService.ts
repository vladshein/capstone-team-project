import api from "../api/client";
import type { CompanyProfile, CreateCompanyPayload, UpdateCompanyPayload } from "../redux/companies-profile/types";

interface ApiResponse<T> {
  message: string;
  data: T;
}

export const companiesProfileService = {
  fetchMyCompanies: () => api.get<ApiResponse<CompanyProfile[]>>("/companies/my"),
  getCompanyById: (id: number) => api.get<ApiResponse<CompanyProfile>>(`/companies/${id}`),
  createCompanyProfile: (payload: CreateCompanyPayload) => api.post<ApiResponse<CompanyProfile>>("/companies", payload),
  updateCompanyProfile: (id: number, payload: UpdateCompanyPayload) => api.patch<ApiResponse<CompanyProfile>>(`/companies/${id}`, payload),
  deleteCompanyProfile: (id: number) => api.delete<ApiResponse<{ success: boolean }>>(`/companies/${id}`),
};