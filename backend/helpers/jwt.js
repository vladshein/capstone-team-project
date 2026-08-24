import jwt from "jsonwebtoken";
import { createHmac } from "node:crypto";

const {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EMAIL_VERIFICATION_SECRET,
  JWT_PASSWORD_RESET_SECRET,
} = process.env;
const EMAIL_VERIFICATION_PURPOSE = "email-verification";
const PASSWORD_RESET_PURPOSE = "password-reset";

export const createAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
};

export const createRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

/**
 * Не використовуємо access/refresh JWT у листі: вони мають інше призначення
 * та не повинні потрапляти в URL. Verification token живе лише 24 години.
 */
export const createEmailVerificationToken = ({ id }) =>
  jwt.sign({ id, purpose: EMAIL_VERIFICATION_PURPOSE }, JWT_EMAIL_VERIFICATION_SECRET, {
    expiresIn: "24h",
  });

// Хеш поточного пароля не потрапляє в JWT. Він лише бере участь у формуванні
// ключа підпису: після зміни пароля всі раніше надіслані reset-посилання
// автоматично стають недійсними без збереження токенів у БД.
const getPasswordResetSigningKey = (passwordHash) =>
  createHmac("sha256", JWT_PASSWORD_RESET_SECRET).update(passwordHash).digest("hex");

export const createPasswordResetToken = ({ id, passwordHash }) =>
  jwt.sign(
    { id, purpose: PASSWORD_RESET_PURPOSE },
    getPasswordResetSigningKey(passwordHash),
    { expiresIn: "15m" },
  );

const verifyWith = (token, secret) => {
  try {
    const data = jwt.verify(token, secret);
    return { data, error: null };
  } catch (error) {
    return { error, data: null };
  }
};

export const verifyAccessToken = (token) => verifyWith(token, JWT_SECRET);
export const verifyRefreshToken = (token) => verifyWith(token, JWT_REFRESH_SECRET);

export const verifyEmailVerificationToken = (token) => {
  const result = verifyWith(token, JWT_EMAIL_VERIFICATION_SECRET);

  if (!result.error && result.data?.purpose !== EMAIL_VERIFICATION_PURPOSE) {
    return {
      data: null,
      error: new Error("Invalid email verification token"),
    };
  }

  return result;
};

/**
 * Декодування не підтверджує достовірність токена. Ідентифікатор потрібен
 * тільки щоб знайти поточний passwordHash, після чого підпис перевіряється.
 */
export const getPasswordResetTokenUserId = (token) => {
  const decoded = jwt.decode(token);
  const id = typeof decoded === "object" && decoded ? Number(decoded.id) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const verifyPasswordResetToken = (token, passwordHash) => {
  if (!passwordHash) {
    return { data: null, error: new Error("Invalid password reset token") };
  }

  const result = verifyWith(token, getPasswordResetSigningKey(passwordHash));

  if (!result.error && result.data?.purpose !== PASSWORD_RESET_PURPOSE) {
    return {
      data: null,
      error: new Error("Invalid password reset token"),
    };
  }

  return result;
};
