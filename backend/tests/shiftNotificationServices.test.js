import { jest } from "@jest/globals";

const findUser = jest.fn();
const findShiftByPk = jest.fn();
const findApplications = jest.fn();

jest.unstable_mockModule("../db/models/index.js", () => ({
  User: { findOne: findUser },
  Shift: { findByPk: findShiftByPk },
  ShiftApplication: { findAll: findApplications },
  Company: {},
  JobPosition: {},
  Location: {},
}));

const { getShiftNotificationAudience, getShiftNotificationRecipient } =
  await import("../services/shiftNotificationServices.js");

const createShift = (overrides = {}) => ({
  id: 19,
  startTime: "2026-08-25T09:00:00.000Z",
  endTime: "2026-08-25T17:00:00.000Z",
  JobPosition: { title: "Касир" },
  Location: {
    title: "ТРЦ Small",
    city: "Вінниця",
    address: "проспект Юності, 18",
    Company: { name: "ТОВ ТЕСТ 2", ownerId: 1241 },
  },
  ...overrides,
});

describe("shift notification services", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("resolves a verified recipient and fresh shift context from the database", async () => {
    findUser.mockResolvedValue({ id: 7, email: "worker@example.com" });
    findShiftByPk.mockResolvedValue(createShift());

    await expect(
      getShiftNotificationRecipient({ recipientUserId: "7", shiftId: "19" }),
    ).resolves.toEqual({
      email: "worker@example.com",
      shift: {
        id: 19,
        title: "Касир",
        companyName: "ТОВ ТЕСТ 2",
        locationTitle: "ТРЦ Small",
        city: "Вінниця",
        address: "проспект Юності, 18",
        startTime: "2026-08-25T09:00:00.000Z",
        endTime: "2026-08-25T17:00:00.000Z",
      },
    });

    expect(findUser).toHaveBeenCalledWith({
      where: { id: 7, isVerified: true },
      attributes: ["id", "email"],
    });
    expect(findShiftByPk).toHaveBeenCalledWith(
      19,
      expect.objectContaining({
        attributes: ["id", "startTime", "endTime"],
      }),
    );
  });

  test("skips delivery when the recipient is absent or email is not verified", async () => {
    findUser.mockResolvedValue(null);
    findShiftByPk.mockResolvedValue(createShift());

    await expect(
      getShiftNotificationRecipient({ recipientUserId: 7, shiftId: 19 }),
    ).resolves.toBeNull();
  });

  test("skips delivery for a shift with incomplete email context", async () => {
    findUser.mockResolvedValue({ id: 7, email: "worker@example.com" });
    findShiftByPk.mockResolvedValue(createShift({ Location: null }));

    await expect(
      getShiftNotificationRecipient({ recipientUserId: 7, shiftId: 19 }),
    ).resolves.toBeNull();
  });

  test("returns the company owner and unique approved workers for lifecycle notifications", async () => {
    findShiftByPk.mockResolvedValue({
      id: 19,
      Location: { Company: { ownerId: "1241" } },
    });
    findApplications.mockResolvedValue([
      { workerId: "7" },
      { workerId: 8 },
      { workerId: 7 },
      { workerId: null },
    ]);

    await expect(getShiftNotificationAudience(19)).resolves.toEqual({
      companyOwnerId: 1241,
      workerIds: [7, 8],
    });
    expect(findApplications).toHaveBeenCalledWith({
      where: { shiftId: 19, status: "approved" },
      attributes: ["workerId"],
      raw: true,
    });
  });

  test("can resolve completed workers after lifecycle auto-completion", async () => {
    findShiftByPk.mockResolvedValue({
      id: 19,
      Location: { Company: { ownerId: "1241" } },
    });
    findApplications.mockResolvedValue([{ workerId: "7" }]);

    await expect(
      getShiftNotificationAudience(19, { applicationStatuses: ["completed"] }),
    ).resolves.toEqual({
      companyOwnerId: 1241,
      workerIds: [7],
    });
    expect(findApplications).toHaveBeenCalledWith({
      where: { shiftId: 19, status: "completed" },
      attributes: ["workerId"],
      raw: true,
    });
  });

  test("does not query applications when the shift is absent", async () => {
    findShiftByPk.mockResolvedValue(null);

    await expect(getShiftNotificationAudience(19)).resolves.toBeNull();
    expect(findApplications).not.toHaveBeenCalled();
  });

  test("rejects invalid IDs before accessing the database", async () => {
    await expect(
      getShiftNotificationRecipient({ recipientUserId: 0, shiftId: 19 }),
    ).rejects.toThrow("recipientUserId must be a positive integer.");
    await expect(getShiftNotificationAudience("invalid")).rejects.toThrow(
      "shiftId must be a positive integer.",
    );

    expect(findUser).not.toHaveBeenCalled();
    expect(findShiftByPk).not.toHaveBeenCalled();
  });
});
