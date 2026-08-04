import { User, WorkerProfile } from "../db/models/index.js";
import HttpError from "../helpers/HttpError.js";

/**
 * Get current worker's profile (User + WorkerProfile, LEFT JOIN).
 * WorkerProfile may not exist yet (filled in later, separate step after registration).
 *
 * @param {number} userId
 * @returns {Promise<object>}
 */
export const getWorkerProfile = async (userId) => {
  const user = await User.findOne({
    where: { id: userId },
    attributes: ["id", "email", "phone", "avatar", "isVerified", "role", "created_at"],
    include: {
      model: WorkerProfile,
      attributes: ["id", "firstName", "lastName", "birthDate", "taxNumber", "rating", "avatarUrl"],
      required: false, // LEFT JOIN — профіль може ще не існувати
    },
  });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  return {
    ...user.toJSON(),
    profileCompleted: Boolean(user.WorkerProfile),
  };
};

// TODO: createWorkerProfile(userId, payload)
// - POST /me/worker-profile
// - findOrCreate або явна перевірка WorkerProfile.findOne({ where: { userId } })
//   перед створенням -> якщо вже існує, throw HttpError(409, "Worker profile already exists")
// - валідація payload (firstName/lastName/birthDate обов'язкові, taxNumber unique —
//   ловити SequelizeUniqueConstraintError і мапити в HttpError(409, "Tax number already in use"))
// - birthDate: перевірити мінімальний вік (є ліміти по законодавству для трудових відносин?)

// TODO: updateWorkerProfile(userId, payload)
// - PATCH /me/worker-profile
// - WorkerProfile.findOne({ where: { userId } }) -> якщо немає, HttpError(404) —
//   "профіль ще не створено, використайте POST"
// - не дозволяти клієнту передавати/змінювати rating напряму (рейтинг рахується
//   з Review, це derived-поле — виключити з дозволених полів апдейту вручну
//   або через explicit whitelist замість сліпого Object.assign)

// TODO: avatar-поле дублюється в User.avatar і WorkerProfile.avatarUrl (є коментар
// в моделі User "duplicated in worker profile") — визначитись, яке з них джерело
// правди при відображенні профілю, і чи потрібен окремий ендпоінт /me/avatar,
// що синхронізує обидва, чи один з них варто прибрати в наступній міграції