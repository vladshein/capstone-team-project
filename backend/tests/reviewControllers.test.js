import { jest } from "@jest/globals";

const createReview = jest.fn();
const updateReview = jest.fn();
const deleteReview = jest.fn();
const getReviewsByShiftId = jest.fn();
const getReviewsByRevieweeId = jest.fn();

jest.unstable_mockModule("../services/reviewServices.js", () => ({
  createReview,
  updateReview,
  deleteReview,
  getReviewsByShiftId,
  getReviewsByRevieweeId,
}));

const controller = await import("../controllers/reviewControllers.js");

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("review controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a review from the authenticated author, validated shift ID and request body", async () => {
    const review = { id: "review-uuid", rating: 5, comment: "Дякую" };
    createReview.mockResolvedValue(review);
    const res = createResponse();

    await controller.createReview(
      {
        user: { id: 4 },
        validatedParams: { shiftId: 8 },
        body: { rating: 5, comment: "Дякую" },
      },
      res,
      jest.fn(),
    );

    expect(createReview).toHaveBeenCalledWith({
      userId: 4,
      shiftId: 8,
      rating: 5,
      comment: "Дякую",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Відгук успішно створено",
      data: review,
    });
  });

  test("preserves a UUID review ID when updating a review", async () => {
    const reviewId = "bc6b9c25-f254-4bb1-80ea-88c5b0a6bf18";
    const body = { rating: 4, comment: "Оновлений відгук" };
    const updated = { id: reviewId, ...body };
    updateReview.mockResolvedValue(updated);
    const res = createResponse();

    await controller.updateReview(
      { user: { id: 4 }, validatedParams: { reviewId }, body },
      res,
      jest.fn(),
    );

    expect(updateReview).toHaveBeenCalledWith(reviewId, 4, body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Відгук успішно оновлено",
      data: updated,
    });
  });

  test("forwards review mutation errors to error middleware", async () => {
    const error = new Error("Ви не можете редагувати цей відгук");
    const next = jest.fn();
    updateReview.mockRejectedValue(error);

    await controller.updateReview(
      { user: { id: 4 }, validatedParams: { reviewId: "review-uuid" }, body: {} },
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
  });

  test("deletes a review using its UUID and the authenticated author", async () => {
    const res = createResponse();

    await controller.deleteReview(
      { user: { id: 4 }, validatedParams: { reviewId: "review-uuid" } },
      res,
      jest.fn(),
    );

    expect(deleteReview).toHaveBeenCalledWith("review-uuid", 4);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Відгук успішно видалено" });
  });

  test("gets reviews for a validated shift", async () => {
    const reviews = [{ id: "r1" }];
    getReviewsByShiftId.mockResolvedValue(reviews);
    const res = createResponse();

    await controller.getReviewsByShiftId(
      { validatedParams: { shiftId: 8 } },
      res,
      jest.fn(),
    );

    expect(getReviewsByShiftId).toHaveBeenCalledWith(8);
    expect(res.json).toHaveBeenCalledWith({
      message: "Відгуки успішно отримано",
      data: reviews,
    });
  });

  test("normalizes review pagination and an optional positive company ID", async () => {
    const result = { data: [{ id: "r1" }], totalPages: 2, totalItems: 6 };
    getReviewsByRevieweeId.mockResolvedValue(result);
    const res = createResponse();

    await controller.getReviewsByRevieweeId(
      {
        validatedParams: { revieweeId: 4 },
        query: { page: "0", limit: "999", companyId: "12" },
      },
      res,
      jest.fn(),
    );

    expect(getReviewsByRevieweeId).toHaveBeenCalledWith(4, {
      page: 1,
      limit: 20,
      companyId: 12,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Відгуки успішно отримано",
      ...result,
    });
  });

  test("drops invalid company IDs and applies default pagination", async () => {
    getReviewsByRevieweeId.mockResolvedValue({ data: [], totalPages: 0, totalItems: 0 });

    await controller.getReviewsByRevieweeId(
      {
        validatedParams: { revieweeId: 4 },
        query: { page: "not-a-page", limit: "0", companyId: "-2" },
      },
      createResponse(),
      jest.fn(),
    );

    expect(getReviewsByRevieweeId).toHaveBeenCalledWith(4, {
      page: 1,
      limit: 5,
      companyId: undefined,
    });
  });
});
