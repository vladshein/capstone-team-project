import { User } from "../db/models/index.js";
import HttpError from "../helpers/HttpError.js";

/**
 * function with universal where statement
 *
 * @param {*} where
 * @returns
 */
export const findUser = async (where) => {
  return User.findOne({ where });
};

/**
 * Current user information
 *
 * @param {*} userId
 * @returns
 */
export const getCurrentUserInfo = async (userId) => {
  return User.findOne({
    where: { id: userId },
    // У моделі User немає поля `name`; мінімальний актуальний набір полів
    // лишається придатним для внутрішнього current-user сценарію.
    attributes: ["id", "avatar", "email", "role", "isVerified"],
  });
};

/**
 * Мінімальна картка облікового запису для авторизованих сценаріїв.
 * Контактні дані не повертаються: для них є окремі публічні профілі
 * виконавця та компанії з власними правилами видимості.
 */
export const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "role", "avatar", "isVerified"],
  });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  return user;
};
