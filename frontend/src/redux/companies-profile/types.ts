import { ApiError } from "../types";

export interface Location {
  id: number;
  ownerId?: number;
  companyId: number;
  title: string;
  city: string;
  address: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface CreateCompanyLocationPayload {
  title: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CompanyProfile {
  id: number;
  name: string;
  edrpou: string;
  legalAddress: string;
  description: string | null;
  avatar: string | null;
  Locations?: Location[];
}

export type CreateCompanyPayload = Omit<CompanyProfile, "id" | "ownerId" | "avatar" | "Locations">;
export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export interface CompaniesProfileState {
  items: CompanyProfile[];          // GET /companies/my — список компаній бізнес-клієнта
  selected: CompanyProfile | null;  // GET /companies/:id — публічна картка (гість/робітник)
  status: "idle" | "loading" | "succeeded" | "failed";
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  error: ApiError | null;
  mutationError: ApiError | null;
}
