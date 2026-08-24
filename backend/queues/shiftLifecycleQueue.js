import { Queue } from "bullmq";
import { createBullMqConnection } from "./bullMqConnection.js";

export const SHIFT_LIFECYCLE_QUEUE = "shift-lifecycle";
export const EMAIL_VERIFICATION_JOB = "send-email-verification";

export { createBullMqConnection };

let shiftLifecycleRedis;
let shiftLifecycleQueue;

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
