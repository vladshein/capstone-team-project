import Joi from "joi";

// Schema for creating a new review
export const createReviewSchema = Joi.object({
  // userId: Joi.number().integer().positive().required(),
  // shiftId: Joi.number().integer().positive().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(200).optional(),
});
