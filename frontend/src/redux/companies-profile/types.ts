import { ApiError } from "../types";

export interface Location {
  id: number;
  title: string;
  city: string;
  address: string;
}

export interface CompanyProfile {
  id: number;
  name: string;
  edrpou: string;
  legalAddress: string;
  avatar: string | null;
  Locations?: Location[];
}

export type CreateCompanyPayload = Omit<CompanyProfile, "id" | "avatar" | "Locations">;
export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export interface CompaniesProfileState {
  items: CompanyProfile[];          // GET /companies/my — список компаній бізнес-клієнта
  selected: CompanyProfile | null;  // GET /companies/:id — публічна картка (гість/робітник)
  status: "idle" | "loading" | "succeeded" | "failed";
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  error: ApiError | null;
  mutationError: ApiError | null;
}
