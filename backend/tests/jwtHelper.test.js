import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret";
process.env.JWT_EMAIL_VERIFICATION_SECRET =
  process.env.JWT_EMAIL_VERIFICATION_SECRET || "test_email_secret";
process.env.JWT_PASSWORD_RESET_SECRET =
  process.env.JWT_PASSWORD_RESET_SECRET || "test_reset_secret";

const {
  getAuthTokenFingerprint,
  createAccessToken,
  createRefreshToken,
  hasCurrentAuthTokenFingerprint,
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  getPasswordResetTokenUserId,
  verifyAccessToken,
  verifyRefreshToken,
} = await import("../helpers/jwt.js");

const PASSWORD_HASH = "$2b$10$abcdefghijklmnopqrstuv";

describe("helpers/jwt", () => {
  describe("getAuthTokenFingerprint", () => {
    it("is deterministic for the same password hash", () => {
      expect(getAuthTokenFingerprint(PASSWORD_HASH)).toBe(
        getAuthTokenFingerprint(PASSWORD_HASH),
      );
    });

    it("changes when the password hash changes", () => {
      expect(getAuthTokenFingerprint(PASSWORD_HASH)).not.toBe(
        getAuthTokenFingerprint(`${PASSWORD_HASH}x`),
      );
    });

    it("throws when the password hash is missing", () => {
      expect(() => getAuthTokenFingerprint()).toThrow(
        "Password hash is required",
      );
    });
  });

  describe("access / refresh tokens", () => {
    it("round-trips an access token and embeds the fingerprint", () => {
      const token = createAccessToken({ id: 42, passwordHash: PASSWORD_HASH });
      const { data, error } = verifyAccessToken(token);

      expect(error).toBeNull();
      expect(data.id).toBe(42);
      expect(data.authFingerprint).toBe(getAuthTokenFingerprint(PASSWORD_HASH));
    });

    it("reports an error for a token signed with the wrong secret", () => {
      const refresh = createRefreshToken({ id: 1, passwordHash: PASSWORD_HASH });
      const { data, error } = verifyAccessToken(refresh);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe("hasCurrentAuthTokenFingerprint", () => {
    it("accepts a payload whose fingerprint matches the current hash", () => {
      const token = createAccessToken({ id: 7, passwordHash: PASSWORD_HASH });
      const { data } = verifyAccessToken(token);

      expect(hasCurrentAuthTokenFingerprint(data, PASSWORD_HASH)).toBe(true);
    });

    it("rejects a payload after the password (hash) changed", () => {
      const token = createAccessToken({ id: 7, passwordHash: PASSWORD_HASH });
      const { data } = verifyAccessToken(token);

      expect(hasCurrentAuthTokenFingerprint(data, `${PASSWORD_HASH}-new`)).toBe(false);
    });

    it("rejects legacy payloads without a fingerprint", () => {
      expect(hasCurrentAuthTokenFingerprint({ id: 1 }, PASSWORD_HASH)).toBe(false);
    });

    it("rejects when no password hash is provided", () => {
      expect(hasCurrentAuthTokenFingerprint({ authFingerprint: "x" })).toBe(false);
    });
  });

  describe("email verification token", () => {
    it("round-trips and validates the purpose claim", () => {
      const token = createEmailVerificationToken({ id: 5 });
      const { data, error } = verifyEmailVerificationToken(token);

      expect(error).toBeNull();
      expect(data.id).toBe(5);
    });

    it("rejects an otherwise valid token issued for a different purpose", () => {
      // Підписаний тим самим секретом, але без purpose === "email-verification".
      const wrongPurpose = jwt.sign(
        { id: 1, purpose: "something-else" },
        process.env.JWT_EMAIL_VERIFICATION_SECRET,
        { expiresIn: "5m" },
      );
      const { data, error } = verifyEmailVerificationToken(wrongPurpose);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe("password reset token", () => {
    it("round-trips when the password hash is unchanged", () => {
      const token = createPasswordResetToken({ id: 9, passwordHash: PASSWORD_HASH });
      const { data, error } = verifyPasswordResetToken(token, PASSWORD_HASH);

      expect(error).toBeNull();
      expect(data.id).toBe(9);
    });

    it("is invalidated once the password hash changes", () => {
      const token = createPasswordResetToken({ id: 9, passwordHash: PASSWORD_HASH });
      const { data, error } = verifyPasswordResetToken(token, `${PASSWORD_HASH}-new`);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it("fails fast when no password hash is available", () => {
      const token = createPasswordResetToken({ id: 9, passwordHash: PASSWORD_HASH });
      const { data, error } = verifyPasswordResetToken(token, null);

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it("extracts the user id from an unverified token", () => {
      const token = createPasswordResetToken({ id: 123, passwordHash: PASSWORD_HASH });
      expect(getPasswordResetTokenUserId(token)).toBe(123);
    });

    it("returns null for a malformed token", () => {
      expect(getPasswordResetTokenUserId("not-a-jwt")).toBeNull();
    });
  });

  it("verifyRefreshToken round-trips a refresh token", () => {
    const token = createRefreshToken({ id: 3, passwordHash: PASSWORD_HASH });
    const { data, error } = verifyRefreshToken(token);

    expect(error).toBeNull();
    expect(data.id).toBe(3);
  });
});
