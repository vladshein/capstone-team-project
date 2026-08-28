import { jest } from "@jest/globals";

const findReviewByPk = jest.fn();
const findReviewsByShift = jest.fn();
const findAndCountReviews = jest.fn();
const findReviewAggregate = jest.fn();
const findWorkerProfile = jest.fn();
const reviewTransaction = jest.fn();
const aggregateFunction = jest.fn((name, column) => `${name}(${column})`);
const column = jest.fn((name) => name);

const transaction = { id: "review-read-delete-transaction" };

const Shift = {};
const JobPosition = {};
const Company = {};
const Location = {};
const User = {};
const WorkerProfile = { findOne: findWorkerProfile };

jest.unstable_mockModule("../db/models/index.js", () => ({
  Review: {
    findByPk: findReviewByPk,
    findAll: findReviewsByShift,
    findAndCountAll: findAndCountReviews,
    findOne: findReviewAggregate,
    sequelize: {
      transaction: reviewTransaction,
      fn: aggregateFunction,
      col: column,
    },
  },
  Shift,
  JobPosition,
  Company,
  Location,
  ShiftApplication: {},
  User,
  WorkerProfile,
}));

const {
  deleteReview,
  getReviewById,
  getReviewsByRevieweeId,
  getReviewsByShiftId,
} = await import("../services/reviewServices.js");

describe("review reading and deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reviewTransaction.mockImplementation(async (callback) => callback(transaction));
  });

  test("returns one review by id and reports a missing review", async () => {
    const review = { id: "review-1", rating: 5 };
    findReviewByPk.mockResolvedValueOnce(review).mockResolvedValueOnce(null);

    await expect(getReviewById("review-1")).resolves.toBe(review);
    await expect(getReviewById("missing-review")).rejects.toMatchObject({
      status: 404,
      message: "Review not found.",
    });

    expect(findReviewByPk).toHaveBeenNthCalledWith(1, "review-1");
    expect(findReviewByPk).toHaveBeenNthCalledWith(2, "missing-review");
  });

  test("returns every review attached to the requested shift", async () => {
    const reviews = [{ id: "review-1" }, { id: "review-2" }];
    findReviewsByShift.mockResolvedValue(reviews);

    await expect(getReviewsByShiftId("shift-1")).resolves.toEqual(reviews);
    expect(findReviewsByShift).toHaveBeenCalledWith({ where: { shiftId: "shift-1" } });
  });

  test("paginates reviews and restricts a company profile to that company reviews", async () => {
    const rows = [{ id: "review-1" }, { id: "review-2" }, { id: "review-3" }];
    findAndCountReviews.mockResolvedValue({ count: 8, rows });
    findReviewAggregate.mockResolvedValue({ averageRating: "4.125" });

    await expect(
      getReviewsByRevieweeId("company-owner-1", {
        page: 2,
        limit: 3,
        companyId: "company-1",
      }),
    ).resolves.toEqual({
      data: rows,
      totalItems: 8,
      totalPages: 3,
      currentPage: 2,
      averageRating: 4.13,
    });

    const query = findAndCountReviews.mock.calls[0][0];
    expect(query).toMatchObject({
      where: { revieweeId: "company-owner-1" },
      order: [["created_at", "DESC"]],
      limit: 3,
      offset: 3,
      distinct: true,
    });
    expect(query.include[0]).toMatchObject({ model: Shift, required: true });
    expect(query.include[0].include[1]).toMatchObject({ model: Location, required: true });
    expect(query.include[0].include[1].include[0]).toMatchObject({
      model: Company,
      where: { id: "company-1" },
      required: true,
    });
    expect(query.include[1]).toMatchObject({ model: User, as: "Reviewer" });

    const aggregateQuery = findReviewAggregate.mock.calls[0][0];
    expect(aggregateQuery.where).toEqual({ revieweeId: "company-owner-1" });
    expect(aggregateQuery.include[0]).toMatchObject({ model: Shift, required: true });
  });

  test("uses default pagination and returns zero when a reviewee has no ratings", async () => {
    findAndCountReviews.mockResolvedValue({ count: 0, rows: [] });
    findReviewAggregate.mockResolvedValue(null);

    await expect(getReviewsByRevieweeId("worker-1")).resolves.toEqual({
      data: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      averageRating: 0,
    });

    expect(findAndCountReviews).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { revieweeId: "worker-1" },
        limit: 5,
        offset: 0,
      }),
    );
    expect(findReviewAggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { revieweeId: "worker-1" }, include: [] }),
    );
  });

  test("deletes its author's review and recalculates the worker rating", async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    const update = jest.fn().mockResolvedValue(undefined);
    findReviewByPk.mockResolvedValue({
      id: "review-1",
      reviewerId: "company-owner-1",
      revieweeId: "worker-1",
      destroy,
    });
    findWorkerProfile.mockResolvedValue({ update });
    findReviewAggregate.mockResolvedValue({ averageRating: "3.75" });

    await expect(deleteReview("review-1", "company-owner-1")).resolves.toBeUndefined();

    expect(destroy).toHaveBeenCalledWith({ transaction });
    expect(update).toHaveBeenCalledWith({ rating: 3.75 }, { transaction });
    expect(findReviewAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { revieweeId: "worker-1" },
        transaction,
      }),
    );
  });

  test("does not allow another user to delete a review", async () => {
    const destroy = jest.fn();
    findReviewByPk.mockResolvedValue({
      id: "review-1",
      reviewerId: "company-owner-1",
      revieweeId: "worker-1",
      destroy,
    });

    await expect(deleteReview("review-1", "another-user")).rejects.toMatchObject({
      status: 403,
      message: "Ви не маєте права редагувати цей відгук.",
    });

    expect(destroy).not.toHaveBeenCalled();
    expect(findWorkerProfile).not.toHaveBeenCalled();
  });
});
