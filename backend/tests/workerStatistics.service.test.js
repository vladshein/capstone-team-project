import { jest } from "@jest/globals";
import { Op } from "sequelize";

const findOneApplication = jest.fn();
const findOneWallet = jest.fn();
const findAllShifts = jest.fn();

jest.unstable_mockModule("../db/models/index.js", () => ({
  ShiftApplication: {
    findOne: findOneApplication,
    findAll: findAllShifts,
  },
  Wallet: { findOne: findOneWallet },
  Shift: {},
  Location: {},
}));

const { getWorkerStatisticsSummary, getWorkerShiftsStatistics } =
  await import("../services/workerStatistics.service.js");

const applicationAggregateRow = {
  total: "8",
  pending: "1",
  approved: "2",
  rejected: "1",
  completed: "3",
  noShow: "1",
};

const workAggregateRow = {
  upcoming: "2",
  scheduledCompletedHours: "24.5",
  estimatedCompletedEarnings: "4200.75",
  companiesWorkedFor: "2",
  attendanceCompleted: "3",
  attendanceNoShow: "1",
};

describe("getWorkerStatisticsSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns aggregate statistics and a wallet snapshot for a worker with data", async () => {
    findOneApplication
      .mockResolvedValueOnce(applicationAggregateRow)
      .mockResolvedValueOnce(workAggregateRow);
    findOneWallet.mockResolvedValue({
      balance: "1250.50",
      frozenBalance: "50.00",
    });

    await expect(
      getWorkerStatisticsSummary(42, {
        dateFrom: "2026-08-01T00:00:00.000Z",
        dateTo: "2026-08-31T23:59:59.999Z",
        companyId: 7,
      }),
    ).resolves.toEqual({
      applications: {
        total: 8,
        pending: 1,
        approved: 2,
        rejected: 1,
        completed: 3,
        noShow: 1,
      },
      shifts: {
        completed: 3,
        upcoming: 2,
        scheduledCompletedHours: 24.5,
        estimatedCompletedEarnings: 4200.75,
      },
      companiesWorkedFor: 2,
      attendance: { completed: 3, noShow: 1, rate: 75 },
      wallet: { balance: 1250.5, frozenBalance: 50 },
    });

    expect(findOneApplication).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { workerId: 42 }, raw: true }),
    );
    expect(findOneApplication.mock.calls[0][0].include).toBeUndefined();
    expect(findOneApplication).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { workerId: 42 },
        include: expect.any(Array),
        raw: true,
      }),
    );
    expect(findOneWallet).toHaveBeenCalledWith({
      where: { userId: 42 },
      attributes: ["balance", "frozenBalance"],
      raw: true,
    });
  });

  test("returns zeroes when there are no matching applications", async () => {
    findOneApplication.mockResolvedValue({});
    findOneWallet.mockResolvedValue({ balance: "0", frozenBalance: "0" });

    await expect(getWorkerStatisticsSummary(43)).resolves.toEqual({
      applications: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        noShow: 0,
      },
      shifts: {
        completed: 0,
        upcoming: 0,
        scheduledCompletedHours: 0,
        estimatedCompletedEarnings: 0,
      },
      companiesWorkedFor: 0,
      attendance: { completed: 0, noShow: 0, rate: 0 },
      wallet: { balance: 0, frozenBalance: 0 },
    });
  });

  test("does not require a WorkerProfile and returns null when no Wallet exists", async () => {
    findOneApplication.mockResolvedValue({});
    findOneWallet.mockResolvedValue(null);

    const result = await getWorkerStatisticsSummary(44);

    expect(result.wallet).toBeNull();
    expect(result.applications.total).toBe(0);
    expect(result.shifts.scheduledCompletedHours).toBe(0);
  });

  test("keeps application counters unfiltered while date filters change work metrics", async () => {
    findOneApplication
      .mockResolvedValueOnce(applicationAggregateRow)
      .mockResolvedValueOnce({
        ...workAggregateRow,
        scheduledCompletedHours: "8",
        estimatedCompletedEarnings: "1500",
        companiesWorkedFor: "1",
        attendanceCompleted: "1",
        attendanceNoShow: "0",
      });
    findOneWallet.mockResolvedValue(null);

    const result = await getWorkerStatisticsSummary(42, {
      dateFrom: "2026-08-01T00:00:00.000Z",
      dateTo: "2026-08-31T23:59:59.999Z",
    });

    expect(result.applications.total).toBe(8);
    expect(result.applications.completed).toBe(3);
    expect(result.shifts.estimatedCompletedEarnings).toBe(1500);
    expect(result.attendance).toEqual({ completed: 1, noShow: 0, rate: 100 });
    expect(findOneApplication.mock.calls[0][0].include).toBeUndefined();
    const shiftDateFilter =
      findOneApplication.mock.calls[1][0].include[0].where;
    const [andOperator] = Reflect.ownKeys(shiftDateFilter);

    expect(shiftDateFilter[andOperator]).toHaveLength(2);
    expect(shiftDateFilter[andOperator]).toEqual([
      { endTime: expect.any(Object) },
      { startTime: expect.any(Object) },
    ]);
  });

  test("uses an overlap filter so shifts that start or end within a month are included", async () => {
    findOneApplication
      .mockResolvedValueOnce(applicationAggregateRow)
      .mockResolvedValueOnce(workAggregateRow);
    findOneWallet.mockResolvedValue(null);

    await getWorkerStatisticsSummary(42, {
      dateFrom: "2026-08-01T00:00:00.000Z",
      dateTo: "2026-08-31T23:59:59.999Z",
    });

    const shiftDateFilter =
      findOneApplication.mock.calls[1][0].include[0].where;
    const [andOperator] = Reflect.ownKeys(shiftDateFilter);
    const [endsOnOrAfterPeriodStart, startsOnOrBeforePeriodEnd] =
      shiftDateFilter[andOperator];

    expect(
      endsOnOrAfterPeriodStart.endTime[
        Reflect.ownKeys(endsOnOrAfterPeriodStart.endTime)[0]
      ],
    ).toBe("2026-08-01T00:00:00.000Z");
    expect(
      startsOnOrBeforePeriodEnd.startTime[
        Reflect.ownKeys(startsOnOrBeforePeriodEnd.startTime)[0]
      ],
    ).toBe("2026-08-31T23:59:59.999Z");
  });
});

describe("getWorkerShiftsStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const extractRangeFilter = (options) => {
    const shiftInclude = options.include[0];
    const [andOp] = Reflect.ownKeys(shiftInclude.where);
    return shiftInclude.where[andOp];
  };

  test("returns totals and a per-month series grouped by months", async () => {
    findAllShifts.mockResolvedValue([
      {
        period: "2026-07",
        completedShifts: "5",
        noShows: "1",
        scheduledHours: "40",
        estimatedEarnings: "2000",
      },
      {
        period: "2026-08",
        completedShifts: "3",
        noShows: "0",
        scheduledHours: "24",
        estimatedEarnings: "1200",
      },
      {
        period: "2026-09",
        completedShifts: "4",
        noShows: "2",
        scheduledHours: "32",
        estimatedEarnings: "1600",
      },
    ]);

    const result = await getWorkerShiftsStatistics(42, {
      dateFrom: "2026-07-01T00:00:00.000Z",
      dateTo: "2026-09-30T23:59:59.999Z",
      groupBy: "month",
    });

    expect(findAllShifts).toHaveBeenCalledTimes(1);
    const options = findAllShifts.mock.calls[0][0];

    expect(options.where.workerId).toBe(42);
    const [statusOp] = Reflect.ownKeys(options.where.status);
    expect(statusOp).toBe(Op.in);
    expect(options.where.status[statusOp]).toEqual(["completed", "no_show"]);
    expect(options.raw).toBe(true);
    expect(options.order).toEqual([["period", "ASC"]]);
    expect(options.attributes[0][1]).toBe("period");
    expect(options.group[0].val).toContain("YYYY-MM");

    const range = extractRangeFilter(options);
    const endTimeCond = range.find((c) => "endTime" in c);
    const [gteOp] = Reflect.ownKeys(endTimeCond.endTime);
    expect(endTimeCond.endTime[gteOp].toISOString()).toBe(
      "2026-07-01T00:00:00.000Z",
    );

    expect(result).toEqual({
      totals: {
        completedShifts: 12,
        noShows: 3,
        scheduledCompletedHours: 96,
        estimatedCompletedEarnings: 4800,
      },
      series: [
        {
          period: "2026-07",
          completedShifts: 5,
          noShows: 1,
          scheduledHours: 40,
          estimatedEarnings: 2000,
        },
        {
          period: "2026-08",
          completedShifts: 3,
          noShows: 0,
          scheduledHours: 24,
          estimatedEarnings: 1200,
        },
        {
          period: "2026-09",
          completedShifts: 4,
          noShows: 2,
          scheduledHours: 32,
          estimatedEarnings: 1600,
        },
      ],
    });
  });

  test("returns totals and a per-week series grouped by weeks", async () => {
    findAllShifts.mockResolvedValue([
      {
        period: "2026-W30",
        completedShifts: "2",
        noShows: "1",
        scheduledHours: "16",
        estimatedEarnings: "800",
      },
      {
        period: "2026-W31",
        completedShifts: "6",
        noShows: "0",
        scheduledHours: "48",
        estimatedEarnings: "2400",
      },
    ]);

    const result = await getWorkerShiftsStatistics(42, {
      dateFrom: "2026-07-20T00:00:00.000Z",
      dateTo: "2026-08-15T23:59:59.999Z",
      groupBy: "week",
    });

    const options = findAllShifts.mock.calls[0][0];
    expect(options.group[0].val).toMatch(/IYYY/i);
    expect(options.group[0].val).not.toContain("YYYY-MM");

    expect(result).toEqual({
      totals: {
        completedShifts: 8,
        noShows: 1,
        scheduledCompletedHours: 64,
        estimatedCompletedEarnings: 3200,
      },
      series: [
        {
          period: "2026-W30",
          completedShifts: 2,
          noShows: 1,
          scheduledHours: 16,
          estimatedEarnings: 800,
        },
        {
          period: "2026-W31",
          completedShifts: 6,
          noShows: 0,
          scheduledHours: 48,
          estimatedEarnings: 2400,
        },
      ],
    });
  });

  test("returns zero totals and an empty series when there are no completed or no_show applications", async () => {
    findAllShifts.mockResolvedValue([]);

    const result = await getWorkerShiftsStatistics(42, {
      dateFrom: "2026-07-01T00:00:00.000Z",
      dateTo: "2026-09-30T23:59:59.999Z",
    });

    expect(findAllShifts).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      totals: {
        completedShifts: 0,
        noShows: 0,
        scheduledCompletedHours: 0,
        estimatedCompletedEarnings: 0,
      },
      series: [],
    });
  });

  test("applies a default 3-month range when dateFrom and dateTo are not provided", async () => {
    findAllShifts.mockResolvedValue([]);

    await getWorkerShiftsStatistics(42);

    const options = findAllShifts.mock.calls[0][0];
    expect(options.where.workerId).toBe(42);
    const [statusOp] = Reflect.ownKeys(options.where.status);
    expect(options.where.status[statusOp]).toEqual(["completed", "no_show"]);

    const range = extractRangeFilter(options);
    expect(range).toHaveLength(2);

    const endTimeCond = range.find((c) => "endTime" in c);
    const startTimeCond = range.find((c) => "startTime" in c);
    const [gteOp] = Reflect.ownKeys(endTimeCond.endTime);
    const [lteOp] = Reflect.ownKeys(startTimeCond.startTime);

    const resolvedFrom = endTimeCond.endTime[gteOp];
    const resolvedTo = startTimeCond.startTime[lteOp];
    expect(resolvedFrom).toBeInstanceOf(Date);
    expect(resolvedTo).toBeInstanceOf(Date);

    const now = new Date();
    const diffDays = (now - resolvedFrom) / 86400000;
    expect(diffDays).toBeGreaterThan(85);
    expect(diffDays).toBeLessThan(95);
    expect(Math.abs(now - resolvedTo)).toBeLessThan(2000);
  });
});
