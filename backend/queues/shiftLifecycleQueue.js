import { Queue } from "bullmq";
import IORedis from "ioredis";

export const SHIFT_LIFECYCLE_QUEUE = "shift-lifecycle";

const redisPort = Number(process.env.REDIS_PORT ?? 6379);

if (!Number.isInteger(redisPort) || redisPort < 1) {
  throw new Error("REDIS_PORT must be a positive integer.");
}

export const createBullMqConnection = () =>
  new IORedis({
    host: process.env.REDIS_HOST || "valkey",
    port: redisPort,
    // Вимога BullMQ для worker-процесів.
    maxRetriesPerRequest: null,
  });

/** Спільна producer-черга для фонової синхронізації статусів змін. */
export const shiftLifecycleRedis = createBullMqConnection();

export const shiftLifecycleQueue = new Queue(SHIFT_LIFECYCLE_QUEUE, {
  connection: shiftLifecycleRedis,
});
