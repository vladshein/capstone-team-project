import Joi from 'joi';
import { emailRegExp, phoneRegExp } from '../constants/authConstants.js';

export const registerSchema = Joi.object({
  phone: Joi.string().pattern(phoneRegExp).required().messages({
    'string.pattern.base': 'Invalid phone format',
    'any.required': 'Phone is required',
  }),

  password: Joi.string().required().min(8).messages({
    'any.required': 'Password is required',
    'string.base': 'Password must be a string',
    // min: "Password must be at least 8 symbols",
  }),

  email: Joi.string().pattern(emailRegExp).required().messages({
    'any.required': 'Email is required',
  }),

  role: Joi.string()
    .valid('worker', 'business_client', 'admin')
    .default("worker"),
});

export const loginSchema = Joi.object({
  password: Joi.string().required().min(8).messages({
    'any.required': 'Password is required',
  }),

  email: Joi.string().pattern(emailRegExp).required().messages({
    'any.required': 'Email is required',
  }),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().trim().required().messages({
    "any.required": "Токен підтвердження обов'язковий.",
    "string.empty": "Токен підтвердження обов'язковий.",
  }),
});
