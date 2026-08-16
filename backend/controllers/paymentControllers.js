import * as paymentService from "../services/paymentServices.js";

export const createShiftCheckout = async (req, res, next) => {
  try {
    const result = await paymentService.createLiqPayCheckout({ shiftId: Number(req.params.shiftId), ownerId: req.user.id });
    const messages = {
      not_found: [404, "Зміну не знайдено."], forbidden: [403, "У вас немає доступу до цієї зміни."],
      no_worker: [400, "Спершу підтвердьте заявку робітника."], worker_not_connected: [400, "Робітник ще не підключив LiqPay для виплат."],
      already_exists: [409, "Для цієї зміни вже створено платіж."], invalid_amount: [400, "Некоректна сума платежу."],
      not_configured: [503, "LiqPay ще не налаштовано."],
    };
    if (result.reason) return res.status(messages[result.reason][0]).json({ message: messages[result.reason][1], data: result.payment });
    res.status(201).json({ message: "Платіж створено.", data: result.checkout, payment: result.payment });
  } catch (error) { next(error); }
};

export const liqPayCallback = async (req, res, next) => {
  try {
    const result = await paymentService.processLiqPayCallback(req.body ?? {});
    if (result.reason === "invalid_signature") return res.status(403).send("invalid signature");
    if (result.reason) return res.status(400).send(result.reason);
    res.status(200).send("ok");
  } catch (error) { next(error); }
};

export const getMyPayments = async (req, res, next) => {
  try { res.status(200).json({ data: await paymentService.getMyPayments(req.user.id, req.user.role) }); }
  catch (error) { next(error); }
};
