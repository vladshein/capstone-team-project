import express from "express";
import * as shiftController from "../controllers/shiftControllers.js";
import validateBody from "../helpers/validateBody.js";
import { createShiftSchema } from "../schemas/shiftSchemas.js";
import authenticate from "../middlewares/authenticate.js";

const shiftRouter = express.Router();

/**
 * @route GET /api/shifts
 * @desc Get all open shifts with optional filtering (price, category) and pagination.
 */
shiftRouter.get("/", shiftController.getAllShifts);

/**
 * @route GET /api/shifts/:id
 * @desc Get detailed information about a specific shift by its ID.
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
  validateBody(createShiftSchema),
  authenticate,
  shiftController.createShift,
);

export default shiftRouter;
