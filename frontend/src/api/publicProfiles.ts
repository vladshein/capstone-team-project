import api from "./client";
import type { Shift } from "./shifts";

export type PublicWorkerProfile = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  rating: number | string;
  avatarUrl: string | null;
  description: string | null;
  User?: { id: number; avatar: string | null; phone: string | null };
};

export type PublicCompanyProfile = {
  id: number;
  ownerId: number;
  name: string;
  description: string | null;
  avatar: string | null;
  rating: number;
  Owner?: { phone: string | null };
  Locations: Array<{ id: number; title: string; city: string; address: string }>;
};

type ApiResponse<T> = { data: T };

export type PublicCompanyOpenShiftsResponse = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: Shift[];
};

export async function getPublicWorkerProfile(userId: number) {
  const { data } = await api.get<ApiResponse<PublicWorkerProfile>>(`/worker-profiles/public/${userId}`);
  return data.data;
}

export async function getPublicCompanyProfile(companyId: number) {
  const { data } = await api.get<ApiResponse<PublicCompanyProfile>>(`/companies/public/${companyId}`);
  return data.data;
}

export async function getPublicCompanyProfiles(companyIds: number[]) {
  const { data } = await api.get<ApiResponse<PublicCompanyProfile[]>>("/companies/public", {
    params: { ids: companyIds.join(",") },
  });
  return data.data;
}

export async function getPublicCompanyOpenShifts(companyId: number, page = 1) {
  const { data } = await api.get<ApiResponse<PublicCompanyOpenShiftsResponse>>(
    `/companies/public/${companyId}/shifts`,
    { params: { page, limit: 6 } },
  );
  return data.data;
}
