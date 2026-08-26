import IORedis from "ioredis";

const redisPort = Number(process.env.REDIS_PORT ?? 6379);

if (!Number.isInteger(redisPort) || redisPort < 1) {
  throw new Error("REDIS_PORT must be a positive integer.");
}

/**
 * Створює окреме підключення для BullMQ producer або worker.
 *
 * BullMQ вимагає maxRetriesPerRequest: null для worker-процесів. Винесення
 * фабрики в окремий файл дозволяє всім чергам використовувати однакову
 * конфігурацію без дублювання.
 */
export const createBullMqConnection = () =>
  new IORedis({
    host: process.env.REDIS_HOST || "valkey",
    port: redisPort,
    maxRetriesPerRequest: null,
  });
