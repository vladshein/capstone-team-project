import express from "express";
import * as reviewController from "../controllers/reviewControllers.js";
import validateBody from "../helpers/validateBody.js";
import { validateParams } from "../helpers/validateFunctions.js";
import {
  createReviewSchema,
  reviewIdParamsSchema,
  updateReviewSchema,
  revieweeIdParamsSchema,
} from "../schemas/reviewSchemas.js";
import authenticate from "../middlewares/authenticate.js";

const reviewRouter = express.Router();

reviewRouter.get(
  "/:revieweeId",
  validateParams(revieweeIdParamsSchema),
  authenticate,
  reviewController.getReviewsByRevieweeId,
);

reviewRouter.post(
  "/:shiftId",
  validateBody(createReviewSchema),
  authenticate,
  reviewController.createReview,
);

reviewRouter.patch(
  "/:reviewId",
  validateParams(reviewIdParamsSchema),
  validateBody(updateReviewSchema),
  authenticate,
  reviewController.updateReview,
);

reviewRouter.delete(
  "/:reviewId",
  validateParams(reviewIdParamsSchema),
  authenticate,
  reviewController.deleteReview,
);

export default reviewRouter;
