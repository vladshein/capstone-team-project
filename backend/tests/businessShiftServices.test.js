import { jest } from "@jest/globals";
import { Op } from "sequelize";

const findCompany = jest.fn();
const findAndCountBusinessShifts = jest.fn();
const findAndCountApplications = jest.fn();
const countApplications = jest.fn();
const findApplication = jest.fn();
const findReview = jest.fn();

const ShiftModel = { findAndCountAll: findAndCountBusinessShifts };
const ShiftApplicationModel = {
  findAndCountAll: findAndCountApplications,
  count: countApplications,
  findOne: findApplication,
};
const CompanyModel = { findOne: findCompany };
const ReviewModel = { findOne: findReview };

jest.unstable_mockModule("../db/models/index.js", () => ({
  Shift: ShiftModel,
  Location: {},
  Company: CompanyModel,
  JobPosition: {},
  Category: {},
  ShiftApplication: ShiftApplicationModel,
  User: {},
  WorkerProfile: {},
  Review: ReviewModel,
}));

const {
  getBusinessShifts,
  getBusinessShiftApplications,
  getBusinessShiftWorkerSummary,
  getPendingBusinessShiftApplicationsCount,
} = await import("../services/shiftServices.js");

describe("business shift services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("denies a business shift list to a user who does not own the company", async () => {
    findCompany.mockResolvedValue(null);

    await expect(
      getBusinessShifts({ companyId: 12, ownerId: 7, scope: "active" }),
    ).rejects.toMatchObject({
      message: "У вас немає доступу до змін цієї компанії",
      status: 403,
    });

    expect(findAndCountBusinessShifts).not.toHaveBeenCalled();
  });

  test("loads active company shifts with location ownership and pagination", async () => {
    const rows = [{ id: 101 }, { id: 102 }];
    findCompany.mockResolvedValue({ id: 12 });
    findAndCountBusinessShifts.mockResolvedValue({ count: 10, rows });

    const result = await getBusinessShifts({
      companyId: 12,
      ownerId: 7,
      scope: "active",
      page: 2,
      limit: 2,
    });

    expect(result).toEqual({
      totalItems: 10,
      totalPages: 5,
      currentPage: 2,
      data: rows,
    });

    const options = findAndCountBusinessShifts.mock.calls[0][0];
    expect(options).toEqual(
      expect.objectContaining({
        limit: 2,
        offset: 2,
        distinct: true,
        subQuery: false,
        order: [["startTime", "ASC"]],
      }),
    );
    expect(options.where.status).toEqual({
      [Op.in]: ["open", "booked", "in_progress"],
    });
    expect(options.where.endTime[Op.gte]).toBeInstanceOf(Date);

    const locationInclude = options.include.find((item) => item.where?.companyId);
    expect(locationInclude).toEqual(
      expect.objectContaining({ where: { companyId: 12 }, required: true }),
    );
  });

  test("loads archive shifts with completed worker and own review data", async () => {
    findCompany.mockResolvedValue({ id: 12 });
    findAndCountBusinessShifts.mockResolvedValue({ count: 1, rows: [{ id: 103 }] });

    await getBusinessShifts({
      companyId: 12,
      ownerId: 7,
      scope: "archive",
      page: 1,
      limit: 8,
    });

    const options = findAndCountBusinessShifts.mock.calls[0][0];
    expect(options.order).toEqual([["startTime", "DESC"]]);
    expect(options.where[Op.or]).toHaveLength(2);
    expect(options.where[Op.or][0]).toEqual({
      status: { [Op.in]: ["completed", "cancelled"] },
    });
    expect(options.where[Op.or][1].endTime[Op.lt]).toBeInstanceOf(Date);

    const applicationsInclude = options.include.find(
      (item) => item.model === ShiftApplicationModel,
    );
    expect(applicationsInclude).toEqual(
      expect.objectContaining({
        required: false,
        where: { status: { [Op.in]: ["completed", "no_show"] } },
      }),
    );

    const reviewsInclude = options.include.find((item) => item.model === ReviewModel);
    expect(reviewsInclude).toEqual(
      expect.objectContaining({ required: false, where: { reviewerId: 7 } }),
    );
  });

  test("returns only pending and approved applications belonging to the company", async () => {
    const rows = [{ id: 501 }];
    findCompany.mockResolvedValue({ id: 12 });
    findAndCountApplications.mockResolvedValue({ count: 9, rows });

    const result = await getBusinessShiftApplications({
      companyId: 12,
      ownerId: 7,
      page: 2,
      limit: 4,
    });

    expect(result).toEqual({
      totalItems: 9,
      totalPages: 3,
      currentPage: 2,
      data: rows,
    });

    const options = findAndCountApplications.mock.calls[0][0];
    expect(options).toEqual(
      expect.objectContaining({
        where: { status: { [Op.in]: ["pending", "approved"] } },
        limit: 4,
        offset: 4,
        distinct: true,
        subQuery: false,
        order: [["appliedAt", "DESC"]],
      }),
    );

    const shiftInclude = options.include[0];
    const locationInclude = shiftInclude.include.find((item) => item.where?.companyId);
    expect(locationInclude).toEqual(
      expect.objectContaining({ where: { companyId: 12 }, required: true }),
    );
    const reviewInclude = shiftInclude.include.find((item) => item.model === ReviewModel);
    expect(reviewInclude).toEqual(
      expect.objectContaining({ where: { reviewerId: 7 }, required: false }),
    );
  });

  test("returns only the pending application count for an owned company", async () => {
    findCompany.mockResolvedValue({ id: 12 });
    countApplications.mockResolvedValue(6);

    await expect(
      getPendingBusinessShiftApplicationsCount({ companyId: 12, ownerId: 7 }),
    ).resolves.toBe(6);

    const options = countApplications.mock.calls[0][0];
    expect(options.where).toEqual({ status: "pending" });
    expect(options.include[0].include[0]).toEqual(
      expect.objectContaining({ where: { companyId: 12 }, required: true }),
    );
  });

  test("returns an archive worker summary together with the company owner's review", async () => {
    const application = { id: 501, workerId: 42 };
    const review = { id: 901, rating: 5, comment: "Дякую" };
    findApplication.mockResolvedValue(application);
    findReview.mockResolvedValue(review);

    await expect(
      getBusinessShiftWorkerSummary({ shiftId: 103, ownerId: 7 }),
    ).resolves.toEqual({ application, review });

    expect(findApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { shiftId: 103, status: { [Op.in]: ["completed", "no_show"] } },
      }),
    );
    expect(findReview).toHaveBeenCalledWith({
      where: { shiftId: 103, reviewerId: 7 },
      attributes: ["id", "rating", "comment"],
    });
  });

  test("does not query reviews if a shift has no completed worker", async () => {
    findApplication.mockResolvedValue(null);

    await expect(
      getBusinessShiftWorkerSummary({ shiftId: 103, ownerId: 7 }),
    ).resolves.toBeNull();

    expect(findReview).not.toHaveBeenCalled();
  });
});
