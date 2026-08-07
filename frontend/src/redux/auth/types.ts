export type UserRole = "worker" | "business_client";

export interface AuthUser {
  id: number;
  email: string;
  displayName?: string;
  role: UserRole;
  avatar?: string | null;
  phone?: string;
  isVerified?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isRefreshing: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  status?: number;
  message: string;
}
