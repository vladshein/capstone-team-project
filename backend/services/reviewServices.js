import * as shiftServices from "./shiftServices.js";
import {
  Review,
  Shift,
  Company,
  ShiftApplication,
  User,
} from "../db/models/index.js";
import HTTPError from "../helpers/HttpError.js";

const checkPermissionToModifyReview = async (reviewId, userId) => {
  const review = await Review.findByPk(reviewId);
  if (!review) {
    throw HTTPError(404, "Відгук не знайдено.");
  }
  if (userId !== review.reviewerId) {
    throw HTTPError(403, "Ви не маєте права редагувати цей відгук.");
  }
};

const getReviewContext = async ({ userId, shiftId, rating }) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw HTTPError(404, "Користувача не знайдено.");
  }

  if (!user.role || !["worker", "business_client"].includes(user.role)) {
    throw HTTPError(403, "Ця роль не може створювати відгуки.");
  }

  if (rating < 1 || rating > 5) {
    throw HTTPError(400, "Рейтинг зміни має бути від 1 до 5.");
  }

  const shift = await Shift.findOne({
    where: { id: shiftId },
    include: [
      {
        model: Company,
        attributes: ["ownerId"],
      },
      {
        model: ShiftApplication,
        attributes: ["workerId", "status"],
      },
    ],
  });

  if (!shift) {
    throw HTTPError(404, "Зміна не знайдена.");
  }

  if (shift.status !== "completed") {
    throw HTTPError(
      400,
      "Ви можете створити відгук лише для завершеної зміни.",
    );
  }

  const applications = shift.ShiftApplications;

  if (!applications || applications.length === 0) {
    throw HTTPError(
      404,
      "Заявку на цю зміну не знайдено. Неможливо створити відгук.",
    );
  }

  const completedApplication = applications.find(
    (application) => application.status === "completed",
  );

  if (!completedApplication) {
    throw HTTPError(404, "Виконавця, який завершив цю зміну, не знайдено.");
  }

  return {
    user,
    shift,
    companyOwnerId: shift.Company.ownerId,
    workerId: completedApplication.workerId,
  };
};

const resolveReviewDirection = ({ user, companyOwnerId, workerId }) => {
  if (user.role === "business_client") {
    if (user.id !== companyOwnerId) {
      throw HTTPError(
        403,
        "Лише власник компанії може створювати відгук на виконавця.",
      );
    }

    return {
      reviewerId: companyOwnerId,
      revieweeId: workerId,
    };
  }

  if (user.role === "worker") {
    if (user.id !== workerId) {
      throw HTTPError(
        403,
        "Лише виконавець цієї зміни може створювати відгук на компанію.",
      );
    }

    return {
      reviewerId: workerId,
      revieweeId: companyOwnerId,
    };
  }

  throw HTTPError(403, "Ця роль не може створювати відгуки.");
};

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
  const { user, companyOwnerId, workerId } = await getReviewContext({
    userId,
    shiftId,
    rating,
  });

  const { reviewerId, revieweeId } = resolveReviewDirection({
    user,
    companyOwnerId,
    workerId,
  });

  const newReview = await Review.create({
    reviewerId,
    shiftId,
    revieweeId,
    rating,
    comment,
  });

  return newReview;
};

export const updateReview = async (reviewId, userId, updateData) => {
  const review = await getReviewById(reviewId);
  await checkPermissionToModifyReview(reviewId, userId);
  if (!updateData.rating) {
    if (updateData.rating < 1 || updateData.rating > 5) {
      throw HTTPError(400, "Рейтинг зміни має бути від 1 до 5.");
    }
  }
  const updatedReview = await review.update(updateData);
  return updatedReview;
};

export const deleteReview = async (reviewId, userId) => {
  const review = await getReviewById(reviewId);
  await checkPermissionToModifyReview(reviewId, userId);
  await review.destroy();
};

export const getReviewsByRevieweeId = async (revieweeId) => {
  const reviews = await Review.findAll({ where: { revieweeId } });
  return reviews;
};
