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

export interface MyProfileData {
  hasWorkerProfile?: boolean;
  companiesCount?: number;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isRefreshing: boolean;
  isLoading: boolean;
  error: string | null;
  // --- bootstrap GET /users/me/profile, окремий lifecycle ---
  hasWorkerProfile: boolean | null; // null = ще не запитували
  companiesCount: number;
  isProfileLoading: boolean;
  profileError: string | null;
}