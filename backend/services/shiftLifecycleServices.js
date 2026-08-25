import { QueryTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

// Після цього строку рішення бізнесу вже не потрібне: зміну вважаємо виконаною.
const BOOKED_SHIFT_AUTO_COMPLETION_DELAY_MS = 12 * 60 * 60 * 1000;

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

const normalizeAutoCompletedApplications = (applications) =>
  applications.map(({ shiftId, workerId }) => ({
    shiftId: Number(shiftId),
    workerId: Number(workerId),
  }));

/**
 * Приводить часові статуси до узгодженого стану.
 *
 * - pending-заявки після початку зміни → rejected;
 * - open-зміни після завершення → cancelled;
 * - booked-зміни з підтвердженим виконавцем протягом 12 годин після завершення
 *   очікують рішення бізнесу (виконано / no-show);
 * - після 12 годин booked-зміна та її підтверджена заявка → completed.
 *
 * dryRun дозволяє безпечно побачити майбутні зміни до запуску worker-а.
 */
export const reconcileShiftLifecycle = async ({
  now: currentTime = new Date(),
  dryRun = false,
} = {}) => {
  const now = normalizeNow(currentTime);
  const bookedShiftAutoCompletionCutoff = new Date(
    now.getTime() - BOOKED_SHIFT_AUTO_COMPLETION_DELAY_MS,
  );

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
        FROM "shifts" AS "shift"
        WHERE "shift"."status" = 'booked'
          AND "shift"."endTime" <= :now
          AND "shift"."endTime" > :bookedShiftAutoCompletionCutoff
          AND EXISTS (
            SELECT 1
            FROM "shift_applications" AS "application"
            WHERE "application"."shiftId" = "shift"."id"
              AND "application"."status" = 'approved'
          )
      `,
      { now, bookedShiftAutoCompletionCutoff },
      transaction,
    );

    const bookedShiftsDueForAutoCompletion = await countRows(
      `
        SELECT COUNT(*)::int AS "count"
        FROM "shifts" AS "shift"
        WHERE "shift"."status" = 'booked'
          AND "shift"."endTime" <= :bookedShiftAutoCompletionCutoff
          AND EXISTS (
            SELECT 1
            FROM "shift_applications" AS "application"
            WHERE "application"."shiftId" = "shift"."id"
              AND "application"."status" = 'approved'
          )
      `,
      { bookedShiftAutoCompletionCutoff },
      transaction,
    );

    let autoCompletedApplications = [];

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

      // Оновлюємо заявку та зміну одним SQL-виразом, щоб не лишити їх
      // у суперечливих статусах у разі помилки між двома окремими UPDATE.
      const completedApplications = await sequelize.query(
        `
          WITH "completed_applications" AS (
            UPDATE "shift_applications" AS "application"
            SET "status" = 'completed'
            FROM "shifts" AS "shift"
            WHERE "shift"."id" = "application"."shiftId"
              AND "shift"."status" = 'booked'
              AND "application"."status" = 'approved'
              AND "shift"."endTime" <= :bookedShiftAutoCompletionCutoff
            RETURNING
              "application"."shiftId" AS "shiftId",
              "application"."workerId" AS "workerId"
          ),
          "completed_shifts" AS (
            UPDATE "shifts" AS "shift"
            SET "status" = 'completed'
            WHERE "shift"."status" = 'booked'
              AND "shift"."id" IN (
                SELECT DISTINCT "shiftId"
                FROM "completed_applications"
              )
            RETURNING "shift"."id" AS "shiftId"
          )
          SELECT
            "application"."shiftId",
            "application"."workerId"
          FROM "completed_applications" AS "application"
          INNER JOIN "completed_shifts" AS "shift"
            ON "shift"."shiftId" = "application"."shiftId"
        `,
        {
          replacements: { bookedShiftAutoCompletionCutoff },
          transaction,
          type: QueryTypes.SELECT,
        },
      );

      autoCompletedApplications = normalizeAutoCompletedApplications(
        completedApplications,
      );
    }

    return {
      now: now.toISOString(),
      dryRun,
      expiredPendingApplications,
      expiredOpenShifts,
      bookedShiftsAwaitingDecision,
      bookedShiftsDueForAutoCompletion,
      autoCompletedApplications,
    };
  });
};
