import { Worker } from "bullmq";
import sequelize from "../db/sequelize.js";
import { reconcileShiftLifecycle } from "../services/shiftLifecycleServices.js";
import {
  createBullMqConnection,
  SHIFT_LIFECYCLE_QUEUE,
  shiftLifecycleQueue,
  shiftLifecycleRedis,
} from "../queues/shiftLifecycleQueue.js";

const RECONCILE_JOB = "reconcile-shifts";
const SCHEDULER_ID = "reconcile-shifts-every-five-minutes";
const INTERVAL_MS = 5 * 60 * 1000;

await sequelize.authenticate();
await shiftLifecycleQueue.waitUntilReady();

const worker = new Worker(
  SHIFT_LIFECYCLE_QUEUE,
  async (job) => {
    if (job.name !== RECONCILE_JOB) {
      throw new Error(`Unknown lifecycle job: ${job.name}`);
    }

    const result = await reconcileShiftLifecycle();
    console.info("[shift-lifecycle] reconciliation completed", result);
    return result;
  },
  {
    connection: createBullMqConnection(),
    concurrency: 1,
  },
);

worker.on("failed", (job, error) => {
  console.error("[shift-lifecycle] reconciliation failed", {
    jobId: job?.id,
    message: error.message,
  });
});

worker.on("error", (error) => {
  console.error("[shift-lifecycle] worker error", error);
});

const jobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: true,
  removeOnFail: 50,
};

// BullMQ створює перший job під час upsert, далі — раз на п'ять хвилин.
await shiftLifecycleQueue.upsertJobScheduler(
  SCHEDULER_ID,
  { every: INTERVAL_MS },
  {
    name: RECONCILE_JOB,
    data: {},
    opts: jobOptions,
  },
);

console.info("[shift-lifecycle] worker started; interval: 5 minutes");

const shutdown = async (signal) => {
  console.info(`[shift-lifecycle] received ${signal}; shutting down`);
  await worker.close();
  await shiftLifecycleQueue.close();
  await shiftLifecycleRedis.quit();
  await sequelize.close();
  process.exit(0);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
