import Joi from "joi";

//TODO: add correct schema fields and types
export const createShiftSchema = Joi.object({
  title: Joi.string().min(2).max(50).required().messages({
    "any.required": "title is required",
    "string.base": "title must be a string",
  }),
  category: Joi.string().optional(),
  categoryId: Joi.string().required().messages({
    "any.required": "categoryId is required",
    "string.base": "categoryId must be a valid string",
  }),
  area: Joi.string().optional(),
  areaId: Joi.string().required().messages({
    "any.required": "areaId is required",
    "string.base": "areaId must be a valid string",
  }),
  instructions: Joi.string().required().messages({
    "any.required": "instructions is required",
    "string.base": "instructions must be a valid string",
  }),
  description: Joi.string().required().messages({
    "any.required": "description is required",
    "string.base": "description must be a valid string",
  }),
  thumb: Joi.string().optional().messages({
    "string.base": "thumb must be a valid link",
  }),
  time: Joi.number().required().messages({
    "any.required": "time is required",
    "number.base": "time must be a number",
  }),
  ingredients: Joi.string().required().messages({
    "any.required": "ingredients is required",
    "string.base": "ingredients must be a valid JSON string",
  }),
}).required();

export const updateShiftSchema = Joi.object({
  favorite: Joi.boolean().required().messages({
    "boolean.base": '"favorite" must be true or false',
    "any.required": '"favorite" is a required field',
  }),
});

/**
 * validate request params, example: api/recipes/sd8f89sdf8sdfsd9f
 */
export const deleteShiftSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-zA-Z]+$/)
    .messages({
      "string.pattern.base": "ID must contain a valid symbol.",
      "any.required": "ID is a required.",
    }),
});

/**
 * validate pagination query params, example: ?page=1&limit=10
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "string.base": '"page" should be a type of integer',
    "string.empty": '"page" cannot be an empty',
    "any.required": '"page" is a required',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "string.base": '"limit" should be a type of integer',
    "string.empty": '"limit" cannot be an empty',
    "any.required": '"limit" is a required',
  }),
});
