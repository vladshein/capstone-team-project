import * as workerProfileService from "../services/workerProfileServices.js";

export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await workerProfileService.getProfileByUserId(userId);

    if (!profile) {
      return res.status(404).json({ message: "Профіль ще не створено" });
    }

    res.status(200).json({
      message: "Профіль успішно отримано",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const createMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Перевіряємо роль, щоб бізнес не міг створити анкету робітника
    if (req.user.role !== "worker") {
      const error = new Error("Тільки робітники можуть створювати цей профіль");
      error.status = 403;
      throw error;
    }

    const newProfile = await workerProfileService.createProfile(
      userId,
      req.body,
    );

    res.status(201).json({
      message: "Профіль робітника успішно створено",
      data: newProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updatedProfile = await workerProfileService.updateProfile(
      userId,
      req.body,
    );

    res.status(200).json({
      message: "Профіль успішно оновлено",
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};
