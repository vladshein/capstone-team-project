import * as shiftApplicationsServices from "./shiftApplicationsServices.js";
import * as shiftServices from "./shiftServices.js";
import { Review } from "../db/models/index.js";
import HTTPError from "../helpers/HttpError.js";

export const getReviewById = async (reviewId) => {
  const review = await Review.findByPk(reviewId);
  if (!review) {
    throw HTTPError(404, "Review not found.");
  }
  return review;
};

export const getReviewsByShiftId = async (shiftId) => {
  const reviews = await Review.findAll({ where: { shiftId } });
  return reviews;
};

export const createReview = async ({ userId, shiftId, rating, comment }) => {
  // Check if the shift exists and is completed
  const shift = await shiftServices.getShiftById(shiftId);
  if (!shift) {
    throw HTTPError(404, "Shift not found.");
  }
  if (shift.status !== "completed") {
    throw HTTPError(
      400,
      "Ви можете створити відгук лише для завершеної зміни.",
    );
  }

  // Check if the user has already left a review for this shift
  const reviews = await getReviewsByShiftId(shiftId);
  if (
    reviews.length > 0 &&
    reviews.some((review) => review.reviewerId === userId)
  ) {
    throw HTTPError(400, "Ви вже залишали відгук для цієї зміни.");
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw HTTPError(400, "Рейтинг зміни має бути від 1 до 5.");
  }

  // Check if the user is authorized to create a review for this shift
  const shiftApp =
    await shiftApplicationsServices.getShiftApplicationByShiftId(shiftId);
  if (shiftApp.workerId !== userId) {
    throw HTTPError(403, "У вас немає прав створювати відгук на цій зміні.");
  }

  const newReview = await Review.create({
    reviewerId: userId,
    shiftId: shiftId,
    revieweeId: 1, // Assuming revieweeId is the same as shiftId for this example; adjust as needed
    rating,
    comment,
  });

  return newReview;
};
