import * as reviewService from "../services/reviewServices.js";

export const createReview = async (req, res, next) => {
  try {
    const userId = req.user?.id || 4;
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

export const getReviewsByShiftId = async (req, res, next) => {
  try {
    const shiftId = parseInt(req.params.shiftId, 10);
    const reviews = await reviewService.getReviewsByShiftId(shiftId);

    res.status(200).json({
      message: "Відгуки успішно отримано",
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
