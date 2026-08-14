import {
  Review,
  Shift,
  Company,
  Location,
  ShiftApplication,
  User,
} from "../db/models/index.js";
import HTTPError from "../helpers/HttpError.js";

const checkPermissionToModifyReview = (review, userId) => {
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
        model: Location,
        // Sequelize needs primary keys in nested includes to hydrate associated
        // models reliably. Without them `Location.Company` can be missing even
        // when the company exists, which made review creation report no owner.
        attributes: ["id", "companyId"],
        include: [{ model: Company, attributes: ["id", "ownerId"] }],
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

  const terminalApplication = applications.find(
    (application) => ["completed", "no_show"].includes(application.status),
  );

  if (!terminalApplication) {
    throw HTTPError(404, "Для цієї зміни ще немає фінального статусу виконавця.");
  }

  const companyOwnerId = shift.Location?.Company?.ownerId;
  if (!companyOwnerId) {
    throw HTTPError(404, "Власника компанії для цієї зміни не знайдено.");
  }

  return {
    user,
    shift,
    companyOwnerId,
    workerId: terminalApplication.workerId,
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

  const existingReview = await Review.findOne({ where: { shiftId, reviewerId } });
  if (existingReview) {
    throw HTTPError(409, "Ви вже залишили відгук для цієї зміни.");
  }

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
  checkPermissionToModifyReview(review, userId);
  const updatedReview = await review.update(updateData);
  return updatedReview;
};

export const deleteReview = async (reviewId, userId) => {
  const review = await getReviewById(reviewId);
  checkPermissionToModifyReview(review, userId);
  await review.destroy();
};

export const getReviewsByRevieweeId = async (revieweeId) => {
  const reviews = await Review.findAll({ where: { revieweeId } });
  return reviews;
};
