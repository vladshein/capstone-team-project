import { WorkerProfile, User, Wallet } from "../db/models/index.js";

/**
 * Отримує профіль робітника разом з його гаманцем та базовими даними юзера.
 * Цей об'єкт ідеально підходить для відмальовування "Особистого кабінету".
 */
export const getProfileByUserId = async (userId) => {
  return await WorkerProfile.findOne({
    where: { userId },
    include: [
      {
        model: User,
        attributes: ["phone", "email", "isVerified"],
      },
    ],
  });
};

/** Повертає лише безпечні для публічного профілю дані виконавця. */
export const getPublicProfileByUserId = async (userId, { includePhone = false } = {}) => {
  const profile = await WorkerProfile.findOne({
    where: { userId },
    attributes: ["id", "userId", "firstName", "lastName", "rating", "avatarUrl", "description"],
    include: [{
      model: User,
      attributes: ["id", "avatar", ...(includePhone ? ["phone"] : [])],
    }],
  });

  if (!profile) {
    const error = new Error("Профіль виконавця не знайдено");
    error.status = 404;
    throw error;
  }

  return profile;
};

/**
 * Створює новий профіль. Перевіряє, чи не існує він вже (зв'язок 1:1).
 */
export const createProfile = async (userId, profileData) => {
  // Перевіряємо, чи вже є анкета
  const existingProfile = await WorkerProfile.findOne({ where: { userId } });
  if (existingProfile) {
    const error = new Error("Профіль для цього користувача вже існує");
    error.status = 400;
    throw error;
  }

  // Перевірка на унікальність ІПН
  if (profileData.taxNumber) {
    const existingTax = await WorkerProfile.findOne({
      where: { taxNumber: profileData.taxNumber },
    });
    if (existingTax) {
      const error = new Error("Цей ІПН вже зареєстровано в системі");
      error.status = 409; // Conflict
      throw error;
    }
  }

  // Створюємо профіль, прив'язуючи його до userId
  return await WorkerProfile.create({
    userId,
    ...profileData,
  });
};

/**
 * Оновлює існуючий профіль робітника.
 */
export const updateProfile = async (userId, updateData) => {
  const profile = await WorkerProfile.findOne({ where: { userId } });

  if (!profile) {
    const error = new Error("Профіль не знайдено. Спочатку створіть його.");
    error.status = 404;
    throw error;
  }

  // Якщо користувач намагається змінити ІПН, перевіряємо його унікальність
  if (updateData.taxNumber && updateData.taxNumber !== profile.taxNumber) {
    const existingTax = await WorkerProfile.findOne({
      where: { taxNumber: updateData.taxNumber },
    });
    if (existingTax) {
      const error = new Error(
        "Цей ІПН вже використовується іншим користувачем",
      );
      error.status = 409;
      throw error;
    }
  }

  return await profile.update(updateData);
};
