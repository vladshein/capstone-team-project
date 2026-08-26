import Joi from "joi";

const id = Joi.number().integer().positive();

export const disputeIdParamsSchema = Joi.object({ disputeId: id.required() });

export const createDisputeSchema = Joi.object({
  shiftId: id.required(),
  reason: Joi.string()
    .valid("payment", "no_show", "late_cancellation", "work_quality", "other")
    .required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  disputedAmount: Joi.number().min(0).precision(2).optional(),
});

export const createDisputeMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(5000).required(),
});

export const updateDisputeStatusSchema = Joi.object({
  status: Joi.string()
    .valid("awaiting_response", "under_review", "closed")
    .required(),
});

export const resolveDisputeSchema = Joi.object({
  decision: Joi.string()
    .valid(
      "pay_worker_full",
      "pay_worker_partial",
      "refund_company",
      "no_action",
      "cancel_shift_no_fault",
    )
    .required(),
  resolvedAmount: Joi.number()
    .min(0)
    .precision(2)
    .when("decision", {
      is: Joi.valid("pay_worker_full", "pay_worker_partial", "refund_company"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  adminComment: Joi.string().trim().min(3).max(5000).required(),
});
