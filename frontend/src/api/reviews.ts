import api from "./client";

export interface ReceivedReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  Shift: {
    id: number;
    startTime: string;
    JobPosition?: { title: string };
    Location?: { Company?: { name: string; avatar: string | null } };
  };
  Reviewer?: {
    id: number;
    avatar: string | null;
    WorkerProfile?: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
}

export interface ReviewsPage {
  data: ReceivedReview[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  averageRating: number;
}

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

export async function getReceivedReviews(
  revieweeId: number,
  page = 1,
  limit = 5,
  companyId?: number,
): Promise<ReviewsPage> {
  const { data } = await api.get<ReviewsPage>(`/reviews/${revieweeId}`, {
    params: { page, limit, companyId },
  });
  return data;
}
