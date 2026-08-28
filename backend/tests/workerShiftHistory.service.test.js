import { jest } from "@jest/globals";
import { Op } from "sequelize";

const findAndCountAll = jest.fn();
const findAllReviews = jest.fn();

jest.unstable_mockModule("../db/models/index.js", () => ({
  Shift: {},
  Location: {},
  Company: {},
  JobPosition: {},
  Category: {},
  ShiftApplication: { findAndCountAll },
  User: {},
  WorkerProfile: {},
  Review: { findAll: findAllReviews },
}));

const { getWorkerShiftHistory } = await import("../services/shiftServices.js");

describe("worker shift history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads active applications and attaches only the worker's reviews for that page", async () => {
    const shift = { id: 71, setDataValue: jest.fn() };
    const rows = [{ id: 801, Shift: shift }];
    findAndCountAll.mockResolvedValue({ count: 9, rows });
    findAllReviews.mockResolvedValue([
      { id: 901, shiftId: 71, rating: 5, comment: "Чудова компанія" },
    ]);

    const result = await getWorkerShiftHistory(42, {
      page: 2,
      limit: 4,
      scope: "active",
    });

    expect(result).toEqual({
      totalItems: 9,
      totalPages: 3,
      currentPage: 2,
      data: rows,
    });

    const options = findAndCountAll.mock.calls[0][0];
    expect(options).toEqual(expect.objectContaining({ limit: 4, offset: 4, subQuery: false }));
    expect(options.where.workerId).toBe(42);
    expect(options.where.status).toEqual({ [Op.in]: ["pending", "approved"] });
    expect(options.include[0].where.endTime[Op.gte]).toBeInstanceOf(Date);
    expect(options.order).toEqual([[expect.anything(), "startTime", "ASC"]]);

    expect(findAllReviews).toHaveBeenCalledWith({
      attributes: ["id", "shiftId", "rating", "comment"],
      where: { reviewerId: 42, shiftId: { [Op.in]: [71] } },
      raw: true,
    });
    expect(shift.setDataValue).toHaveBeenCalledWith("Reviews", [
      { id: 901, rating: 5, comment: "Чудова компанія" },
    ]);
  });

  test("loads completed applications without filtering their shifts by the current date", async () => {
    findAndCountAll.mockResolvedValue({ count: 1, rows: [] });

    await getWorkerShiftHistory(42, { scope: "completed" });

    const options = findAndCountAll.mock.calls[0][0];
    expect(options.where).toEqual({ workerId: 42, status: "completed" });
    expect(options.include[0].where).toBeUndefined();
    expect(options.order).toEqual([[expect.anything(), "startTime", "DESC"]]);
    expect(findAllReviews).not.toHaveBeenCalled();
  });

  test("puts rejected, no-show, and overdue applications in the worker archive", async () => {
    findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getWorkerShiftHistory(42, { scope: "archive" });

    const options = findAndCountAll.mock.calls[0][0];
    expect(options.where.workerId).toBe(42);
    expect(options.where[Op.or]).toHaveLength(2);
    expect(options.where[Op.or][0]).toEqual({
      status: { [Op.in]: ["rejected", "no_show"] },
    });
    expect(options.where[Op.or][1].status).toEqual({
      [Op.in]: ["pending", "approved"],
    });
    expect(options.where[Op.or][1].shiftId[Op.in].val).toContain(
      'SELECT "id" FROM "shifts" WHERE "endTime" <',
    );
    expect(options.include[0].where).toBeUndefined();
  });

  test("can narrow a history request to one shift", async () => {
    findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getWorkerShiftHistory(42, { scope: "active", shiftId: 71 });

    expect(findAndCountAll.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ workerId: 42, shiftId: 71 }),
    );
  });
});
