import express from "express";
import Joi from "joi";
import request from "supertest";
import { validatePaginator } from "../middlewares/validatePaginator.js";
import { validateQuery, validateParams } from "../helpers/validateFunctions.js";

const paginatorSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

describe("middlewares/validatePaginator", () => {
  const app = express();
  app.get("/list", validatePaginator(paginatorSchema), (req, res) =>
    res.json(req.validatedQuery),
  );

  it("applies schema defaults and strips unknown params", async () => {
    const res = await request(app).get("/list?foo=bar").expect(200);
    expect(res.body).toEqual({ page: 1, limit: 20 });
  });

  it("returns 400 with a list of messages for an invalid page", async () => {
    const res = await request(app).get("/list?page=0").expect(400);
    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.join(" ")).toMatch(/page/);
  });
});

describe("helpers/validateFunctions error branches", () => {
  const app = express();
  app.get(
    "/q",
    validateQuery(Joi.object({ page: Joi.number().integer().min(1).required() })),
    (req, res) => res.json(req.validatedQuery),
  );
  app.get(
    "/p/:id",
    validateParams(Joi.object({ id: Joi.number().integer().positive().required() })),
    (req, res) => res.json(req.validatedParams),
  );
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  it("validateQuery throws a 400 for an invalid query", async () => {
    await request(app).get("/q?page=abc").expect(400);
  });

  it("validateParams throws a 400 for an invalid route param", async () => {
    await request(app).get("/p/not-a-number").expect(400);
  });

  it("validateParams passes sanitized params through on success", async () => {
    const res = await request(app).get("/p/42").expect(200);
    expect(res.body).toEqual({ id: 42 });
  });
});
