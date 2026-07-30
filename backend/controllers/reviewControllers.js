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
