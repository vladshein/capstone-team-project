import { Worker } from "bullmq";
import sequelize from "../db/sequelize.js";
import { getDisputeNotificationRecipient } from "../services/disputeNotificationServices.js";
import {
  getEmailVerificationRecipient,
  getPasswordResetRecipient,
} from "../services/authServices.js";
import {
  getShiftNotificationAudience,
  getShiftNotificationRecipient,
} from "../services/shiftNotificationServices.js";
import {
  sendPasswordResetEmail,
  sendDisputeNotificationEmail,
  sendShiftNotificationEmail,
  sendVerificationEmail,
} from "../services/emailService.js";
import { reconcileShiftLifecycle } from "../services/shiftLifecycleServices.js";
import {
  createBullMqConnection,
  closeShiftLifecycleQueue,
  DISPUTE_NOTIFICATION_EMAIL_JOB,
  EMAIL_VERIFICATION_JOB,
  enqueueShiftNotification,
  getShiftLifecycleQueue,
  PASSWORD_RESET_EMAIL_JOB,
  SHIFT_NOTIFICATION_EMAIL_JOB,
  SHIFT_LIFECYCLE_QUEUE,
} from "../queues/shiftLifecycleQueue.js";

const RECONCILE_JOB = "reconcile-shifts";
const SCHEDULER_ID = "reconcile-shifts-every-five-minutes";
const INTERVAL_MS = 5 * 60 * 1000;

// Lifecycle уже завершив транзакцію до цього моменту. Якщо Valkey тимчасово
// недоступний, не повторюємо reconciliation і не ризикуємо дублювати зміни
// статусів — лише фіксуємо збій постановки листа в чергу.
const queueAutoCompletionNotifications = async (
  autoCompletedApplications = [],
) => {
  const jobs = autoCompletedApplications.map(async ({ shiftId, workerId }) => {
    const audience = await getShiftNotificationAudience(shiftId, {
      applicationStatuses: ["completed"],
    });
    const recipientUserIds = new Set([
      workerId,
      audience?.companyOwnerId,
      ...(audience?.workerIds ?? []),
    ]);

    await Promise.all(
      [...recipientUserIds]
        .filter((recipientUserId) => {
          const normalizedRecipientUserId = Number(recipientUserId);
          return (
            Number.isInteger(normalizedRecipientUserId) &&
            normalizedRecipientUserId > 0
          );
        })
        .map((recipientUserId) =>
          enqueueShiftNotification({
            event: "application_auto_completed",
            recipientUserId,
            shiftId,
          }),
        ),
    );
  });

  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "[shift-lifecycle] failed to enqueue auto-completion email",
        {
          message: result.reason?.message ?? String(result.reason),
        },
      );
    }
  }
};

await sequelize.authenticate();
const shiftLifecycleQueue = getShiftLifecycleQueue();
await shiftLifecycleQueue.waitUntilReady();

const worker = new Worker(
  SHIFT_LIFECYCLE_QUEUE,
  async (job) => {
    if (job.name === RECONCILE_JOB) {
      const result = await reconcileShiftLifecycle();
      await queueAutoCompletionNotifications(result.autoCompletedApplications);
      console.info("[shift-lifecycle] reconciliation completed", result);
      return result;
    }

    if (job.name === EMAIL_VERIFICATION_JOB) {
      const recipient = await getEmailVerificationRecipient(job.data.userId);

      // Користувач міг уже підтвердити адресу, поки job чекав у Valkey.
      if (!recipient) {
        return { status: "skipped", userId: job.data.userId };
      }

      await sendVerificationEmail(recipient);
      return { status: "sent", userId: job.data.userId };
    }

    if (job.name === PASSWORD_RESET_EMAIL_JOB) {
      const recipient = await getPasswordResetRecipient(job.data.userId);

      // Акаунт міг бути видалений, поки завдання чекало в черзі.
      if (!recipient) {
        return { status: "skipped", userId: job.data.userId };
      }

      await sendPasswordResetEmail(recipient);
      return { status: "sent", userId: job.data.userId };
    }

    if (job.name === SHIFT_NOTIFICATION_EMAIL_JOB) {
      const recipient = await getShiftNotificationRecipient(job.data);

      // За час очікування job користувач міг відписатися/не підтвердити email,
      // а зміна або її обов'язковий контекст — бути видаленими.
      if (!recipient) {
        return {
          status: "skipped",
          event: job.data.event,
          recipientUserId: job.data.recipientUserId,
          shiftId: job.data.shiftId,
        };
      }

      await sendShiftNotificationEmail({
        event: job.data.event,
        ...recipient,
      });

      return {
        status: "sent",
        event: job.data.event,
        recipientUserId: job.data.recipientUserId,
        shiftId: job.data.shiftId,
      };
    }

    if (job.name === DISPUTE_NOTIFICATION_EMAIL_JOB) {
      const recipient = await getDisputeNotificationRecipient(job.data);
      if (!recipient) {
        return {
          status: "skipped",
          event: job.data.event,
          recipientUserId: job.data.recipientUserId,
          disputeId: job.data.disputeId,
        };
      }

      await sendDisputeNotificationEmail({
        event: job.data.event,
        ...recipient,
      });
      return {
        status: "sent",
        event: job.data.event,
        recipientUserId: job.data.recipientUserId,
        disputeId: job.data.disputeId,
      };
    }

    throw new Error(`Unknown background job: ${job.name}`);
  },
  {
    connection: createBullMqConnection(),
    concurrency: 1,
  },
);

worker.on("failed", (job, error) => {
  console.error("[shift-lifecycle] job failed", {
    jobId: job?.id,
    name: job?.name,
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
  await closeShiftLifecycleQueue();
  await sequelize.close();
  process.exit(0);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
