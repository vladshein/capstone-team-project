import * as disputes from "../services/disputeServices.js";
import { enqueueDisputeNotification } from "../queues/shiftLifecycleQueue.js";
import { getVerifiedAdminIds } from "../services/disputeNotificationServices.js";

// Email не повинен скасовувати вже успішну дію зі спором. Якщо черга або SMTP
// тимчасово недоступні, worker повторить уже створений job, а API лишиться
// доступним для сторін.
const queueDisputeNotification = ({ event, recipientUserId, disputeId }) => {
  const recipientId = Number(recipientUserId);
  const normalizedDisputeId = Number(disputeId);
  if (
    !Number.isInteger(recipientId) ||
    recipientId < 1 ||
    !Number.isInteger(normalizedDisputeId) ||
    normalizedDisputeId < 1
  ) {
    return;
  }

  void Promise.resolve(
    enqueueDisputeNotification({
      event,
      recipientUserId: recipientId,
      disputeId: normalizedDisputeId,
    }),
  ).catch((error) => {
    console.error("[dispute-notification] failed to enqueue email", {
      event,
      recipientUserId: recipientId,
      disputeId: normalizedDisputeId,
      message: error?.message ?? String(error),
    });
  });
};

const queueAdminDisputeNotifications = ({ event, disputeId }) => {
  void getVerifiedAdminIds()
    .then((adminIds) => {
      adminIds.forEach((recipientUserId) =>
        queueDisputeNotification({ event, recipientUserId, disputeId }),
      );
    })
    .catch((error) => {
      console.error("[dispute-notification] failed to find admins", {
        event,
        disputeId,
        message: error?.message ?? String(error),
      });
    });
};

const pageOptions = (query) => ({
  page: Math.max(Number(query.page) || 1, 1),
  limit: Math.min(Math.max(Number(query.limit) || 20, 1), 100),
  status: query.status,
  shiftId: query.shiftId ? Number(query.shiftId) : undefined,
  active: query.active === "true",
  search: typeof query.search === "string" ? query.search : undefined,
});

export const createDispute = async (req, res, next) => {
  try {
    const data = await disputes.createDispute({
      user: req.user,
      payload: req.body,
    });
    queueDisputeNotification({
      event: "dispute_opened",
      recipientUserId: data.Respondent?.id,
      disputeId: data.id,
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};
export const getMyDisputes = async (req, res, next) => {
  try {
    res.json(await disputes.getMyDisputes(req.user, pageOptions(req.query)));
  } catch (error) {
    next(error);
  }
};
export const getDispute = async (req, res, next) => {
  try {
    res.json({
      data: await disputes.getDisputeById(
        req.validatedParams.disputeId,
        req.user,
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const addMessage = async (req, res, next) => {
  try {
    const data = await disputes.addMessage({
      disputeId: req.validatedParams.disputeId,
      user: req.user,
      message: req.body.message,
    });
    const dispute = await disputes.getDisputeById(
      req.validatedParams.disputeId,
      req.user,
    );
    queueDisputeNotification({
      event: "dispute_message_added",
      recipientUserId:
        req.user.id === dispute.initiatorId
          ? dispute.respondentId
          : dispute.initiatorId,
      disputeId: dispute.id,
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};
export const settleDispute = async (req, res, next) => {
  try {
    const data = await disputes.settleDispute({
      disputeId: req.validatedParams.disputeId,
      user: req.user,
    });
    queueDisputeNotification({
      event: "dispute_settled",
      recipientUserId: data.Initiator?.id,
      disputeId: data.id,
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
export const escalateDispute = async (req, res, next) => {
  try {
    const data = await disputes.escalateDispute({
      disputeId: req.validatedParams.disputeId,
      user: req.user,
    });
    queueDisputeNotification({
      event: "dispute_escalated",
      recipientUserId: data.Initiator?.id,
      disputeId: data.id,
    });
    queueAdminDisputeNotifications({
      event: "dispute_escalated",
      disputeId: data.id,
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
export const appealDispute = async (req, res, next) => {
  try {
    const data = await disputes.appealDispute({
      disputeId: req.validatedParams.disputeId,
      user: req.user,
      message: req.body.message,
    });
    for (const recipientUserId of new Set([
      data.Initiator?.id,
      data.Respondent?.id,
    ])) {
      if (Number(recipientUserId) === req.user.id) continue;
      queueDisputeNotification({
        event: "dispute_appealed",
        recipientUserId,
        disputeId: data.id,
      });
    }
    queueAdminDisputeNotifications({
      event: "dispute_appealed",
      disputeId: data.id,
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
export const getAdminDisputes = async (req, res, next) => {
  try {
    res.json(await disputes.getMyDisputes(req.user, pageOptions(req.query)));
  } catch (error) {
    next(error);
  }
};
export const getAdminDisputeStatusCounts = async (_req, res, next) => {
  try {
    res.json(await disputes.getDisputeStatusCounts());
  } catch (error) {
    next(error);
  }
};
export const updateStatus = async (req, res, next) => {
  try {
    const data = await disputes.updateDisputeStatus({
      disputeId: req.validatedParams.disputeId,
      adminId: req.user.id,
      status: req.body.status,
    });
    for (const recipientUserId of new Set([
      data.Initiator?.id,
      data.Respondent?.id,
    ])) {
      queueDisputeNotification({
        event: "dispute_status_changed",
        recipientUserId,
        disputeId: data.id,
      });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
export const resolve = async (req, res, next) => {
  try {
    const data = await disputes.resolveDispute({
      disputeId: req.validatedParams.disputeId,
      adminId: req.user.id,
      payload: req.body,
    });
    for (const recipientUserId of new Set([
      data.Initiator?.id,
      data.Respondent?.id,
    ])) {
      queueDisputeNotification({
        event: "dispute_resolved",
        recipientUserId,
        disputeId: data.id,
      });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
