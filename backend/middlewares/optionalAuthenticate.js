import {
  hasCurrentAuthTokenFingerprint,
  verifyAccessToken,
} from "../helpers/jwt.js";
import { findUser } from "../services/authServices.js";

/**
 * Додає поточного користувача, якщо access token валідний, але не блокує гостя.
 * Використовується для публічних сторінок, де авторизованим доступні контакти.
 */
const optionalAuthenticate = async (req, _res, next) => {
  try {
    const [bearer, token] = (req.headers.authorization ?? "").split(" ");
    if (bearer !== "Bearer" || !token) return next();

    const { data, error } = verifyAccessToken(token);
    if (error) return next();

    const user = await findUser({ id: data.id });
    if (user && hasCurrentAuthTokenFingerprint(data, user.passwordHash)) {
      req.user = user;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default optionalAuthenticate;
