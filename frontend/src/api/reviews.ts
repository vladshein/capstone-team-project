import api from "./client";

export async function createReview(
  shiftId: number,
  payload: { rating: number; comment?: string },
): Promise<void> {
  await api.post(`/reviews/${shiftId}`, payload);
}

export async function updateReview(
  reviewId: string,
  payload: { rating: number; comment?: string },
): Promise<void> {
  await api.patch(`/reviews/${reviewId}`, payload);
}
