import { ApiError } from "./types";

export const toApiError = (error: unknown): ApiError => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as {
      response?: { status?: number; data?: { message?: string } };
    }).response;

    return {
      status: response?.status,
      message: response?.data?.message ?? "Сталася помилка. Спробуйте ще раз.",
    };
  }

  return {
    message: error instanceof Error ? error.message : "Сталася помилка.",
  };
};