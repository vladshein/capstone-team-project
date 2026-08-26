import { jest } from "@jest/globals";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.FRONTEND_URL ??= "http://localhost:5173";
process.env.JWT_SECRET ??= "test-access-secret";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";
process.env.JWT_EMAIL_VERIFICATION_SECRET ??= "test-email-verification-secret";
process.env.JWT_PASSWORD_RESET_SECRET ??= "test-password-reset-secret";
process.env.DATABASE_DIALECT_DEV ??= "postgres";
process.env.DATABASE_USERNAME_DEV ??= "postgres";
process.env.DATABASE_PASSWORD_DEV ??= "postgres";
process.env.DATABASE_HOST_DEV ??= "localhost";
process.env.DATABASE_NAME_DEV ??= "zmina_test";
process.env.DATABASE_PORT_DEV ??= "5432";

// Документація Swagger не належить до HTTP-контрактів, які перевіряє цей файл.
// Мок прибирає залежність тесту від поточного робочого каталогу.
jest.unstable_mockModule("../middlewares/swaggerDocs.js", () => ({
  swaggerDocs: () => (_req, res) => res.status(200).end(),
}));

const { default: sequelize } = await import("../db/sequelize.js");
const { default: app } = await import("../app.js");

describe("application health endpoints", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns liveness status without querying the database", async () => {
    const authenticateSpy = jest.spyOn(sequelize, "authenticate");

    await request(app).get("/health").expect(200, { status: "ok" });

    expect(authenticateSpy).not.toHaveBeenCalled();
  });

  test("returns ready when the database accepts a connection", async () => {
    jest.spyOn(sequelize, "authenticate").mockResolvedValue(undefined);

    await request(app).get("/ready").expect(200, { status: "ready" });
  });

  test("returns 503 when the database is unavailable", async () => {
    jest.spyOn(sequelize, "authenticate").mockRejectedValue(new Error("database unavailable"));

    await request(app).get("/ready").expect(503, { status: "unavailable" });
  });

  test("uses the common JSON 404 response for an unknown route", async () => {
    const response = await request(app).get("/api/not-existing").expect(404);

    expect(response.body.message).toBe("GET /api/not-existing not found");
  });
});
