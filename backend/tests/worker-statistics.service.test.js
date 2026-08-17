import { jest } from "@jest/globals";

const findOneApplication = jest.fn();
const findOneWallet = jest.fn();

jest.unstable_mockModule("../db/models/index.js", () => ({
  ShiftApplication: { findOne: findOneApplication },
  Wallet: { findOne: findOneWallet },
  Shift: {},
  Location: {},
}));

const { getWorkerStatisticsSummary } =
  await import("../services/worker-statistics.service.js");

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
