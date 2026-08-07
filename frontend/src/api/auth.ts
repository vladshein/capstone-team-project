// import api from "./axiosInstance";

// export interface AuthUser {
//   id: number;
//   email: string;
//   role: "worker" | "business_client";
//   displayName: string;
//   avatarUrl?: string | null;
// }

// interface AuthResponse {
//   user: AuthUser;
//   accessToken: string;
// }

// export async function loginRequest(payload: {
//   email: string;
//   password: string;
// }): Promise<AuthResponse> {
//   const { data } = await api.post<AuthResponse>("/auth/login", payload);
//   return data;
// }

// export async function registerRequest(payload: {
//   role: "worker" | "business_client";
//   email: string;
//   phone: string;
//   password: string;
// }): Promise<AuthResponse> {
//   const { data } = await api.post<AuthResponse>("/auth/register", payload);
//   return data;
// }