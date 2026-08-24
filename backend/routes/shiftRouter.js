import express from "express";
import * as shiftController from "../controllers/shiftControllers.js";
import validateBody from "../helpers/validateBody.js";
import {
  createShiftSchema,
  updateShiftSchema,
} from "../schemas/shiftSchemas.js";
import checkRole from "../middlewares/checkRole.js";
import authenticate from "../middlewares/authenticate.js";
import requireVerifiedEmail from "../middlewares/requireVerifiedEmail.js";

const shiftRouter = express.Router();

/**
 * @route GET /api/shifts
 * @desc Отримати всі відкриті зміни з опціональними фільтрами (ціна, категорія) та пагінацією.
 */
shiftRouter.get("/", shiftController.getAllShifts);

/**
 * @route GET /api/shifts/map
 * @desc Мінімальні дані для маркерів карти без пагінації списку.
 */
shiftRouter.get("/map", shiftController.getShiftMapMarkers);

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

// Має бути перед /:id, інакше "business" стане значенням параметра id.
shiftRouter.get(
  "/business/my-shifts",
  authenticate,
  checkRole("business_client", "admin"),
  shiftController.getBusinessShifts,
);

/** @route GET /api/shifts/business/applications?companyId=:id */
shiftRouter.get(
  "/business/applications",
  authenticate,
  checkRole("business_client", "admin"),
  shiftController.getBusinessShiftApplications,
);

shiftRouter.get(
  "/business/shifts/:id/worker",
  authenticate,
  checkRole("business_client", "admin"),
  shiftController.getBusinessShiftWorkerSummary,
);

/** @route PATCH /api/shifts/applications/:applicationId/status */
shiftRouter.patch(
  "/applications/:applicationId/status",
  authenticate,
  checkRole("business_client", "admin"),
  requireVerifiedEmail,
  shiftController.decideBusinessShiftApplication,
);

/** @route PATCH /api/shifts/applications/:applicationId/complete */
shiftRouter.patch(
  "/applications/:applicationId/complete",
  authenticate,
  checkRole("business_client", "admin"),
  requireVerifiedEmail,
  shiftController.completeBusinessShiftApplication,
);

/** @route PATCH /api/shifts/applications/:applicationId/no-show */
shiftRouter.patch(
  "/applications/:applicationId/no-show",
  authenticate,
  checkRole("business_client", "admin"),
  requireVerifiedEmail,
  shiftController.markBusinessShiftApplicationNoShow,
);

/** @route DELETE /api/shifts/applications/:applicationId */
shiftRouter.delete(
  "/applications/:applicationId",
  authenticate,
  checkRole("worker"),
  shiftController.cancelWorkerApplication,
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
  requireVerifiedEmail,
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
  requireVerifiedEmail,
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
  requireVerifiedEmail,
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
  requireVerifiedEmail,
  shiftController.cancelShift,
);

export default shiftRouter;
