const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export interface AuthUser {
  id: number;
  email: string;
  role: "worker" | "business";
  displayName: string;
  avatarUrl?: string | null;
  balance: number;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.message ?? "Сталася помилка. Спробуйте ще раз.";
  } catch {
    return "Сталася помилка. Спробуйте ще раз.";
  }
}

export async function loginRequest(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }

  return res.json();
}

export async function registerRequest(payload: {
  role: "worker" | "business";
  email: string;
  phone: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }

  return res.json();
}