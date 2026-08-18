import api from "./client";

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
  Owner?: { phone: string | null };
  Locations: Array<{ id: number; title: string; city: string; address: string }>;
};

type ApiResponse<T> = { data: T };

export async function getPublicWorkerProfile(userId: number) {
  const { data } = await api.get<ApiResponse<PublicWorkerProfile>>(`/worker-profiles/public/${userId}`);
  return data.data;
}

export async function getPublicCompanyProfile(companyId: number) {
  const { data } = await api.get<ApiResponse<PublicCompanyProfile>>(`/companies/public/${companyId}`);
  return data.data;
}
