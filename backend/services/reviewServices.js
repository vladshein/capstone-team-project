import {
  Review,
  Shift,
  JobPosition,
  Company,
  Location,
  ShiftApplication,
  User,
  WorkerProfile,
} from "../db/models/index.js";
import HTTPError from "../helpers/HttpError.js";

const checkPermissionToModifyReview = (review, userId) => {
  if (userId !== review.reviewerId) {
    throw HTTPError(403, "Ви не маєте права редагувати цей відгук.");
  }
};

/**
 * `rating` у WorkerProfile — денормалізований кеш середньої оцінки.
 * Джерелом правди лишаються reviews, тому перераховуємо значення після
 * кожної зміни відгуку. Якщо профілю виконавця немає, це відгук про бізнес.
 */
const recalculateWorkerRating = async (userId, transaction) => {
  const profile = await WorkerProfile.findOne({ where: { userId }, transaction });
  if (!profile) return;

  const result = await Review.findOne({
    where: { revieweeId: userId },
    attributes: [[Review.sequelize.fn("AVG", Review.sequelize.col("rating")), "averageRating"]],
    raw: true,
    transaction,
  });
  const averageRating = Number(result?.averageRating);

  await profile.update(
    { rating: Number.isFinite(averageRating) ? Math.round(averageRating * 100) / 100 : 0 },
    { transaction },
  );
};

const getReviewContext = async ({ userId, shiftId, rating, transaction }) => {
  const user = await User.findByPk(userId, { transaction });

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
    transaction,
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
  return Review.sequelize.transaction(async (transaction) => {
    const { user, companyOwnerId, workerId } = await getReviewContext({
      userId,
      shiftId,
      rating,
      transaction,
    });

    const { reviewerId, revieweeId } = resolveReviewDirection({
      user,
      companyOwnerId,
      workerId,
    });

    const existingReview = await Review.findOne({
      where: { shiftId, reviewerId },
      transaction,
    });
    if (existingReview) {
      throw HTTPError(409, "Ви вже залишили відгук для цієї зміни.");
    }

    const newReview = await Review.create({
      reviewerId,
      shiftId,
      revieweeId,
      rating,
      comment,
    }, { transaction });

    await recalculateWorkerRating(revieweeId, transaction);
    return newReview;
  });
};

export const updateReview = async (reviewId, userId, updateData) => {
  return Review.sequelize.transaction(async (transaction) => {
    const review = await Review.findByPk(reviewId, { transaction });
    if (!review) throw HTTPError(404, "Відгук не знайдено.");
    checkPermissionToModifyReview(review, userId);
    const updatedReview = await review.update(updateData, { transaction });
    await recalculateWorkerRating(review.revieweeId, transaction);
    return updatedReview;
  });
};

export const deleteReview = async (reviewId, userId) => {
  await Review.sequelize.transaction(async (transaction) => {
    const review = await Review.findByPk(reviewId, { transaction });
    if (!review) throw HTTPError(404, "Відгук не знайдено.");
    checkPermissionToModifyReview(review, userId);
    const revieweeId = review.revieweeId;
    await review.destroy({ transaction });
    await recalculateWorkerRating(revieweeId, transaction);
  });
};

export const getReviewsByRevieweeId = async (
  revieweeId,
  { page = 1, limit = 5, companyId } = {},
) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Review.findAndCountAll({
    where: { revieweeId },
    // У моделі timestamp мапиться на фізичну колонку created_at.
    attributes: ["id", "rating", "comment", ["created_at", "createdAt"]],
    include: [
      {
        model: Shift,
        attributes: ["id", "startTime"],
        include: [
          { model: JobPosition, attributes: ["title"] },
          {
            model: Location,
            attributes: ["id"],
            required: Boolean(companyId),
            include: [{
              model: Company,
              attributes: ["name", "avatar"],
              where: companyId ? { id: companyId } : undefined,
              required: Boolean(companyId),
            }],
          },
        ],
      },
      {
        model: User,
        as: "Reviewer",
        attributes: ["id", "avatar"],
        include: [{
          model: WorkerProfile,
          attributes: ["firstName", "lastName", "avatarUrl"],
        }],
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return {
    data: rows,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  };
};
