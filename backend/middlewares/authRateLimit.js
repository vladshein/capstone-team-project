import { rateLimit } from "express-rate-limit";

const rateLimitMessage = {
  message: "Забагато спроб. Спробуйте ще раз пізніше.",
};

/**
 * Захищає реєстрацію від масового створення акаунтів з однієї IP-адреси.
 * Успішні реєстрації також враховуються навмисно.
 */
export const registerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

/**
 * Захищає вхід від brute-force, не обмежуючи користувача після успішного логіну.
 */
export const loginRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});
