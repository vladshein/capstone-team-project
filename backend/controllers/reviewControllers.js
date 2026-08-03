import * as reviewService from "../services/reviewServices.js";

export const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const shiftId = parseInt(req.params.shiftId, 10);
    const { rating, comment } = req.body;

    const newReview = await reviewService.createReview({
      userId,
      shiftId,
      rating,
      comment,
    });

    res.status(201).json({
      message: "Відгук успішно створено",
      data: newReview,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    // Review primary keys are UUIDs. Converting them to numbers makes
    // PostgreSQL compare a UUID column to an integer.
    const { reviewId } = req.validatedParams;
    const userId = req.user.id;

    const updatedReview = await reviewService.updateReview(
      reviewId,
      userId,
      req.body,
    );

    res.status(200).json({
      message: "Відгук успішно оновлено",
      data: updatedReview,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.validatedParams;
    const userId = req.user.id;

    await reviewService.deleteReview(reviewId, userId);

    res.status(200).json({
      message: "Відгук успішно видалено",
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewsByShiftId = async (req, res, next) => {
  try {
    const { shiftId } = req.validatedParams;
    const reviews = await reviewService.getReviewsByShiftId(shiftId);

    res.status(200).json({
      message: "Відгуки успішно отримано",
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewsByRevieweeId = async (req, res, next) => {
  try {
    const { revieweeId } = req.validatedParams;
    const reviews = await reviewService.getReviewsByRevieweeId(revieweeId);
    res.status(200).json({
      message: "Відгуки успішно отримано",
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
