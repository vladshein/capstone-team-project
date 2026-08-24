import { jest } from "@jest/globals";

const query = jest.fn();
const transaction = jest.fn();

jest.unstable_mockModule("../db/sequelize.js", () => ({
  default: { query, transaction },
}));

const { reconcileShiftLifecycle } =
  await import("../services/shiftLifecycleServices.js");

const transactionContext = { id: "test-transaction" };

const mockCounts = (pending, open, booked) => {
  query
    .mockResolvedValueOnce([{ count: String(pending) }])
    .mockResolvedValueOnce([{ count: String(open) }])
    .mockResolvedValueOnce([{ count: String(booked) }]);
};

describe("reconcileShiftLifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation(async (callback) => callback(transactionContext));
  });

  test("reports expired records in dry-run mode without changing data", async () => {
    mockCounts(2, 3, 1);

    const result = await reconcileShiftLifecycle({
      now: "2026-08-23T10:00:00.000Z",
      dryRun: true,
    });

    expect(result).toEqual({
      now: "2026-08-23T10:00:00.000Z",
      dryRun: true,
      expiredPendingApplications: 2,
      expiredOpenShifts: 3,
      bookedShiftsAwaitingDecision: 1,
    });
    expect(query).toHaveBeenCalledTimes(3);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  test("rejects expired pending applications and cancels expired open shifts", async () => {
    mockCounts(4, 2, 1);
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await reconcileShiftLifecycle({ now: "2026-08-23T10:00:00.000Z" });

    expect(query).toHaveBeenCalledTimes(5);

    const [rejectApplicationsSql, rejectApplicationsOptions] = query.mock.calls[3];
    const [cancelShiftsSql, cancelShiftsOptions] = query.mock.calls[4];

    expect(rejectApplicationsSql).toContain('SET "status" = \'rejected\'');
    expect(rejectApplicationsOptions).toEqual(
      expect.objectContaining({
        replacements: { now: new Date("2026-08-23T10:00:00.000Z") },
        transaction: transactionContext,
      }),
    );
    expect(cancelShiftsSql).toContain('SET "status" = \'cancelled\'');
    expect(cancelShiftsOptions).toEqual(
      expect.objectContaining({
        replacements: { now: new Date("2026-08-23T10:00:00.000Z") },
        transaction: transactionContext,
      }),
    );
  });

  test("rejects an invalid reconciliation time before opening a transaction", async () => {
    await expect(
      reconcileShiftLifecycle({ now: "not-a-date" }),
    ).rejects.toThrow("Lifecycle reconciliation requires a valid date.");

    expect(transaction).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });
});
