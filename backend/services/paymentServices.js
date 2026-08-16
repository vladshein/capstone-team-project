import crypto from "node:crypto";
import { Company, Location, Shift, ShiftApplication, Transaction, User, Wallet, WorkerProfile } from "../db/models/index.js";

const LIQPAY_CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";
const completedStatuses = new Set(["success", "sandbox"]);

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const paymentOrderId = (shiftId) => `zmina-shift-${shiftId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

export const makeLiqPaySignature = (data) => crypto
  .createHash("sha3-256")
  .update(`${process.env.LIQPAY_PRIVATE_KEY}${data}${process.env.LIQPAY_PRIVATE_KEY}`)
  .digest("base64");

const getShiftPaymentContext = async (shiftId, ownerId, transaction) => {
  const shift = await Shift.findByPk(shiftId, {
    include: [{ model: Location, required: true, include: [{ model: Company, required: true }] }],
    transaction,
    lock: transaction?.LOCK.UPDATE,
  });
  if (!shift) return { reason: "not_found" };
  if (shift.Location.Company.ownerId !== ownerId) return { reason: "forbidden" };

  const application = await ShiftApplication.findOne({
    where: { shiftId, status: "approved" },
    include: [{ model: User, required: true, include: [{ model: WorkerProfile, required: true }] }],
    transaction,
    lock: transaction?.LOCK.UPDATE,
  });
  if (!application) return { reason: "no_worker" };
  return { shift, application };
};

export const createLiqPayCheckout = async ({ shiftId, ownerId }) => {
  if (!process.env.LIQPAY_PUBLIC_KEY || !process.env.LIQPAY_PRIVATE_KEY || !process.env.PAYMENT_CALLBACK_URL) {
    return { reason: "not_configured" };
  }

  return Shift.sequelize.transaction(async (transaction) => {
    const context = await getShiftPaymentContext(shiftId, ownerId, transaction);
    if (context.reason) return context;
    const { shift, application } = context;
    const existing = await Transaction.findOne({
      where: { shiftId, receiverId: application.workerId, provider: "liqpay", status: ["pending", "completed"] },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existing) return { reason: "already_exists", payment: existing };

    const hours = (new Date(shift.endTime) - new Date(shift.startTime)) / 3_600_000;
    const grossAmount = money(hours * Number(shift.hourlyRate) + Number(shift.bonusRate || 0));
    const feePercent = Math.min(Math.max(Number(process.env.LIQPAY_PLATFORM_COMMISSION_PERCENT ?? 10), 0), 100);
    const platformFee = money(grossAmount * feePercent / 100);
    const workerAmount = money(grossAmount - platformFee);
    const workerKey = application.User.WorkerProfile.liqpayPublicKey;
    if (!workerKey) return { reason: "worker_not_connected" };
    if (workerAmount <= 0) return { reason: "invalid_amount" };

    const orderId = paymentOrderId(shift.id);
    const payment = await Transaction.create({
      orderId, provider: "liqpay", amount: grossAmount, workerAmount, platformFee,
      type: "release_payout", status: "pending", providerStatus: "created",
      senderId: ownerId, receiverId: application.workerId, shiftId: shift.id,
    }, { transaction });

    const splitRules = [
      { public_key: workerKey, amount: workerAmount, commission_payer: "sender", server_url: process.env.PAYMENT_CALLBACK_URL },
    ];
    if (platformFee > 0) {
      splitRules.push({ public_key: process.env.LIQPAY_PUBLIC_KEY, amount: platformFee, commission_payer: "sender", server_url: process.env.PAYMENT_CALLBACK_URL });
    }
    const payload = {
      public_key: process.env.LIQPAY_PUBLIC_KEY, version: "3", action: "paysplit",
      amount: grossAmount, currency: "UAH", description: `Оплата зміни #${shift.id}`,
      order_id: orderId, server_url: process.env.PAYMENT_CALLBACK_URL,
      result_url: `${process.env.FRONTEND_URL}/dashboard/payments?order=${orderId}`,
      language: "uk", split_rules: JSON.stringify(splitRules),
    };
    const data = Buffer.from(JSON.stringify(payload)).toString("base64");
    return { payment, checkout: { action: LIQPAY_CHECKOUT_URL, data, signature: makeLiqPaySignature(data) } };
  });
};

export const processLiqPayCallback = async ({ data, signature }) => {
  if (!data || !signature || !process.env.LIQPAY_PRIVATE_KEY) return { reason: "invalid_signature" };
  const expected = makeLiqPaySignature(data);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  const valid = receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  if (!valid) return { reason: "invalid_signature" };

  let payload;
  try { payload = JSON.parse(Buffer.from(data, "base64").toString("utf8")); } catch { return { reason: "invalid_payload" }; }
  if (!payload.order_id) return { reason: "invalid_payload" };

  return Transaction.sequelize.transaction(async (transaction) => {
    const payment = await Transaction.findOne({ where: { orderId: payload.order_id, provider: "liqpay" }, transaction, lock: transaction.LOCK.UPDATE });
    if (!payment) return { reason: "not_found" };
    if (payment.status === "completed") return { payment, duplicate: true };

    const isPaid = completedStatuses.has(payload.status);
    await payment.update({
      status: isPaid ? "completed" : "failed", providerStatus: payload.status ?? "unknown",
      providerPayload: payload, confirmedAt: new Date(),
    }, { transaction });
    if (isPaid) {
      const [wallet] = await Wallet.findOrCreate({ where: { userId: payment.receiverId }, defaults: { balance: 0, frozenBalance: 0 }, transaction });
      await wallet.increment("balance", { by: Number(payment.workerAmount), transaction });
    }
    return { payment };
  });
};

export const getMyPayments = async (userId, role) => {
  const where = role === "worker" ? { receiverId: userId } : { senderId: userId };
  return Transaction.findAll({
    where,
    attributes: [
      "id", "orderId", "amount", "workerAmount", "platformFee", "status",
      "provider", "providerStatus", ["created_at", "createdAt"], "confirmedAt",
    ],
    include: [{ model: Shift, attributes: ["id", "startTime", "endTime"], include: [{ model: Location, attributes: ["title"], include: [{ model: Company, attributes: ["name"] }] }] }],
    // `createdAt` is mapped to `created_at` in the model. With an include,
    // Sequelize keeps this order field verbatim, so use the DB column name.
    order: [["created_at", "DESC"]],
  });
};
