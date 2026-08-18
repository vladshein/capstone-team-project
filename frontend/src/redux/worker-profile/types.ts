import type { ApiError } from "../types";

export interface WorkerProfileUser {
  phone: string;
  email: string;
  isVerified: boolean;
}

export interface WorkerProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  birthDate: string; // DATEONLY з бекенду прилітає як "YYYY-MM-DD"
  taxNumber: string | null;
  rating: number;
  avatarUrl: string | null;
  description: string | null;
  User?: WorkerProfileUser;
}

export type CreateWorkerProfilePayload = Omit<
  WorkerProfile,
  "id" | "userId" | "rating" | "User" | "avatarUrl" | "description"
> & {
  avatarUrl?: string;
  description?: string;
};

export type UpdateWorkerProfilePayload = Partial<CreateWorkerProfilePayload>;

export interface WorkerProfileState {
  data: WorkerProfile | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: ApiError | null;
}
