import api from "./client";

export async function createReview(
  shiftId: number,
  payload: { rating: number; comment?: string },
): Promise<void> {
  await api.post(`/reviews/${shiftId}`, payload);
}
