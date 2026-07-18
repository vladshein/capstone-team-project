import HttpError from "./HttpError.js";

/**
 * Validate request body (req.body), for examle:
 * {
 *   "email": "example(dot)example.com"
 *   "pass": "123"
 * }
 *
 * @param {*} schema
 * @returns
 */
export const validateBody = (schema) => {
  const func = (req, _, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      throw HttpError(400, error.message);
    }
    next();
  };

  return func;
};

/**
 * Validate query string (req.query), for example:
 *      .../recipes/my?page=1&limit=10
 *
 * @param {*} schema
 * @returns
 */
export const validateQuery = (schema) => (req, res, next) => {
  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  };
  const { error, value } = schema.validate(req.query, options);
  if (error) {
    throw HttpError(
      400,
      error.details.map((d) => d.message),
    );
  }
  req.validatedQuery = value;
  next();
};

/**
 * Validate request params (req.params), for example:
 *      .../api/recipes/ffasfdsfsf88sdf8s
 *
 * @param {*} schema
 * @returns
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      throw HttpError(
        400,
        error.details.map((d) => d.message),
      );
    }
    // overwrite with validated & sanitized params
    req.validatedParams = value;

    next();
  };
};
