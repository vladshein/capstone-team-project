import Joi from "joi";

export const createCompanySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "any.required": "Назва компанії є обов'язковою",
  }),
  // ЄДРПОУ завжди містить 8 цифр
  edrpou: Joi.string()
    .length(8)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "Код ЄДРПОУ повинен містити рівно 8 цифр",
      "string.pattern.base": "Код ЄДРПОУ повинен складатися лише з цифр",
    }),
  legalAddress: Joi.string().max(255).allow("").optional(),
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  edrpou: Joi.string()
    .length(8)
    .pattern(/^[0-9]+$/)
    .optional(),
  legalAddress: Joi.string().max(255).allow("").optional(),
});
