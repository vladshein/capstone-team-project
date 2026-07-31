import express from "express";
import * as reviewController from "../controllers/reviewControllers.js";
import validateBody from "../helpers/validateBody.js";
import { createReviewSchema } from "../schemas/reviewSchemas.js";
import authenticate from "../middlewares/authenticate.js";

const reviewRouter = express.Router();

reviewRouter.post(
  "/:shiftId",
  validateBody(createReviewSchema),
  // authenticate,
  reviewController.createReview,
);

export default reviewRouter;
