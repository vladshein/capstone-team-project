import express from "express";
import Joi from "joi";
import request from "supertest";

import validateBody from "../helpers/validateBody.js";
import { validateParams, validateQuery } from "../helpers/validateFunctions.js";
import errorHandler from "../middlewares/errorHandler.js";

const createApp = () => {
  const app = express();
  app.use(express.json());

  app.post(
    "/body",
    validateBody(Joi.object({ name: Joi.string().min(2).required() })),
    (req, res) => res.status(201).json(req.body),
  );
  app.get(
    "/query",
    validateQuery(Joi.object({ page: Joi.number().integer().min(1).default(1) })),
    (req, res) => res.json(req.validatedQuery),
  );
  app.get(
    "/params/:id",
    validateParams(Joi.object({ id: Joi.number().integer().positive().required() })),
    (req, res) => res.json(req.validatedParams),
  );
  app.use(errorHandler);
  return app;
};

describe("request validation helpers", () => {
  test("accepts a valid body", async () => {
    const app = createApp();

    await request(app).post("/body").send({ name: "Зміна" }).expect(201, {
      name: "Зміна",
    });
  });

  test("returns 400 for an invalid body before it reaches the controller", async () => {
    const app = createApp();
    const response = await request(app).post("/body").send({}).expect(400);

    expect(response.body.message).toContain('"name" is required');
  });

  test("sanitizes query parameters and applies schema defaults", async () => {
    const app = createApp();

    await request(app).get("/query?unknown=value").expect(200, { page: 1 });
  });

  test("rejects invalid route parameters", async () => {
    const app = createApp();
    const response = await request(app).get("/params/not-a-number").expect(400);

    expect(response.body.message).toContain('"id" must be a number');
  });
});
