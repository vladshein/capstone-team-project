import { jest } from "@jest/globals";

const add = jest.fn();
const close = jest.fn();
const quit = jest.fn();
const Queue = jest.fn(() => ({ add, close }));
const createBullMqConnection = jest.fn(() => ({ quit }));

jest.unstable_mockModule("bullmq", () => ({ Queue }));
jest.unstable_mockModule("../queues/bullMqConnection.js", () => ({
  createBullMqConnection,
}));

const { enqueueShiftNotification, SHIFT_NOTIFICATION_EMAIL_JOB } =
  await import("../queues/shiftLifecycleQueue.js");

describe("shift lifecycle queue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    add.mockResolvedValue({ id: "job-id" });
  });

  test("queues a normalized shift notification payload", async () => {
    await enqueueShiftNotification({
      event: "application_created",
      recipientUserId: "1241",
      shiftId: "19",
    });

    expect(add).toHaveBeenCalledWith(
      SHIFT_NOTIFICATION_EMAIL_JOB,
      {
        event: "application_created",
        recipientUserId: 1241,
        shiftId: 19,
      },
      expect.objectContaining({
        attempts: 5,
        backoff: { type: "exponential", delay: 10_000 },
      }),
    );
  });

  test("does not enqueue unknown events or invalid identifiers", async () => {
    await expect(
      enqueueShiftNotification({
        event: "arbitrary-html",
        recipientUserId: 1241,
        shiftId: 19,
      }),
    ).rejects.toThrow("Unsupported shift notification event");
    await expect(
      enqueueShiftNotification({
        event: "application_created",
        recipientUserId: 0,
        shiftId: 19,
      }),
    ).rejects.toThrow("A valid recipient user id is required");

    expect(add).not.toHaveBeenCalled();
  });
});
