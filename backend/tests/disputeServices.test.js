import { jest } from "@jest/globals";
import { UniqueConstraintError } from "sequelize";

const transaction = jest.fn(async (callback) => callback({ id: "tx" }));
const Dispute = {
  sequelize: { transaction },
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findAndCountAll: jest.fn(),
};
const DisputeEvent = { create: jest.fn() };
const DisputeMessage = { create: jest.fn() };
const Shift = { findByPk: jest.fn() };

jest.unstable_mockModule("../db/models/index.js", () => ({
  Company: {},
  Dispute,
  DisputeEvent,
  DisputeMessage,
  JobPosition: {},
  Location: {},
  Shift,
  ShiftApplication: {},
  User: {},
  WorkerProfile: {},
}));

const disputes = await import("../services/disputeServices.js");

const worker = { id: 11, role: "worker" };
const company = { id: 22, role: "business_client" };
const admin = { id: 33, role: "admin" };
const completedShift = (endTime = new Date().toISOString()) => ({
  status: "completed",
  endTime,
  Location: { Company: { ownerId: company.id } },
  ShiftApplications: [{ workerId: worker.id, status: "completed" }],
});
const detail = (overrides = {}) => ({
  id: 71,
  initiatorId: worker.id,
  respondentId: company.id,
  status: "open",
  ...overrides,
});
const mutableDispute = (overrides = {}) => ({
  ...detail(overrides),
  update: jest.fn().mockResolvedValue(undefined),
});

describe("dispute services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation(async (callback) => callback({ id: "tx" }));
    DisputeEvent.create.mockResolvedValue({ id: 1 });
    DisputeMessage.create.mockResolvedValue({ id: 1 });
  });

  test("creates a dispute for a completed shift within seven days", async () => {
    Shift.findByPk.mockResolvedValue(completedShift());
    Dispute.findOne.mockResolvedValue(null);
    Dispute.create.mockResolvedValue({ id: 71 });
    Dispute.findByPk.mockResolvedValue(detail());

    const result = await disputes.createDispute({
      user: worker,
      payload: {
        shiftId: 5,
        reason: "payment",
        description: "Не виплачено узгоджену суму за зміну.",
      },
    });

    expect(Dispute.create).toHaveBeenCalledWith(
      expect.objectContaining({
        shiftId: 5,
        initiatorId: worker.id,
        respondentId: company.id,
        status: "open",
      }),
      expect.any(Object),
    );
    expect(DisputeEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "created", actorId: worker.id }),
      expect.any(Object),
    );
    expect(result.id).toBe(71);
  });

  test("rejects opening a dispute more than seven days after the shift", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    Shift.findByPk.mockResolvedValue(
      completedShift(eightDaysAgo.toISOString()),
    );

    await expect(
      disputes.createDispute({
        user: worker,
        payload: {
          shiftId: 5,
          reason: "other",
          description: "Запізніле звернення",
        },
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Спір можна відкрити протягом 7 днів після завершення зміни.",
    });
    expect(Dispute.create).not.toHaveBeenCalled();
  });

  test("does not create a second active dispute for the same shift", async () => {
    Shift.findByPk.mockResolvedValue(completedShift());
    Dispute.findOne.mockResolvedValue(detail());

    await expect(
      disputes.createDispute({
        user: worker,
        payload: {
          shiftId: 5,
          reason: "other",
          description: "Повторне звернення",
        },
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Для цієї зміни вже є відкритий спір.",
    });
  });

  test("maps a concurrent unique-index violation to the same duplicate-dispute response", async () => {
    const uniqueError = new UniqueConstraintError({
      message: "duplicate active dispute",
      errors: [],
    });
    transaction.mockRejectedValueOnce(uniqueError);

    await expect(
      disputes.createDispute({
        user: worker,
        payload: {
          shiftId: 5,
          reason: "other",
          description: "Паралельне звернення",
        },
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Для цієї зміни вже є відкритий спір.",
    });
  });

  test("does not allow a user who is not a party to add a message", async () => {
    Dispute.findByPk.mockResolvedValue(detail());

    await expect(
      disputes.addMessage({
        disputeId: 71,
        user: { id: 99, role: "worker" },
        message: "Я не є стороною спору.",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(DisputeMessage.create).not.toHaveBeenCalled();
  });

  test("stores a party message without automatically sending the dispute to admin review", async () => {
    const dispute = mutableDispute({ status: "open" });
    Dispute.findByPk.mockResolvedValue(dispute);

    await disputes.addMessage({
      disputeId: 71,
      user: company,
      message: "Не погоджуємося, пояснення надано нижче.",
    });

    expect(DisputeMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: company.id, disputeId: 71 }),
      expect.any(Object),
    );
    expect(dispute.update).not.toHaveBeenCalled();
  });

  test("allows only the respondent to settle a dispute and closes it", async () => {
    const dispute = mutableDispute();
    Dispute.findByPk
      .mockResolvedValueOnce(dispute)
      .mockResolvedValueOnce(detail({ status: "closed" }));

    const result = await disputes.settleDispute({
      disputeId: 71,
      user: company,
    });

    expect(dispute.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "closed",
        resolvedAt: expect.any(Date),
      }),
      expect.any(Object),
    );
    expect(DisputeEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "settled_by_parties",
        actorId: company.id,
      }),
      expect.any(Object),
    );
    expect(result.status).toBe("closed");

    Dispute.findByPk.mockResolvedValue(detail());
    await expect(
      disputes.settleDispute({ disputeId: 71, user: worker }),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  test("allows a party to appeal an admin decision and reopens review", async () => {
    const dispute = mutableDispute({ status: "resolved" });
    Dispute.findByPk
      .mockResolvedValueOnce(dispute)
      .mockResolvedValueOnce(detail({ status: "appealed" }));

    const result = await disputes.appealDispute({
      disputeId: 71,
      user: worker,
      message: "Прошу переглянути суму та обґрунтування рішення.",
    });

    expect(DisputeMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: worker.id }),
      expect.any(Object),
    );
    expect(dispute.update).toHaveBeenCalledWith(
      { status: "appealed", resolvedAt: null },
      expect.any(Object),
    );
    expect(result.status).toBe("appealed");
  });

  test("stores an admin decision for a dispute in review", async () => {
    const dispute = mutableDispute({ status: "under_review" });
    Dispute.findByPk
      .mockResolvedValueOnce(dispute)
      .mockResolvedValueOnce(detail({ status: "resolved" }));

    const result = await disputes.resolveDispute({
      disputeId: 71,
      adminId: admin.id,
      payload: {
        decision: "pay_worker_partial",
        resolvedAmount: 200,
        adminComment: "Підтверджено частину вимог виконавця.",
      },
    });

    expect(dispute.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "resolved",
        assignedAdminId: admin.id,
        resolvedAt: expect.any(Date),
      }),
      expect.any(Object),
    );
    expect(DisputeEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "resolved", actorId: admin.id }),
      expect.any(Object),
    );
    expect(result.status).toBe("resolved");
  });
});
