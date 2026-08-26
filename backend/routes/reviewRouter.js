import express from "express";
import * as reviewController from "../controllers/reviewControllers.js";
import validateBody from "../helpers/validateBody.js";
import { validateParams } from "../helpers/validateFunctions.js";
import {
  createReviewSchema,
  reviewIdParamsSchema,
  updateReviewSchema,
  revieweeIdParamsSchema,
  shiftIdParamsSchema,
} from "../schemas/reviewSchemas.js";
import authenticate from "../middlewares/authenticate.js";
import requireVerifiedEmail from "../middlewares/requireVerifiedEmail.js";

const reviewRouter = express.Router();

reviewRouter.get(
  "/shift/:shiftId",
  validateParams(shiftIdParamsSchema),
  authenticate,
  reviewController.getReviewsByShiftId,
);

// Відгуки — частина публічної репутації профілю; мутації нижче лишаються захищеними.
reviewRouter.get(
  "/:revieweeId",
  validateParams(revieweeIdParamsSchema),
  reviewController.getReviewsByRevieweeId,
);

reviewRouter.use(authenticate);
reviewRouter.use(requireVerifiedEmail);

reviewRouter.post(
  "/:shiftId",
  validateParams(shiftIdParamsSchema),
  validateBody(createReviewSchema),
  reviewController.createReview,
);

reviewRouter.patch(
  "/:reviewId",
  validateParams(reviewIdParamsSchema),
  validateBody(updateReviewSchema),
  reviewController.updateReview,
);

reviewRouter.delete(
  "/:reviewId",
  validateParams(reviewIdParamsSchema),
  reviewController.deleteReview,
);

export default reviewRouter;
