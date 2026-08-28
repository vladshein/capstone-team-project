import { jest } from "@jest/globals";

const query = jest.fn();
const transaction = jest.fn();

jest.unstable_mockModule("../db/sequelize.js", () => ({
  default: { query, transaction },
}));

const { reconcileShiftLifecycle } =
  await import("../services/shiftLifecycleServices.js");

const transactionContext = { id: "test-transaction" };

const mockCounts = (pending, open, awaitingDecision, dueForAutoCompletion) => {
  query
    .mockResolvedValueOnce([{ count: String(pending) }])
    .mockResolvedValueOnce([{ count: String(open) }])
    .mockResolvedValueOnce([{ count: String(awaitingDecision) }])
    .mockResolvedValueOnce([{ count: String(dueForAutoCompletion) }]);
};

describe("reconcileShiftLifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation(async (callback) => callback(transactionContext));
  });

  test("reports expired records in dry-run mode without changing data", async () => {
    mockCounts(2, 3, 1, 4);

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
      bookedShiftsDueForAutoCompletion: 4,
      autoCompletedApplications: [],
    });
    expect(query).toHaveBeenCalledTimes(4);
    expect(transaction).toHaveBeenCalledTimes(1);

    const [awaitingDecisionSql, awaitingDecisionOptions] = query.mock.calls[2];
    const [autoCompletionSql, autoCompletionOptions] = query.mock.calls[3];
    const autoCompletionCutoff = new Date("2026-08-22T22:00:00.000Z");

    expect(awaitingDecisionSql).toContain('"endTime" > :bookedShiftAutoCompletionCutoff');
    expect(awaitingDecisionOptions).toEqual(
      expect.objectContaining({
        replacements: {
          now: new Date("2026-08-23T10:00:00.000Z"),
          bookedShiftAutoCompletionCutoff: autoCompletionCutoff,
        },
      }),
    );
    expect(autoCompletionSql).toContain('"endTime" <= :bookedShiftAutoCompletionCutoff');
    expect(autoCompletionSql).toContain('"application"."status" = \'approved\'');
    expect(autoCompletionOptions).toEqual(
      expect.objectContaining({
        replacements: { bookedShiftAutoCompletionCutoff: autoCompletionCutoff },
      }),
    );
  });

  test("rejects and cancels expired records, then auto-completes booked shifts after 12 hours", async () => {
    mockCounts(4, 2, 1, 3);
    query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { shiftId: "101", workerId: "201" },
        { shiftId: "102", workerId: "202" },
      ]);

    const result = await reconcileShiftLifecycle({ now: "2026-08-23T10:00:00.000Z" });

    expect(result.autoCompletedApplications).toEqual([
      { shiftId: 101, workerId: 201 },
      { shiftId: 102, workerId: 202 },
    ]);

    expect(query).toHaveBeenCalledTimes(7);

    const [rejectApplicationsSql, rejectApplicationsOptions] = query.mock.calls[4];
    const [cancelShiftsSql, cancelShiftsOptions] = query.mock.calls[5];
    const [autoCompleteSql, autoCompleteOptions] = query.mock.calls[6];

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
    expect(autoCompleteSql).toContain('WITH "completed_applications" AS');
    expect(autoCompleteSql).toContain('"completed_shifts" AS (');
    expect(autoCompleteSql).toContain('SET "status" = \'completed\'');
    expect(autoCompleteSql).toContain('"application"."status" = \'approved\'');
    expect(autoCompleteSql).toContain(
      'RETURNING\n              "application"."shiftId" AS "shiftId"',
    );
    expect(autoCompleteOptions).toEqual(
      expect.objectContaining({
        replacements: {
          bookedShiftAutoCompletionCutoff: new Date("2026-08-22T22:00:00.000Z"),
        },
        transaction: transactionContext,
        type: "SELECT",
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
