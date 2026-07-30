import express from "express";
import * as shiftController from "../controllers/shiftControllers.js";

const shiftRouter = express.Router();

/**
 * @route GET /api/shifts
 * @desc Get all open shifts with optional filtering (price, category) and pagination.
 */
shiftRouter.get("/", shiftController.getAllShifts);

/**
 * @route POST /api/shifts
 * @desc Post shift.
 */
// shiftRouter.post("/", shiftController.postShift);

/**
 * @route GET /api/shifts/:id
 * @desc Get detailed information about a specific shift by its ID.
 */
shiftRouter.get("/:id", shiftController.getShiftById);

export default shiftRouter;
