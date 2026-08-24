import jwt from "jsonwebtoken";
import { createHmac, timingSafeEqual } from "node:crypto";

const {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EMAIL_VERIFICATION_SECRET,
  JWT_PASSWORD_RESET_SECRET,
} = process.env;
const EMAIL_VERIFICATION_PURPOSE = "email-verification";
const PASSWORD_RESET_PURPOSE = "password-reset";

/**
 * Не додаємо passwordHash до JWT: це чутливе значення, а payload токена
 * можна прочитати без секрету. Натомість зберігаємо HMAC-відбиток хешу.
 * Після зміни пароля відбиток змінюється, тому всі старі сесії стають
 * недійсними без окремого поля чи таблиці в БД.
 */
export const getAuthTokenFingerprint = (passwordHash) => {
  if (!passwordHash) {
    throw new Error("Password hash is required to create an authentication token");
  }

  return createHmac("sha256", JWT_SECRET)
    .update(`auth-token:${passwordHash}`)
    .digest("base64url");
};

const createAuthTokenPayload = ({ id, passwordHash }) => ({
  id,
  authFingerprint: getAuthTokenFingerprint(passwordHash),
});

export const createAccessToken = (payload) =>
  jwt.sign(createAuthTokenPayload(payload), JWT_SECRET, { expiresIn: "15m" });

export const createRefreshToken = (payload) =>
  jwt.sign(createAuthTokenPayload(payload), JWT_REFRESH_SECRET, { expiresIn: "7d" });

/**
 * Старі JWT без authFingerprint навмисно не приймаються. Так користувача
 * один раз попросять увійти знову після появи механізму інвалідації сесій.
 */
export const hasCurrentAuthTokenFingerprint = (payload, passwordHash) => {
  if (typeof payload?.authFingerprint !== "string" || !passwordHash) {
    return false;
  }

  const expectedFingerprint = getAuthTokenFingerprint(passwordHash);
  const received = Buffer.from(payload.authFingerprint);
  const expected = Buffer.from(expectedFingerprint);

  return received.length === expected.length && timingSafeEqual(received, expected);
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
