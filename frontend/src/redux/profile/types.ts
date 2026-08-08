import type { ApiError } from "../auth/types";

export type WorkerProfileData = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  taxNumber: string | null;
  rating: number | null;
  avatarUrl: string | null;
  // TODO: phone/city — поки не підтверджені бекендом (немає в Backend_TZ),
  // додано під форму CreateWorkerProfileModal. Прибрати "?" і коментар,
  // коли ендпоінт створення/отримання профілю воркера буде готовий і
  // підтвердить реальну форму даних.
  phone?: string;
  city?: string;
};

export type BusinessCompanyData = {
  id: number;
  // TODO: name/edrpou/legalAddress — форма підтверджена лише по CreateCompanyModal
  // (Frontend-стороні), самого ендпоінту створення компанії в Backend_TZ немає
  // (див. TODO в handleCreateCompany). Прибрати "?" і цей коментар, коли бекенд
  // підтвердить реальну форму Company.
  name?: string;
  edrpou?: string;
  legalAddress?: string;
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