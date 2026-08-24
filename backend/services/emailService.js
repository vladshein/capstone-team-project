import nodemailer from "nodemailer";

const parseBoolean = (value) => String(value).toLowerCase() === "true";

/**
 * Перевіряє SMTP-конфігурацію без логування пароля чи повних налаштувань.
 * SMTP_SSL лишено як сумісний псевдонім для вже створеного env-файлу.
 */
export const getSmtpConfig = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  const port = Number(SMTP_PORT);

  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535
  ) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD.",
    );
  }

  return {
    host: SMTP_HOST,
    port,
    // Порожнє SMTP_SECURE не має вимикати сумісний SMTP_SSL зі старого env.
    secure: parseBoolean(process.env.SMTP_SECURE || process.env.SMTP_SSL),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  };
};

let transport;

export const getEmailTransport = () => {
  if (!transport) {
    transport = nodemailer.createTransport(getSmtpConfig());
  }

  return transport;
};

export const verifyEmailTransport = () => getEmailTransport().verify();

const buildFrontendTokenUrl = (pathname, token) => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is required to build an email link.");
  }

  const url = new URL(pathname, frontendUrl);
  // Fragment не передається HTTP-серверу, CDN і стороннім ресурсам як query
  // або Referer. React прочитає token з window.location.hash і одразу прибере
  // його після POST-запиту до API.
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
};

const buildVerificationUrl = (token) => buildFrontendTokenUrl("/email-verification", token);
const buildPasswordResetUrl = (token) => buildFrontendTokenUrl("/reset-password", token);

/** Надсилає короткий лист без персональних даних, окрім адреси одержувача. */
export const sendVerificationEmail = async ({ email, token }) => {
  const verificationUrl = buildVerificationUrl(token);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  return getEmailTransport().sendMail({
    from: `Зміна <${from}>`,
    to: email,
    subject: "Підтвердіть електронну пошту — Зміна",
    text: [
      "Вітаємо на платформі «Зміна»!",
      "",
      "Щоб підтвердити адресу електронної пошти, відкрийте посилання:",
      verificationUrl,
      "",
      "Посилання дійсне 24 години. Якщо ви не реєструвалися на платформі, просто проігноруйте цей лист.",
    ].join("\n"),
    html: `
      <p>Вітаємо на платформі <strong>«Зміна»</strong>!</p>
      <p>Щоб підтвердити адресу електронної пошти, натисніть кнопку:</p>
      <p><a href="${verificationUrl}">Підтвердити email</a></p>
      <p>Посилання дійсне 24 години. Якщо ви не реєструвалися на платформі, просто проігноруйте цей лист.</p>
    `,
  });
};

/** Надсилає лист без підтвердження, чи існує адреса в публічному API. */
export const sendPasswordResetEmail = async ({ email, token }) => {
  const resetUrl = buildPasswordResetUrl(token);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  return getEmailTransport().sendMail({
    from: `Зміна <${from}>`,
    to: email,
    subject: "Відновлення пароля — Зміна",
    text: [
      "Надійшов запит на відновлення пароля для платформи «Зміна».",
      "",
      "Щоб встановити новий пароль, відкрийте посилання:",
      resetUrl,
      "",
      "Посилання дійсне 15 хвилин. Якщо це були не ви, просто проігноруйте цей лист.",
    ].join("\n"),
    html: `
      <p>Надійшов запит на відновлення пароля для платформи <strong>«Зміна»</strong>.</p>
      <p>Щоб встановити новий пароль, натисніть кнопку:</p>
      <p><a href="${resetUrl}">Встановити новий пароль</a></p>
      <p>Посилання дійсне 15 хвилин. Якщо це були не ви, просто проігноруйте цей лист.</p>
    `,
  });
};
