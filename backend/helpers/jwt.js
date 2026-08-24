import jwt from "jsonwebtoken";

const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EMAIL_VERIFICATION_SECRET } = process.env;
const EMAIL_VERIFICATION_PURPOSE = "email-verification";

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
