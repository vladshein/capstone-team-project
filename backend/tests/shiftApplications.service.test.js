import { jest } from "@jest/globals";

const findApplicationByPk = jest.fn();
const findApplication = jest.fn();
const findApplications = jest.fn();
const updateApplications = jest.fn();
const findShiftByPk = jest.fn();
const shiftTransaction = jest.fn();

const transaction = { LOCK: { UPDATE: "UPDATE" } };

jest.unstable_mockModule("../db/models/index.js", () => ({
  Shift: {
    findByPk: findShiftByPk,
    sequelize: { transaction: shiftTransaction },
  },
  ShiftApplication: {
    findByPk: findApplicationByPk,
    findOne: findApplication,
    findAll: findApplications,
    update: updateApplications,
  },
  Location: {},
  Company: {},
  JobPosition: {},
  Category: {},
  User: {},
  WorkerProfile: {},
  Review: {},
}));

const {
  decideBusinessShiftApplication,
  completeBusinessShiftApplication,
  markBusinessShiftApplicationNoShow,
  cancelShift,
  cancelWorkerShiftApplication,
} = await import("../services/shiftServices.js");

const futureDate = "2035-01-01T10:00:00.000Z";
const pastDate = "2020-01-01T10:00:00.000Z";

const createBusinessApplication = ({
  applicationStatus = "pending",
  shiftStatus = "open",
  startTime = futureDate,
  endTime = futureDate,
  ownerId = 7,
} = {}) => {
  const shift = {
    status: shiftStatus,
    startTime,
    endTime,
    Location: { Company: { ownerId } },
    update: jest.fn().mockResolvedValue(undefined),
  };

  return {
    id: 31,
    shiftId: 15,
    status: applicationStatus,
    Shift: shift,
    update: jest.fn().mockResolvedValue(undefined),
  };
};

describe("shift application lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shiftTransaction.mockImplementation(async (callback) => callback(transaction));
    findApplications.mockResolvedValue([]);
  });

  test("approves a pending application and rejects other pending applications", async () => {
    const application = createBusinessApplication();
    findApplicationByPk.mockResolvedValue(application);

    const result = await decideBusinessShiftApplication({
      applicationId: application.id,
      ownerId: 7,
      decision: "approved",
    });

    expect(result).toEqual({ application, reason: null, autoRejectedWorkerIds: [] });
    expect(application.update).toHaveBeenCalledWith(
      { status: "approved" },
      { transaction },
    );
    expect(application.Shift.update).toHaveBeenCalledWith(
      { status: "booked" },
      { transaction },
    );
    expect(updateApplications).toHaveBeenCalledWith(
      { status: "rejected" },
      expect.objectContaining({
        transaction,
        where: expect.objectContaining({ shiftId: application.shiftId, status: "pending" }),
      }),
    );
  });

  test("rejects a pending application without changing the shift status", async () => {
    const application = createBusinessApplication();
    findApplicationByPk.mockResolvedValue(application);

    const result = await decideBusinessShiftApplication({
      applicationId: application.id,
      ownerId: 7,
      decision: "rejected",
    });

    expect(result).toEqual({ application, reason: null, autoRejectedWorkerIds: [] });
    expect(application.update).toHaveBeenCalledWith(
      { status: "rejected" },
      { transaction },
    );
    expect(application.Shift.update).not.toHaveBeenCalled();
    expect(updateApplications).not.toHaveBeenCalled();
  });

  test("returns workers whose pending applications were rejected after approval", async () => {
    const application = createBusinessApplication();
    findApplicationByPk.mockResolvedValue(application);
    findApplications.mockResolvedValue([
      { workerId: "42" },
      { workerId: 43 },
      { workerId: "42" },
    ]);

    await expect(
      decideBusinessShiftApplication({
        applicationId: application.id,
        ownerId: 7,
        decision: "approved",
      }),
    ).resolves.toEqual({
      application,
      reason: null,
      autoRejectedWorkerIds: [42, 43],
    });
  });

  test("does not allow a different company owner to decide an application", async () => {
    const application = createBusinessApplication({ ownerId: 7 });
    findApplicationByPk.mockResolvedValue(application);

    await expect(
      decideBusinessShiftApplication({
        applicationId: application.id,
        ownerId: 8,
        decision: "approved",
      }),
    ).resolves.toEqual({ application: null, reason: "forbidden" });

    expect(application.update).not.toHaveBeenCalled();
    expect(application.Shift.update).not.toHaveBeenCalled();
    expect(updateApplications).not.toHaveBeenCalled();
  });

  test("marks a finished booked shift as completed", async () => {
    const application = createBusinessApplication({
      applicationStatus: "approved",
      shiftStatus: "booked",
      startTime: pastDate,
      endTime: pastDate,
    });
    findApplicationByPk.mockResolvedValue(application);

    const result = await completeBusinessShiftApplication({
      applicationId: application.id,
      ownerId: 7,
    });

    expect(result).toEqual({ application, reason: null });
    expect(application.update).toHaveBeenCalledWith(
      { status: "completed" },
      { transaction },
    );
    expect(application.Shift.update).toHaveBeenCalledWith(
      { status: "completed" },
      { transaction },
    );
  });

  test("does not complete a shift before its end time", async () => {
    const application = createBusinessApplication({
      applicationStatus: "approved",
      shiftStatus: "booked",
      endTime: futureDate,
    });
    findApplicationByPk.mockResolvedValue(application);

    await expect(
      completeBusinessShiftApplication({ applicationId: application.id, ownerId: 7 }),
    ).resolves.toEqual({ application: null, reason: "not_finished" });

    expect(application.update).not.toHaveBeenCalled();
    expect(application.Shift.update).not.toHaveBeenCalled();
  });

  test("records a no-show only after a booked shift has finished", async () => {
    const application = createBusinessApplication({
      applicationStatus: "approved",
      shiftStatus: "booked",
      startTime: pastDate,
      endTime: pastDate,
    });
    findApplicationByPk.mockResolvedValue(application);

    const result = await markBusinessShiftApplicationNoShow({
      applicationId: application.id,
      ownerId: 7,
    });

    expect(result).toEqual({ application, reason: null });
    expect(application.update).toHaveBeenCalledWith(
      { status: "no_show" },
      { transaction },
    );
    expect(application.Shift.update).toHaveBeenCalledWith(
      { status: "completed" },
      { transaction },
    );
  });

  test("allows a worker to withdraw only a pending application before the shift starts", async () => {
    const application = {
      status: "pending",
      Shift: { startTime: futureDate },
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    findApplication.mockResolvedValue(application);

    const result = await cancelWorkerShiftApplication(31, 42);

    expect(result).toEqual({ application, reason: null });
    expect(application.destroy).toHaveBeenCalledTimes(1);
  });

  test("returns all workers affected by a company shift cancellation", async () => {
    const shift = { id: 15, update: jest.fn().mockResolvedValue(undefined) };
    findShiftByPk.mockResolvedValue(shift);
    findApplications.mockResolvedValue([
      { workerId: "42" },
      { workerId: 43 },
      { workerId: "42" },
    ]);

    await expect(cancelShift(15)).resolves.toEqual({
      shift,
      affectedWorkerIds: [42, 43],
      reason: null,
    });
    expect(findApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ shiftId: 15 }),
        attributes: ["workerId"],
        transaction,
      }),
    );
    expect(updateApplications).toHaveBeenCalledWith(
      { status: "rejected" },
      expect.objectContaining({ transaction }),
    );
  });

  test("does not cancel a shift that became final before its transaction lock", async () => {
    const shift = {
      id: 15,
      status: "completed",
      startTime: futureDate,
      update: jest.fn(),
    };
    findShiftByPk.mockResolvedValue(shift);

    await expect(cancelShift(15)).resolves.toEqual({
      shift: null,
      affectedWorkerIds: [],
      reason: "final",
    });
    expect(shift.update).not.toHaveBeenCalled();
    expect(updateApplications).not.toHaveBeenCalled();
  });

  test("does not allow a worker to withdraw an already approved application", async () => {
    const application = {
      status: "approved",
      Shift: { startTime: futureDate },
      destroy: jest.fn(),
    };
    findApplication.mockResolvedValue(application);

    await expect(cancelWorkerShiftApplication(31, 42)).resolves.toEqual({
      application: null,
      reason: "status",
    });
    expect(application.destroy).not.toHaveBeenCalled();
  });
});
