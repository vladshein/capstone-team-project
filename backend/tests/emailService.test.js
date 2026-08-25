import { jest } from "@jest/globals";

const sendMail = jest.fn();
const verify = jest.fn();
const createTransport = jest.fn(() => ({ sendMail, verify }));

jest.unstable_mockModule("nodemailer", () => ({
  default: { createTransport },
}));

process.env.FRONTEND_URL = "https://zmina.example";
process.env.SMTP_HOST = "smtp.example";
process.env.SMTP_PORT = "465";
process.env.SMTP_SECURE = "true";
process.env.SMTP_USER = "notifications@example.com";
process.env.SMTP_PASSWORD = "smtp-password";
process.env.SMTP_FROM = "notifications@example.com";

const {
  getSmtpConfig,
  sendPasswordResetEmail,
  sendShiftNotificationEmail,
  sendVerificationEmail,
  verifyEmailTransport,
} = await import("../services/emailService.js");

describe("email service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendMail.mockResolvedValue({ messageId: "message-id" });
    verify.mockResolvedValue(true);
  });

  test("converts SMTP env values to Nodemailer transport config", () => {
    expect(getSmtpConfig()).toEqual({
      host: "smtp.example",
      port: 465,
      secure: true,
      auth: {
        user: "notifications@example.com",
        pass: "smtp-password",
      },
    });
  });

  test("sends the verification link through the SMTP transport", async () => {
    await sendVerificationEmail({
      email: "worker@example.com",
      token: "short-lived-token",
    });

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: "smtp.example",
      port: 465,
      secure: true,
    }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: "Зміна <notifications@example.com>",
      to: "worker@example.com",
      subject: "Підтвердіть електронну пошту — Зміна",
      text: expect.stringContaining(
        "https://zmina.example/email-verification#token=short-lived-token",
      ),
      html: expect.stringContaining("Підтвердити email"),
    }));
  });

  test("sends a short-lived password-reset link through the same SMTP transport", async () => {
    await sendPasswordResetEmail({
      email: "worker@example.com",
      token: "short-lived-reset-token",
    });

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: "worker@example.com",
      subject: "Відновлення пароля — Зміна",
      text: expect.stringContaining(
        "https://zmina.example/reset-password#token=short-lived-reset-token",
      ),
      html: expect.stringContaining("Встановити новий пароль"),
    }));
  });

  test("sends an escaped shift notification with a direct details link", async () => {
    await sendShiftNotificationEmail({
      email: "business@example.com",
      event: "application_created",
      shift: {
        id: 19,
        title: '<img src=x onerror="alert(1)">',
        companyName: "ТОВ <Тест>",
        locationTitle: "ТРЦ Small",
        city: "Вінниця",
        address: "проспект Юності, 18",
        startTime: "2026-08-25T09:00:00.000Z",
        endTime: "2026-08-25T17:00:00.000Z",
      },
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "business@example.com",
        subject: "Нова заявка на зміну — Зміна",
        text: expect.stringContaining("https://zmina.example/shifts/19"),
        html: expect.stringContaining(
          "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
        ),
      }),
    );
    expect(sendMail.mock.calls[0][0].html).not.toContain(
      '<img src=x onerror="alert(1)">',
    );
  });

  test("rejects an empty or invalid SMTP port", () => {
    const originalPort = process.env.SMTP_PORT;

    process.env.SMTP_PORT = "";
    expect(() => getSmtpConfig()).toThrow("SMTP is not configured");

    process.env.SMTP_PORT = "70000";
    expect(() => getSmtpConfig()).toThrow("SMTP is not configured");

    process.env.SMTP_PORT = originalPort;
  });

  test("uses the legacy SMTP_SSL value when SMTP_SECURE is empty", () => {
    const originalSecure = process.env.SMTP_SECURE;
    const originalSsl = process.env.SMTP_SSL;

    process.env.SMTP_SECURE = "";
    process.env.SMTP_SSL = "true";

    expect(getSmtpConfig().secure).toBe(true);

    process.env.SMTP_SECURE = originalSecure;
    process.env.SMTP_SSL = originalSsl;
  });

  test("can verify SMTP connectivity without sending a message", async () => {
    await expect(verifyEmailTransport()).resolves.toBe(true);
    expect(verify).toHaveBeenCalledTimes(1);
  });
});
