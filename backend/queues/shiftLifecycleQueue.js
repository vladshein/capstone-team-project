import { Queue } from "bullmq";
import { isShiftNotificationEvent } from "../constants/shiftNotificationConstants.js";
import { createBullMqConnection } from "./bullMqConnection.js";

export const SHIFT_LIFECYCLE_QUEUE = "shift-lifecycle";
export const EMAIL_VERIFICATION_JOB = "send-email-verification";
export const PASSWORD_RESET_EMAIL_JOB = "send-password-reset";
export const SHIFT_NOTIFICATION_EMAIL_JOB = "send-shift-notification";

export { createBullMqConnection };

let shiftLifecycleRedis;
let shiftLifecycleQueue;

const isPositiveInteger = (value) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0;
};

/**
 * Одна producer-черга для невеликих фонових задач MVP. Ініціалізуємо її
 * ліниво: імпорт Express-застосунку або Jest-тестів не має одразу відкривати
 * socket до Valkey. Реальне з'єднання потрібне тільки API під час add job або
 * окремому lifecycle-worker після старту.
 */
export const getShiftLifecycleQueue = () => {
  if (!shiftLifecycleQueue) {
    shiftLifecycleRedis = createBullMqConnection();
    shiftLifecycleQueue = new Queue(SHIFT_LIFECYCLE_QUEUE, {
      connection: shiftLifecycleRedis,
    });
  }

  return shiftLifecycleQueue;
};

export const closeShiftLifecycleQueue = async () => {
  if (!shiftLifecycleQueue) return;

  await shiftLifecycleQueue.close();
  await shiftLifecycleRedis.quit();
  shiftLifecycleQueue = undefined;
  shiftLifecycleRedis = undefined;
};

/**
 * У job не передаємо email або JWT. Worker дістає актуального користувача з
 * PostgreSQL і створює короткочасний verification token безпосередньо перед
 * надсиланням.
 */
export const enqueueEmailVerification = async (userId) => {
  if (!Number.isInteger(Number(userId))) {
    throw new Error("A valid user id is required for email verification.");
  }

  return getShiftLifecycleQueue().add(
    EMAIL_VERIFICATION_JOB,
    { userId: Number(userId) },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );
};

/** Додає лише userId: чутливі дані створюються worker-ом безпосередньо перед SMTP. */
export const enqueuePasswordReset = async (userId) => {
  if (!Number.isInteger(Number(userId))) {
    throw new Error("A valid user id is required for password reset.");
  }

  return getShiftLifecycleQueue().add(
    PASSWORD_RESET_EMAIL_JOB,
    { userId: Number(userId) },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );
};

/**
 * У чергу кладемо лише ідентифікатори та тип події. Worker перед відправкою
 * повторно зчитує підтверджений email і актуальні дані зміни з PostgreSQL.
 */
export const enqueueShiftNotification = async ({
  event,
  recipientUserId,
  shiftId,
}) => {
  if (!isShiftNotificationEvent(event)) {
    throw new Error(`Unsupported shift notification event: ${event}`);
  }

  if (!isPositiveInteger(recipientUserId)) {
    throw new Error(
      "A valid recipient user id is required for shift notification.",
    );
  }

  if (!isPositiveInteger(shiftId)) {
    throw new Error("A valid shift id is required for shift notification.");
  }

  return getShiftLifecycleQueue().add(
    SHIFT_NOTIFICATION_EMAIL_JOB,
    {
      event,
      recipientUserId: Number(recipientUserId),
      shiftId: Number(shiftId),
    },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );
};
