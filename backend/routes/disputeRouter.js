import express from "express";
import * as controller from "../controllers/disputeControllers.js";
import authenticate from "../middlewares/authenticate.js";
import checkRole from "../middlewares/checkRole.js";
import requireVerifiedEmail from "../middlewares/requireVerifiedEmail.js";
import upload from "../middlewares/upload.js";
import validateBody from "../helpers/validateBody.js";
import { validateParams } from "../helpers/validateFunctions.js";
import {
  createDisputeMessageSchema,
  createDisputeSchema,
  disputeIdParamsSchema,
} from "../schemas/disputeSchemas.js";

const disputeRouter = express.Router();

disputeRouter.use(authenticate);
disputeRouter.get("/my", controller.getMyDisputes);
disputeRouter.post(
  "/",
  checkRole("worker", "business_client"),
  requireVerifiedEmail,
  validateBody(createDisputeSchema),
  controller.createDispute,
);
disputeRouter.get(
  "/:disputeId",
  validateParams(disputeIdParamsSchema),
  controller.getDispute,
);
disputeRouter.post(
  "/:disputeId/messages",
  checkRole("worker", "business_client"),
  requireVerifiedEmail,
  validateParams(disputeIdParamsSchema),
  validateBody(createDisputeMessageSchema),
  controller.addMessage,
);
disputeRouter.post(
  "/:disputeId/evidence",
  checkRole("worker", "business_client"),
  requireVerifiedEmail,
  validateParams(disputeIdParamsSchema),
  upload.array("files", 5),
  controller.addEvidence,
);

export default disputeRouter;
