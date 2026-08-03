import Joi from "joi";

// Schema for creating a new review
export const createReviewSchema = Joi.object({
  // userId: Joi.number().integer().positive().required(),
  // shiftId: Joi.number().integer().positive().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(200).optional(),
});

// Schema for updating an existing review
export const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  comment: Joi.string().max(200).optional(),
}).min(1);

export const reviewIdParamsSchema = Joi.object({
  reviewId: Joi.string().uuid().required(),
});

export const revieweeIdParamsSchema = Joi.object({
  revieweeId: Joi.string().required(),
});
