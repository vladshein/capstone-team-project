import express from "express";
import * as controller from "../controllers/disputeControllers.js";
import authenticate from "../middlewares/authenticate.js";
import checkRole from "../middlewares/checkRole.js";
import validateBody from "../helpers/validateBody.js";
import { validateParams } from "../helpers/validateFunctions.js";
import {
  disputeIdParamsSchema,
  resolveDisputeSchema,
  updateDisputeStatusSchema,
} from "../schemas/disputeSchemas.js";

const adminDisputeRouter = express.Router();

adminDisputeRouter.use(authenticate, checkRole("admin"));
adminDisputeRouter.get("/disputes", controller.getAdminDisputes);
adminDisputeRouter.patch(
  "/disputes/:disputeId/status",
  validateParams(disputeIdParamsSchema),
  validateBody(updateDisputeStatusSchema),
  controller.updateStatus,
);
adminDisputeRouter.post(
  "/disputes/:disputeId/resolve",
  validateParams(disputeIdParamsSchema),
  validateBody(resolveDisputeSchema),
  controller.resolve,
);

export default adminDisputeRouter;
