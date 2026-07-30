import * as shiftApplicationsServices from "./shiftApplicationsServices.js";
import * as shiftServices from "./shiftServices.js";
import { Review } from "../db/models/index.js";
import HTTPError from "../helpers/HttpError.js";

export const createReview = async ({ userId, shiftId, rating, comment }) => {
  // 1. Отримуємо зміну
  const shift = await shiftServices.getShiftById(shiftId);

  // 2. Перевірки бізнес-логіки
  if (!shift) {
    throw HTTPError(404, "Shift not found.");
  }

  if (shift.status !== "completed") {
    throw HTTPError(
      400,
      "Ви можете створити відгук лише для завершеної зміни.",
    );
  }

  if (rating < 1 || rating > 5) {
    throw HTTPError(400, "Рейтинг зміни має бути від 1 до 5.");
  }
  const shiftApp =
    await shiftApplicationsServices.getShiftApplicationByShiftId(shiftId);

  if (shiftApp.workerId !== userId) {
    throw HTTPError(403, "У вас немає прав створювати відгук на цій зміні.");
  }

  const newReview = await Review.create({
    reviewerId: userId,
    shiftId: shiftId,
    revieweeId: shiftId, // Assuming revieweeId is the same as shiftId for this example; adjust as needed
    rating,
    comment,
  });

  return newReview;
};
