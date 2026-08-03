import HttpError from "../helpers/HttpError.js";

/**
 * Middleware для перевірки ролей користувача.
 * @param {...string} allowedRoles - Ролі, яким дозволено доступ ('business_client', 'admin')
 * @returns {Function} Express middleware функція
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Перевіряємо, чи є об'єкт user в запиті (чи пройшов запит через authenticate)
    if (!req.user) {
      return next(HttpError(401, "Користувач не авторизований"));
    }

    // Перевіряємо, чи роль користувача є в списку дозволених
    if (!allowedRoles.includes(req.user.role)) {
      return next(HttpError(403, "Доступ заборонено. Недостатньо прав."));
    }

    // Якщо роль підходить, пропускаємо далі
    next();
  };
};

export default checkRole;
