import { jest } from "@jest/globals";

const findUserByPk = jest.fn();
const findShift = jest.fn();
const findReview = jest.fn();
const findReviewByPk = jest.fn();
const createReviewRecord = jest.fn();
const findWorkerProfile = jest.fn();
const reviewTransaction = jest.fn();
const aggregateFunction = jest.fn((name, column) => `${name}(${column})`);
const column = jest.fn((name) => name);

const transaction = { id: "review-transaction" };

jest.unstable_mockModule("../db/models/index.js", () => ({
  Review: {
    findOne: findReview,
    findByPk: findReviewByPk,
    create: createReviewRecord,
    sequelize: {
      transaction: reviewTransaction,
      fn: aggregateFunction,
      col: column,
    },
  },
  Shift: { findOne: findShift },
  User: { findByPk: findUserByPk },
  WorkerProfile: { findOne: findWorkerProfile },
  JobPosition: {},
  Company: {},
  Location: {},
  ShiftApplication: {},
}));

const { createReview, updateReview } =
  await import("../services/reviewServices.js");

const completedShift = ({ workerId = 42, ownerId = 7 } = {}) => ({
  status: "completed",
  Location: { Company: { ownerId } },
  ShiftApplications: [{ workerId, status: "completed" }],
});

describe("review lifecycle and permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reviewTransaction.mockImplementation(async (callback) => callback(transaction));
  });

  test("allows a company owner to review the completed shift worker and recalculates the rating", async () => {
    const profile = { update: jest.fn().mockResolvedValue(undefined) };
    const review = { id: "review-1" };
    findUserByPk.mockResolvedValue({ id: 7, role: "business_client" });
    findShift.mockResolvedValue(completedShift());
    findReview
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ averageRating: "4.25" });
    createReviewRecord.mockResolvedValue(review);
    findWorkerProfile.mockResolvedValue(profile);

    await expect(
      createReview({
        userId: 7,
        shiftId: 15,
        rating: 4,
        comment: "Відповідальний виконавець",
      }),
    ).resolves.toBe(review);

    expect(createReviewRecord).toHaveBeenCalledWith(
      {
        reviewerId: 7,
        revieweeId: 42,
        shiftId: 15,
        rating: 4,
        comment: "Відповідальний виконавець",
      },
      { transaction },
    );
    expect(profile.update).toHaveBeenCalledWith({ rating: 4.25 }, { transaction });
  });

  test("allows the selected worker to review the company owner", async () => {
    const review = { id: "review-2" };
    findUserByPk.mockResolvedValue({ id: 42, role: "worker" });
    findShift.mockResolvedValue(completedShift());
    findReview.mockResolvedValueOnce(null);
    createReviewRecord.mockResolvedValue(review);
    findWorkerProfile.mockResolvedValue(null);

    await expect(
      createReview({ userId: 42, shiftId: 15, rating: 5, comment: "Все добре" }),
    ).resolves.toBe(review);

    expect(createReviewRecord).toHaveBeenCalledWith(
      expect.objectContaining({ reviewerId: 42, revieweeId: 7 }),
      { transaction },
    );
  });

  test("does not allow a second review from the same participant for one shift", async () => {
    findUserByPk.mockResolvedValue({ id: 7, role: "business_client" });
    findShift.mockResolvedValue(completedShift());
    findReview.mockResolvedValue({ id: "existing-review" });

    await expect(
      createReview({ userId: 7, shiftId: 15, rating: 5, comment: "Повтор" }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Ви вже залишили відгук для цієї зміни.",
    });

    expect(createReviewRecord).not.toHaveBeenCalled();
  });

  test("does not allow reviews before the shift is completed", async () => {
    findUserByPk.mockResolvedValue({ id: 7, role: "business_client" });
    findShift.mockResolvedValue({ ...completedShift(), status: "booked" });

    await expect(
      createReview({ userId: 7, shiftId: 15, rating: 5, comment: "Завчасно" }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Ви можете створити відгук лише для завершеної зміни.",
    });

    expect(createReviewRecord).not.toHaveBeenCalled();
  });

  test("allows only the review author to update it and refreshes the worker rating", async () => {
    const profile = { update: jest.fn().mockResolvedValue(undefined) };
    const review = {
      reviewerId: 7,
      revieweeId: 42,
      update: jest.fn().mockResolvedValue({ id: "review-1", rating: 5 }),
    };
    findReviewByPk.mockResolvedValue(review);
    findWorkerProfile.mockResolvedValue(profile);
    findReview.mockResolvedValue({ averageRating: "4.5" });

    await expect(updateReview("review-1", 7, { rating: 5 })).resolves.toEqual({
      id: "review-1",
      rating: 5,
    });

    expect(review.update).toHaveBeenCalledWith({ rating: 5 }, { transaction });
    expect(profile.update).toHaveBeenCalledWith({ rating: 4.5 }, { transaction });
  });

  test("does not allow another user to edit a review", async () => {
    const review = {
      reviewerId: 7,
      revieweeId: 42,
      update: jest.fn(),
    };
    findReviewByPk.mockResolvedValue(review);

    await expect(updateReview("review-1", 8, { rating: 1 })).rejects.toMatchObject({
      status: 403,
      message: "Ви не маєте права редагувати цей відгук.",
    });

    expect(review.update).not.toHaveBeenCalled();
  });
});
