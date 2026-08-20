import { QueryTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

const countRows = async (sql, replacements, transaction) => {
  const [{ count }] = await sequelize.query(sql, {
    replacements,
    transaction,
    type: QueryTypes.SELECT,
  });

  return Number(count);
};

const normalizeNow = (value) => {
  const now = new Date(value);
  if (Number.isNaN(now.getTime())) {
    throw new Error("Lifecycle reconciliation requires a valid date.");
  }
  return now;
};

/**
 * Приводить часові статуси до узгодженого стану.
 *
 * - pending-заявки після початку зміни → rejected;
 * - open-зміни після завершення → cancelled;
 * - booked-зміни не завершуємо автоматично: бізнес має підтвердити виконання
 *   або позначити no-show.
 *
 * dryRun дозволяє безпечно побачити майбутні зміни до запуску worker-а.
 */
export const reconcileShiftLifecycle = async ({ now: currentTime = new Date(), dryRun = false } = {}) => {
  const now = normalizeNow(currentTime);

  return sequelize.transaction(async (transaction) => {
    const expiredPendingApplications = await countRows(
      `
        SELECT COUNT(*)::int AS "count"
        FROM "shift_applications" AS "application"
        INNER JOIN "shifts" AS "shift"
          ON "shift"."id" = "application"."shiftId"
        WHERE "application"."status" = 'pending'
          AND "shift"."startTime" <= :now
      `,
      { now },
      transaction,
    );

    const expiredOpenShifts = await countRows(
      `
        SELECT COUNT(*)::int AS "count"
        FROM "shifts"
        WHERE "status" = 'open'
          AND "endTime" <= :now
      `,
      { now },
      transaction,
    );

    const bookedShiftsAwaitingDecision = await countRows(
      `
        SELECT COUNT(*)::int AS "count"
        FROM "shifts"
        WHERE "status" = 'booked'
          AND "endTime" <= :now
      `,
      { now },
      transaction,
    );

    if (!dryRun) {
      await sequelize.query(
        `
          UPDATE "shift_applications" AS "application"
          SET "status" = 'rejected'
          FROM "shifts" AS "shift"
          WHERE "shift"."id" = "application"."shiftId"
            AND "application"."status" = 'pending'
            AND "shift"."startTime" <= :now
        `,
        { replacements: { now }, transaction },
      );

      await sequelize.query(
        `
          UPDATE "shifts"
          SET "status" = 'cancelled'
          WHERE "status" = 'open'
            AND "endTime" <= :now
        `,
        { replacements: { now }, transaction },
      );
    }

    return {
      now: now.toISOString(),
      dryRun,
      expiredPendingApplications,
      expiredOpenShifts,
      bookedShiftsAwaitingDecision,
    };
  });
};
