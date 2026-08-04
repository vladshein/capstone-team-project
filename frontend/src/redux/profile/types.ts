import type { ApiError } from "../auth/types";

export type WorkerProfileData = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  taxNumber: string | null;
  rating: number | null;
  avatarUrl: string | null;
};

export type BusinessCompanyData = {
  id: number;
  name: string;
  edrpou: string;
  legalAddress: string | null;
  avatar: string | null;
};

interface BaseProfileResponse {
  id: number;
  email: string;
  phone: string;
  avatar: string | null;
  isVerified: boolean;
  created_at: string;
  profileCompleted: boolean;
}

export interface WorkerProfileResponse extends BaseProfileResponse {
  role: "worker";
  WorkerProfile: WorkerProfileData | null;
}

export interface BusinessProfileResponse extends BaseProfileResponse {
  role: "business_client";
  companies: BusinessCompanyData[];
}

export type MyProfileResponse = WorkerProfileResponse | BusinessProfileResponse;

export interface WorkerProfileState {
  data: WorkerProfileResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface BusinessProfileState {
  data: BusinessProfileResponse | null;
  isLoading: boolean;
  error: string | null;
}

export type { ApiError };