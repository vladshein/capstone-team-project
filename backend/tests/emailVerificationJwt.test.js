import { jest } from "@jest/globals";

process.env.JWT_SECRET = "access-secret";
process.env.JWT_REFRESH_SECRET = "refresh-secret";
process.env.JWT_EMAIL_VERIFICATION_SECRET = "email-verification-secret";
process.env.JWT_PASSWORD_RESET_SECRET = "password-reset-secret";

const jwt = await import("jsonwebtoken");
const {
  createAccessToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
} = await import("../helpers/jwt.js");

describe("email verification JWT", () => {
  test("uses a dedicated secret, purpose and 24-hour lifetime", () => {
    const signSpy = jest.spyOn(jwt.default, "sign");

    createEmailVerificationToken({ id: 17 });

    expect(signSpy).toHaveBeenCalledWith(
      { id: 17, purpose: "email-verification" },
      "email-verification-secret",
      { expiresIn: "24h" },
    );
  });

  test("does not accept an access token as an email verification token", () => {
    const accessToken = createAccessToken({ id: 17 });
    const result = verifyEmailVerificationToken(accessToken);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  test("invalidates a password-reset token when the password hash changes", () => {
    const resetToken = createPasswordResetToken({
      id: 17,
      passwordHash: "old-password-hash",
    });

    expect(verifyPasswordResetToken(resetToken, "old-password-hash")).toMatchObject({
      data: expect.objectContaining({ id: 17, purpose: "password-reset" }),
      error: null,
    });
    expect(verifyPasswordResetToken(resetToken, "new-password-hash")).toMatchObject({
      data: null,
      error: expect.any(Error),
    });
  });
});
