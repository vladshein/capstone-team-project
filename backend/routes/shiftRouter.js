import express from "express";
import * as shiftController from "../controllers/shiftControllers.js";
import validateBody from "../helpers/validateBody.js";
import {
  createShiftSchema,
  updateShiftSchema,
} from "../schemas/shiftSchemas.js";
import checkRole from "../middlewares/checkRole.js";
import authenticate from "../middlewares/authenticate.js";

const shiftRouter = express.Router();

/**
 * @route GET /api/shifts
 * @desc Отримати всі відкриті зміни з опціональними фільтрами (ціна, категорія) та пагінацією.
 */
shiftRouter.get("/", shiftController.getAllShifts);

/**
 * @route GET /api/shifts/worker/my-jobs
 * @desc Отримати історію взятих робіт робітником (актуальні та завершені).
 * Важливо: має стояти ПЕРЕД /:id, щоб 'worker' не сприйнялось як параметр ID
 */
shiftRouter.get(
  "/worker/my-jobs",
  authenticate,
  shiftController.getWorkerShifts,
);

/**
 * @route GET /api/shifts/:id
 * @desc Отримати детальну інформацію про конкретну зміну за її ID.
 */
shiftRouter.get("/:id", shiftController.getShiftById);

/**
 * @route POST /api/shifts
 * @desc Створити нову зміну (доступно для бізнесу/клієнтів).
 *
 * Очікує в body: locationId, positionId, categoryId, startTime, endTime, hourlyRate, [bonusRate, description]
 */
shiftRouter.post(
  "/",
  authenticate,
  checkRole("business_client", "admin"),
  validateBody(createShiftSchema),
  shiftController.createShift,
);

/**
 * @route POST /api/shifts/:id/applications
 * @desc Відгукнутися на зміну (доступно виконавцю).
 */
shiftRouter.post(
  "/:id/applications",
  authenticate,
  checkRole("worker"),
  shiftController.applyToShift,
);

/**
 * @route PATCH /api/shifts/:id
 * @desc Редагувати існуючу зміну (тільки для власника, тільки якщо статус 'open').
 */
shiftRouter.patch(
  "/:id",
  authenticate,
  checkRole("business_client", "admin"),
  validateBody(updateShiftSchema),
  shiftController.updateShift,
);

/**
 * @route PATCH /api/shifts/:id/cancel
 * @desc Скасувати зміну (тільки для власника). Змінює статус на 'cancelled'.
 */
shiftRouter.patch(
  "/:id/cancel",
  authenticate,
  checkRole("business_client", "admin"),
  shiftController.cancelShift,
);

export default shiftRouter;
