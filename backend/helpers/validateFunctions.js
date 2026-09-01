import HttpError from "./HttpError.js";

/**
 * Validate query string (req.query), e.g. `.../api/shifts?page=1&limit=10`.
 * On success puts the sanitized value in `req.validatedQuery`.
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
 * Validate request params (req.params), e.g. `.../api/reviews/:reviewId`.
 * On success puts the sanitized value in `req.validatedParams`.
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
