import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import { ValidationError, UniqueConstraintError } from "sequelize";
import errorHandler from "../middlewares/errorHandler.js";
import notFoundHandler from "../middlewares/notFoundHandler.js";

const appThatThrows = (error) => {
  const app = express();
  app.get("/boom", (_req, _res, next) => next(error));
  app.use(errorHandler);
  return app;
};

describe("middlewares/errorHandler", () => {
  it("maps a Joi-flavoured error to 400 with joined details", async () => {
    const joiError = Object.assign(new Error("joi"), {
      isJoi: true,
      details: [{ message: '"name" is required' }, { message: '"age" must be a number' }],
    });

    const res = await request(appThatThrows(joiError)).get("/boom").expect(400);
    expect(res.body.details).toContain('"name" is required');
    expect(res.body.details).toContain('"age" must be a number');
  });

  it("maps a Sequelize ValidationError to 400", async () => {
    const err = new ValidationError("invalid", [{ message: "email must be unique-ish" }]);

    const res = await request(appThatThrows(err)).get("/boom").expect(400);
    expect(res.body.message).toMatch(/Sequelize/);
    expect(res.body.details).toContain("email must be unique-ish");
  });

  // УВАГА: у Sequelize `UniqueConstraintError extends ValidationError`, а
  // errorHandler перевіряє `instanceof ValidationError` РАНІШЕ за
  // `instanceof UniqueConstraintError`, тож конфлікт унікальності зараз
  // повертає 400, а не 409. Тест фіксує фактичну поведінку; якщо гілки
  // поміняти місцями — очікування треба оновити на 409.
  it("currently treats a UniqueConstraintError as a 400 (branch-order caveat)", async () => {
    const err = new UniqueConstraintError({
      errors: [{ message: "edrpou must be unique" }],
    });

    const res = await request(appThatThrows(err)).get("/boom").expect(400);
    expect(res.body.details).toContain("edrpou must be unique");
  });

  it("passes through a custom HttpError status and message", async () => {
    const err = Object.assign(new Error("Компанію не знайдено"), { status: 404 });

    const res = await request(appThatThrows(err)).get("/boom").expect(404);
    expect(res.body.message).toBe("Компанію не знайдено");
  });

  it("falls back to 500 for an unclassified error", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(appThatThrows(new Error("kaboom"))).get("/boom").expect(500);

    expect(res.body.message).toBe("kaboom");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("middlewares/notFoundHandler", () => {
  it("returns 404 with the method and url", async () => {
    const app = express();
    app.use(notFoundHandler);

    const res = await request(app).get("/nowhere").expect(404);
    expect(res.body.message).toBe("GET /nowhere not found");
  });
});
