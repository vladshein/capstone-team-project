export const validatePaginator = (schema) => (req, res, next) => {
  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  };
  const { error, value } = schema.validate(req.query, options);
  if (error) {
    return res.status(400).json({
      message: error.details.map((d) => d.message),
    });
  }
  req.validatedQuery = value;
  next();
};
