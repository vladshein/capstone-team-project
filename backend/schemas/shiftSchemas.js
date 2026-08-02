import Joi from "joi";

// Схема для створення нової зміни
export const createShiftSchema = Joi.object({
  locationId: Joi.number().integer().positive().required(),
  positionId: Joi.number().integer().positive().required(),
  categoryId: Joi.number().integer().positive().required(),

  startTime: Joi.date().iso().required(),

  // Joi автоматично перевірить, чи endTime більше за startTime
  endTime: Joi.date().iso().greater(Joi.ref("startTime")).required().messages({
    "date.greater":
      "Час закінчення (endTime) має бути більшим за час початку (startTime).",
  }),

  hourlyRate: Joi.number().positive().precision(2).required(),
  bonusRate: Joi.number().min(0).precision(2).default(0.0),
  description: Joi.string().allow("").optional(),
});

// Схема для редагування зміни (всі поля опціональні)
export const updateShiftSchema = Joi.object({
  locationId: Joi.number().integer().positive().optional(),
  positionId: Joi.number().integer().positive().optional(),
  categoryId: Joi.number().integer().positive().optional(),

  startTime: Joi.date().iso().optional(),

  endTime: Joi.date().iso().greater(Joi.ref("startTime")).optional().messages({
    "date.greater":
      "Час закінчення (endTime) має бути більшим за час початку (startTime).",
  }),

  hourlyRate: Joi.number().positive().precision(2).optional(),
  bonusRate: Joi.number().min(0).precision(2).optional(),
  description: Joi.string().allow("").optional(),
});
