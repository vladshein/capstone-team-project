import { Op } from "sequelize";
import { monopayService } from "../services/monopayService.js";
import {
  sequelize,
  Shift,
  ShiftApplication,
  Wallet,
  Transaction,
} from "../db/models/index.js";
import HttpError from "../helpers/HttpError.js";

export const createShiftInvoice = async (req, res, next) => {
  try {
    const { shiftId, applicationId } = req.body;
    const userId = req.user.id;

    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
      throw HttpError(404, "Зміну не знайдено");
    }

    if (shift.status === "booked" || shift.status === "completed") {
      throw HttpError(400, "Ця зміна вже заброньована або завершена");
    }

    const application = await ShiftApplication.findByPk(applicationId);
    if (!application) {
      throw HttpError(404, "Заявку не знайдено");
    }

    // 1. Захист від подвійного створення (Idempotency):
    // шукаємо активну транзакцію, створену менше 15 хвилин тому
    const [existingTxs] = await sequelize.query(
      `SELECT * FROM transactions 
       WHERE "shiftId" = :shiftId AND status = 'pending'
         AND created_at > NOW() - INTERVAL '15 minutes'
       ORDER BY id DESC LIMIT 1`,
      { replacements: { shiftId } },
    );

    const existingTx = existingTxs && existingTxs[0];
    const invoiceId = existingTx?.external_id;

    if (existingTx && invoiceId) {
      try {
        const monoStatus = await monopayService.getInvoiceStatus(invoiceId);
        if (monoStatus.status === "success" || monoStatus.status === "hold") {
          throw HttpError(
            409,
            "Оплата вже обробляється. Оновіть сторінку через кілька секунд.",
          );
        }

        // Status endpoint does not return pageUrl, so an active old invoice
        // cannot be reopened. Cancel it before creating a fresh invoice.
        if (
          monoStatus.status === "created" ||
          monoStatus.status === "processing"
        ) {
          await monopayService.cancelHold(invoiceId);
          await sequelize.query(
            `UPDATE transactions SET status = 'cancelled' WHERE id = :id`,
            { replacements: { id: existingTx.id } },
          );
        }
      } catch (error) {
        if (error.status === 409) {
          throw error;
        }

        // If the old invoice cannot be checked or cancelled, create a fresh one below.
      }
    }

    // 2. Розрахунок суми оплати та комісії платформи (15%)
    const start = new Date(shift.startTime).getTime();
    const end = new Date(shift.endTime).getTime();
    const durationHours = Math.max((end - start) / (1000 * 60 * 60), 1);
    const hourlyRate = Number(shift.hourlyRate) || 0;
    const bonusRate = Number(shift.bonusRate) || 0;

    // Чистий заробіток виконавця
    const workerAmount = Math.round((hourlyRate + bonusRate) * durationHours);

    // 15% комісія платформи з роботодавця
    const PLATFORM_FEE_PERCENT = 0.15;
    const platformFee = Math.round(workerAmount * PLATFORM_FEE_PERCENT);
    const totalAmount = workerAmount + platformFee;

    // 3. Створення рахунку в Monobank на повну суму (ставка + комісія)
    const invoice = await monopayService.createInvoice({
      amount: totalAmount,
      shiftId: shift.id,
      applicationId: application.id,
    });

    // 4. Фіксація транзакції зі статусом pending
    await Transaction.create({
      senderId: userId,
      receiverId: application.workerId,
      shiftId: shift.id,
      amount: totalAmount,
      type: "hold",
      status: "pending",
      externalId: invoice.invoiceId,
      description: `Холдування коштів (вкл. комісію 15%) для заявки #${application.id} на зміну #${shift.id}`,
    });

    res.status(200).json({
      pageUrl: invoice.pageUrl,
      invoiceId: invoice.invoiceId,
      amount: totalAmount,
      workerAmount,
      fee: platformFee,
    });
  } catch (error) {
    next(error);
  }
};

export const handleMonoWebhook = async (req, res, next) => {
  try {
    const { invoiceId, status, failureReason } = req.body;
    console.log(
      `\n🔔 [MonoPay Webhook] invoiceId: ${invoiceId}, status: ${status}`,
    );

    if (!invoiceId) {
      return res.status(400).json({ message: "Missing invoiceId" });
    }

    const [transactions] = await sequelize.query(
      `SELECT id, "shiftId", "receiverId" 
       FROM transactions 
       WHERE external_id = :invoiceId
       LIMIT 1`,
      { replacements: { invoiceId } },
    );

    const tx = transactions && transactions[0];
    if (!tx) {
      console.warn(
        `⚠️ [MonoPay Webhook] Transaction not found for invoiceId: ${invoiceId}`,
      );
      return res
        .status(200)
        .json({ message: "Transaction not found, skipped" });
    }

    const currentShiftId = tx.shiftId;
    const targetWorkerId = tx.receiverId;

    if (status === "success" || status === "hold") {
      await sequelize.query(
        `UPDATE transactions SET status = 'completed' WHERE id = :id`,
        { replacements: { id: tx.id } },
      );

      if (currentShiftId) {
        // Оновлюємо статус зміни тільки якщо вона ще НЕ completed і НЕ cancelled
        await sequelize.query(
          `UPDATE shifts 
                     SET status = 'booked' 
                     WHERE id = :shiftId AND status NOT IN ('completed', 'cancelled')`,
          { replacements: { shiftId: currentShiftId } },
        );

        // Оновлюємо статус заявки тільки якщо вона не completed / no_show
        if (targetWorkerId) {
          await sequelize.query(
            `UPDATE shift_applications 
                         SET status = 'approved' 
                         WHERE "shiftId" = :shiftId 
                           AND "workerId" = :workerId 
                           AND status NOT IN ('completed', 'no_show')`,
            {
              replacements: {
                shiftId: currentShiftId,
                workerId: targetWorkerId,
              },
            },
          );
        } else {
          await sequelize.query(
            `UPDATE shift_applications 
                         SET status = 'approved' 
                         WHERE id = (
                           SELECT id FROM shift_applications 
                           WHERE "shiftId" = :shiftId AND status = 'pending' 
                           ORDER BY id ASC LIMIT 1
                         )`,
            { replacements: { shiftId: currentShiftId } },
          );
        }

        await sequelize.query(
          `UPDATE shift_applications 
                     SET status = 'rejected' 
                     WHERE "shiftId" = :shiftId AND status = 'pending'`,
          { replacements: { shiftId: currentShiftId } },
        );

        console.log(
          `✅ [MonoPay Webhook] Handled invoice #${invoiceId} for shift #${currentShiftId}!`,
        );
      }
    } else if (
      status === "failure" ||
      status === "reversed" ||
      status === "expired"
    ) {
      // Відхилення/таймаут: позначаємо транзакцію як failed, повертаємо зміну в open тільки якщо вона не завершена
      await sequelize.query(
        `UPDATE transactions SET status = 'failed' WHERE id = :id`,
        { replacements: { id: tx.id } },
      );

      if (currentShiftId) {
        await sequelize.query(
          `UPDATE shifts 
                     SET status = 'open' 
                     WHERE id = :shiftId AND status NOT IN ('completed', 'cancelled')`,
          { replacements: { shiftId: currentShiftId } },
        );
      }

      console.log(
        `❌ [MonoPay Webhook] Payment ${status}: ${failureReason || ""}`,
      );
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ [MonoPay Webhook] Crash:", error);
    return res.status(200).json({ status: "ok" });
  }
};

export const verifyShiftInvoice = async (req, res, next) => {
  try {
    const { shiftId } = req.params;

    const [transactions] = await sequelize.query(
      `SELECT * FROM transactions 
       WHERE "shiftId" = :shiftId 
       ORDER BY id DESC LIMIT 1`,
      { replacements: { shiftId } },
    );

    const tx = transactions && transactions[0];
    if (!tx) {
      return res.status(200).json({ success: false, status: "no_transaction" });
    }

    if (tx.status === "completed") {
      return res.status(200).json({ success: true, status: "completed" });
    }

    const invoiceId = tx.external_id;
    let monoStatus = null;

    if (invoiceId) {
      try {
        monoStatus = await monopayService.getInvoiceStatus(invoiceId);
      } catch {
        // Ігноруємо мережеві помилки
      }
    }

    const isPaid =
      monoStatus?.status === "success" || monoStatus?.status === "hold";
    const isFailed =
      monoStatus?.status === "failure" ||
      monoStatus?.status === "reversed" ||
      monoStatus?.status === "expired";

    if (isPaid) {
      await sequelize.query(
        `UPDATE transactions SET status = 'completed' WHERE id = :id`,
        {
          replacements: { id: tx.id },
        },
      );

      await sequelize.query(
        `UPDATE shifts SET status = 'booked' WHERE id = :shiftId`,
        {
          replacements: { shiftId },
        },
      );

      const targetWorkerId = tx.receiverId;
      if (targetWorkerId) {
        await sequelize.query(
          `UPDATE shift_applications 
           SET status = 'approved' 
           WHERE "shiftId" = :shiftId AND "workerId" = :workerId`,
          { replacements: { shiftId, workerId: targetWorkerId } },
        );
      } else {
        await sequelize.query(
          `UPDATE shift_applications 
           SET status = 'approved' 
           WHERE id = (
             SELECT id FROM shift_applications 
             WHERE "shiftId" = :shiftId AND status = 'pending' 
             ORDER BY id ASC LIMIT 1
           )`,
          { replacements: { shiftId } },
        );
      }

      await sequelize.query(
        `UPDATE shift_applications 
         SET status = 'rejected' 
         WHERE "shiftId" = :shiftId AND status = 'pending'`,
        { replacements: { shiftId } },
      );

      return res.status(200).json({ success: true, status: "approved" });
    }

    if (isFailed) {
      await sequelize.query(
        `UPDATE transactions SET status = 'failed' WHERE id = :id`,
        {
          replacements: { id: tx.id },
        },
      );
      return res.status(200).json({ success: false, status: "failed" });
    }

    return res.status(200).json({ success: false, status: tx.status });
  } catch (error) {
    next(error);
  }
};

export const getWalletOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let [wallet] = await Wallet.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        balance: 0,
        frozenBalance: 0,
        currency: "UAH",
      },
    });

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      order: [["created_at", "DESC"]],
      limit: 15,
    });

    const walletTransactions = transactions.map((transaction) => {
      const data = transaction.toJSON();

      return {
        ...data,
        createdAt: data.created_at ?? data.createdAt,
      };
    });

    res.status(200).json({
      wallet: {
        id: wallet.id,
        balance: Number(wallet.balance),
        frozenBalance: Number(wallet.frozenBalance),
        currency: wallet.currency || "UAH",
      },
      transactions: walletTransactions,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyInvoiceStatus = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    const [transactions] = await sequelize.query(
      `SELECT * FROM transactions 
       WHERE external_id = :invoiceId
       LIMIT 1`,
      { replacements: { invoiceId } },
    );

    const tx = transactions && transactions[0];
    if (!tx) {
      throw HttpError(404, "Транзакцію не знайдено");
    }

    const monoStatus = await monopayService.getInvoiceStatus(invoiceId);
    const status = monoStatus.status;

    if (status === "success" || status === "hold") {
      await sequelize.query(
        `UPDATE transactions SET status = 'completed' WHERE id = :id`,
        { replacements: { id: tx.id } },
      );

      if (tx.shiftId) {
        await Shift.update({ status: "booked" }, { where: { id: tx.shiftId } });
        await ShiftApplication.update(
          { status: "approved" },
          { where: { shiftId: tx.shiftId, status: "pending" } },
        );
      }
    }

    res.status(200).json({ status: tx.status, monoStatus });
  } catch (error) {
    next(error);
  }
};
