import { jest } from "@jest/globals";
import { Op } from "sequelize";

const findAllCompanies = jest.fn();
const findOneShift = jest.fn();
const findOneApplication = jest.fn();
const findAllApplications = jest.fn();
const findAllUsers = jest.fn();

jest.unstable_mockModule("../db/models/index.js", () => ({
  Company: { findAll: findAllCompanies },
  Shift: { findOne: findOneShift },
  ShiftApplication: {
    findOne: findOneApplication,
    findAll: findAllApplications,
  },
  User: { findAll: findAllUsers },
  Location: {},
  WorkerProfile: {},
}));

const {
  getBusinessStatisticsSummary,
  getBusinessShiftsStatistics,
  getBusinessWorkersStatistics,
  getBusinessStatisticsBundle,
} = await import("../services/businessStatisticsServices.js");

describe("getBusinessStatisticsSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("aggregates shifts/applications/workers/money across all owned companies", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    findOneShift.mockResolvedValue({
      total: "10",
      open: "2",
      booked: "1",
      inProgress: "1",
      completed: "5",
      cancelled: "1",
    });
    findOneApplication.mockResolvedValue({
      total: "12",
      pending: "2",
      approved: "3",
      rejected: "1",
      completed: "5",
      noShow: "1",
      totalPaidOut: "3200.50",
      workersApplied: "6",
      workersWorked: "4",
    });

    await expect(getBusinessStatisticsSummary(9)).resolves.toEqual({
      companies: { total: 2 },
      shifts: { total: 10, open: 2, booked: 1, inProgress: 1, completed: 5, cancelled: 1 },
      applications: { total: 12, pending: 2, approved: 3, rejected: 1, completed: 5, noShow: 1 },
      workers: { applied: 6, worked: 4 },
      money: { totalPaidOut: 3200.5 },
    });

    const shiftOptions = findOneShift.mock.calls[0][0];
    const locationWhere = shiftOptions.include[0].where.companyId;
    const [opKey] = Reflect.ownKeys(locationWhere);
    expect(opKey).toBe(Op.in);
    expect(locationWhere[opKey]).toEqual([1, 2]);
  });

  test("scopes to a single company when companyId is owned", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    findOneShift.mockResolvedValue({});
    findOneApplication.mockResolvedValue({});

    const result = await getBusinessStatisticsSummary(9, { companyId: 2 });

    expect(result.companies.total).toBe(2);
    const locationWhere = findOneShift.mock.calls[0][0].include[0].where.companyId;
    const [opKey] = Reflect.ownKeys(locationWhere);
    expect(locationWhere[opKey]).toEqual([2]);
  });

  test("rejects a companyId the owner does not own", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }]);

    await expect(
      getBusinessStatisticsSummary(9, { companyId: 999 }),
    ).rejects.toMatchObject({ status: 403 });
    expect(findOneShift).not.toHaveBeenCalled();
  });

  test("returns a zeroed summary when the owner has no companies yet", async () => {
    findAllCompanies.mockResolvedValue([]);

    await expect(getBusinessStatisticsSummary(9)).resolves.toEqual({
      companies: { total: 0 },
      shifts: { total: 0, open: 0, booked: 0, inProgress: 0, completed: 0, cancelled: 0 },
      applications: { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0, noShow: 0 },
      workers: { applied: 0, worked: 0 },
      money: { totalPaidOut: 0 },
    });
    expect(findOneShift).not.toHaveBeenCalled();
    expect(findOneApplication).not.toHaveBeenCalled();
  });
});

describe("getBusinessShiftsStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns totals and a per-month series scoped to the owner's companies", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }]);
    findAllApplications.mockResolvedValue([
      { period: "2026-07", completedShifts: "3", noShows: "1", scheduledHours: "24", spend: "1200" },
      { period: "2026-08", completedShifts: "2", noShows: "0", scheduledHours: "16", spend: "800" },
    ]);

    const result = await getBusinessShiftsStatistics(9, {
      dateFrom: "2026-07-01T00:00:00.000Z",
      dateTo: "2026-08-31T23:59:59.999Z",
      groupBy: "month",
    });

    const options = findAllApplications.mock.calls[0][0];
    expect(options.where.status[Op.in]).toEqual(["completed", "no_show"]);
    expect(options.group[0].val).toContain("YYYY-MM");
    const locationWhere = options.include[0].include[0].where.companyId;
    expect(locationWhere[Op.in]).toEqual([1]);

    expect(result).toEqual({
      totals: { completedShifts: 5, noShows: 1, scheduledCompletedHours: 40, estimatedSpend: 2000 },
      series: [
        { period: "2026-07", completedShifts: 3, noShows: 1, scheduledHours: 24, spend: 1200 },
        { period: "2026-08", completedShifts: 2, noShows: 0, scheduledHours: 16, spend: 800 },
      ],
    });
  });

  test("returns an empty series when the owner has no companies yet", async () => {
    findAllCompanies.mockResolvedValue([]);

    const result = await getBusinessShiftsStatistics(9, {});

    expect(result).toEqual({
      totals: { completedShifts: 0, noShows: 0, scheduledCompletedHours: 0, estimatedSpend: 0 },
      series: [],
    });
    expect(findAllApplications).not.toHaveBeenCalled();
  });

  test("rejects a companyId the owner does not own", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }]);

    await expect(
      getBusinessShiftsStatistics(9, { companyId: 42 }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("getBusinessWorkersStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns a paginated, enriched list of distinct workers", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }]);
    findOneApplication.mockResolvedValue({ total: "2" });
    findAllApplications.mockResolvedValue([
      {
        workerId: 101,
        totalApplications: "4",
        completedShifts: "3",
        noShow: "1",
        lastActivityAt: "2026-08-20T10:00:00.000Z",
      },
      {
        workerId: 102,
        totalApplications: "1",
        completedShifts: "0",
        noShow: "0",
        lastActivityAt: "2026-08-18T10:00:00.000Z",
      },
    ]);
    findAllUsers.mockResolvedValue([
      { id: 101, avatar: "a.png", WorkerProfile: { firstName: "Іван", lastName: "Коваль", rating: "4.50" } },
      { id: 102, avatar: null, WorkerProfile: { firstName: "Олена", lastName: "Ткач", rating: "0" } },
    ]);

    const result = await getBusinessWorkersStatistics(9, { page: 1, limit: 10 });

    expect(result).toEqual({
      totalItems: 2,
      totalPages: 1,
      currentPage: 1,
      data: [
        {
          workerId: 101,
          firstName: "Іван",
          lastName: "Коваль",
          avatarUrl: "a.png",
          rating: 4.5,
          totalApplications: 4,
          completedShifts: 3,
          noShow: 1,
          lastActivityAt: "2026-08-20T10:00:00.000Z",
        },
        {
          workerId: 102,
          firstName: "Олена",
          lastName: "Ткач",
          avatarUrl: null,
          rating: 0,
          totalApplications: 1,
          completedShifts: 0,
          noShow: 0,
          lastActivityAt: "2026-08-18T10:00:00.000Z",
        },
      ],
    });

    const usersWhere = findAllUsers.mock.calls[0][0].where.id;
    expect(usersWhere[Op.in]).toEqual([101, 102]);
  });

  test("skips the enrichment query and returns an empty page when there are no matching workers", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }]);
    findOneApplication.mockResolvedValue({ total: "0" });
    findAllApplications.mockResolvedValue([]);

    const result = await getBusinessWorkersStatistics(9, {});

    expect(result).toEqual({ totalItems: 0, totalPages: 0, currentPage: 1, data: [] });
    expect(findAllUsers).not.toHaveBeenCalled();
  });

  test("returns an empty page when the owner has no companies yet", async () => {
    findAllCompanies.mockResolvedValue([]);

    const result = await getBusinessWorkersStatistics(9, { page: 1 });

    expect(result).toEqual({ totalItems: 0, totalPages: 0, currentPage: 1, data: [] });
    expect(findOneApplication).not.toHaveBeenCalled();
    expect(findAllApplications).not.toHaveBeenCalled();
  });
});

describe("getBusinessStatisticsBundle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ShiftApplication.findOne backs two different queries here (the summary's
  // applications aggregate and the workers count), and ShiftApplication.findAll
  // backs two more (the shifts series and the workers rows) — both pairs share
  // one mock fn, so distinguish by each query's own `attributes` shape.
  const mockSharedApplicationQueries = () => {
    findOneApplication.mockImplementation((options) => {
      const isWorkersCountQuery = options.attributes.length === 1;
      return Promise.resolve(
        isWorkersCountQuery
          ? { total: "1" }
          : {
              total: "12",
              pending: "2",
              approved: "3",
              rejected: "1",
              completed: "5",
              noShow: "1",
              totalPaidOut: "3200.5",
              workersApplied: "6",
              workersWorked: "4",
            },
      );
    });

    findAllApplications.mockImplementation((options) => {
      const isWorkersRowsQuery = options.attributes[0] === "workerId";
      return Promise.resolve(
        isWorkersRowsQuery
          ? [
              {
                workerId: 101,
                totalApplications: "4",
                completedShifts: "3",
                noShow: "1",
                lastActivityAt: "2026-08-20T10:00:00.000Z",
              },
            ]
          : [
              {
                period: "2026-08",
                completedShifts: "2",
                noShows: "0",
                scheduledHours: "16",
                spend: "800",
              },
            ],
      );
    });
  };

  test("resolves the owner's company scope once and combines summary/shifts/workers", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }]);
    findOneShift.mockResolvedValue({
      total: "10",
      open: "2",
      booked: "1",
      inProgress: "1",
      completed: "5",
      cancelled: "1",
    });
    findAllUsers.mockResolvedValue([
      { id: 101, avatar: "a.png", WorkerProfile: { firstName: "Іван", lastName: "Коваль", rating: "4.50" } },
    ]);
    mockSharedApplicationQueries();

    const result = await getBusinessStatisticsBundle(9, {
      dateFrom: "2026-08-01T00:00:00.000Z",
      dateTo: "2026-08-31T23:59:59.999Z",
      groupBy: "month",
      page: 1,
      limit: 10,
    });

    expect(findAllCompanies).toHaveBeenCalledTimes(1);

    expect(result.summary).toEqual({
      companies: { total: 1 },
      shifts: { total: 10, open: 2, booked: 1, inProgress: 1, completed: 5, cancelled: 1 },
      applications: { total: 12, pending: 2, approved: 3, rejected: 1, completed: 5, noShow: 1 },
      workers: { applied: 6, worked: 4 },
      money: { totalPaidOut: 3200.5 },
    });
    expect(result.shifts).toEqual({
      totals: { completedShifts: 2, noShows: 0, scheduledCompletedHours: 16, estimatedSpend: 800 },
      series: [
        { period: "2026-08", completedShifts: 2, noShows: 0, scheduledHours: 16, spend: 800 },
      ],
    });
    expect(result.workers).toEqual({
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      data: [
        {
          workerId: 101,
          firstName: "Іван",
          lastName: "Коваль",
          avatarUrl: "a.png",
          rating: 4.5,
          totalApplications: 4,
          completedShifts: 3,
          noShow: 1,
          lastActivityAt: "2026-08-20T10:00:00.000Z",
        },
      ],
    });
  });

  test("rejects a companyId the owner does not own before running any section query", async () => {
    findAllCompanies.mockResolvedValue([{ id: 1 }]);

    await expect(
      getBusinessStatisticsBundle(9, { companyId: 999 }),
    ).rejects.toMatchObject({ status: 403 });
    expect(findOneShift).not.toHaveBeenCalled();
    expect(findOneApplication).not.toHaveBeenCalled();
    expect(findAllApplications).not.toHaveBeenCalled();
  });

  test("returns zeroed/empty sections when the owner has no companies yet", async () => {
    findAllCompanies.mockResolvedValue([]);

    const result = await getBusinessStatisticsBundle(9, { page: 1, limit: 10 });

    expect(result).toEqual({
      summary: {
        companies: { total: 0 },
        shifts: { total: 0, open: 0, booked: 0, inProgress: 0, completed: 0, cancelled: 0 },
        applications: { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0, noShow: 0 },
        workers: { applied: 0, worked: 0 },
        money: { totalPaidOut: 0 },
      },
      shifts: {
        totals: { completedShifts: 0, noShows: 0, scheduledCompletedHours: 0, estimatedSpend: 0 },
        series: [],
      },
      workers: { totalItems: 0, totalPages: 0, currentPage: 1, data: [] },
    });
    expect(findOneShift).not.toHaveBeenCalled();
    expect(findOneApplication).not.toHaveBeenCalled();
    expect(findAllApplications).not.toHaveBeenCalled();
  });
});
