import Joi from "joi";

// Схема для створення профілю (всі поля обов'язкові)
export const createProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    "string.min": "Ім'я має містити мінімум 2 символи",
    "any.required": "Ім'я є обов'язковим полем",
  }),
  lastName: Joi.string().min(2).max(50).required(),
  birthDate: Joi.date().iso().less("now").required().messages({
    "date.less": "Дата народження повинна бути в минулому",
  }),
  // ІПН в Україні містить рівно 10 цифр
  taxNumber: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "ІПН повинен містити рівно 10 цифр",
      "string.pattern.base": "ІПН повинен складатися лише з цифр",
    }),
  avatarUrl: Joi.string().uri().optional(),
});

// Схема для оновлення (всі поля опціональні, адже ми можемо оновлювати лише частину)
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  birthDate: Joi.date().iso().less("now").optional(),
  taxNumber: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .optional(),
  avatarUrl: Joi.string().uri().optional(),
});
