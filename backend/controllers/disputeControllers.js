import * as disputes from "../services/disputeServices.js";

const pageOptions = (query) => ({
  page: Math.max(Number(query.page) || 1, 1),
  limit: Math.min(Math.max(Number(query.limit) || 20, 1), 100),
  status: query.status,
});

export const createDispute = async (req, res, next) => {
  try {
    const data = await disputes.createDispute({
      user: req.user,
      payload: req.body,
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
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};
export const addEvidence = async (req, res, next) => {
  try {
    const files = req.files ?? [];
    if (!files.length)
      return res.status(400).json({ message: "Додайте хоча б один файл." });
    const data = await disputes.addEvidence({
      disputeId: req.validatedParams.disputeId,
      user: req.user,
      files,
    });
    res.status(201).json({ data });
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
export const updateStatus = async (req, res, next) => {
  try {
    const data = await disputes.updateDisputeStatus({
      disputeId: req.validatedParams.disputeId,
      adminId: req.user.id,
      status: req.body.status,
    });
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
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
