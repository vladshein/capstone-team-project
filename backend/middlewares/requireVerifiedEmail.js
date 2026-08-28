import HttpError from "../helpers/HttpError.js";

/**
 * Дозволяє виконувати значущі дії лише після підтвердження email.
 * authenticate вже завантажує актуального користувача з БД у req.user,
 * тому додатковий запит до бази тут не потрібен.
 */
const requireVerifiedEmail = (req, _res, next) => {
  if (!req.user) {
    return next(HttpError(401, "Користувач не авторизований."));
  }

  if (req.user.isVerified !== true) {
    return next(
      HttpError(403, "Підтвердьте електронну пошту, щоб виконувати цю дію."),
    );
  }

  return next();
};

export default requireVerifiedEmail;
