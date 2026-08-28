import * as shiftService from "../services/shiftServices.js";
import { sequelize, Wallet, Transaction } from "../db/models/index.js";
import { monopayService } from "../services/monopayService.js";

const parseList = (value) =>
  typeof value === "string"
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : Array.isArray(value)
      ? value.map(String).map((item) => item.trim()).filter(Boolean)
      : undefined;

const parseShiftFilters = (query) => {
  const {
    minPrice,
    maxPrice,
    categoryId,
    categoryIds,
    partners,
    city,
    dateFrom,
    dateTo,
    durationFilters,
    sort,
    latitude,
    longitude,
    radiusKm,
  } = query;

  return {
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
    categoryIds: parseList(categoryIds),
    partners: parseList(partners),
    city: typeof city === "string" ? city.trim() || undefined : undefined,
    dateFrom: typeof dateFrom === "string" && !Number.isNaN(Date.parse(dateFrom)) ? dateFrom : undefined,
    dateTo: typeof dateTo === "string" && !Number.isNaN(Date.parse(dateTo)) ? dateTo : undefined,
    durationFilters: parseList(durationFilters),
    sort: ["relevance", "price_desc", "date_asc", "date_desc", "nearest"].includes(sort)
      ? sort
      : "relevance",
    latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : undefined,
    longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : undefined,
    radiusKm: Number.isFinite(Number(radiusKm))
      ? Math.min(Math.max(Number(radiusKm), 1), 50)
      : undefined,
  };
};

/**
 * Обробляє запит на отримання всіх змін.
 */
export const getAllShifts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const result = await shiftService.getAllShifts({
      page,
      limit,
      ...parseShiftFilters(req.query),
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Повертає мінімальні дані для маркерів на карті.
 */
export const getShiftMapMarkers = async (req, res, next) => {
  try {
    const filters = parseShiftFilters(req.query);
    const hasRadiusSearch =
      Number.isFinite(filters.latitude) &&
      Number.isFinite(filters.longitude) &&
      Boolean(filters.radiusKm);

    if (!filters.city && !hasRadiusSearch) {
      return res.status(400).json({
        message: "Для карти потрібно визначити місто або локацію користувача.",
      });
    }

    const result = await shiftService.getShiftMapMarkers(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на отримання конкретної зміни за ID.
 */
export const getShiftById = async (req, res, next) => {
  try {
    const shiftId = req.params.id;
    const shift = await shiftService.getShiftById(shiftId);

    if (!shift) {
      const error = new Error("Shift not found.");
      error.status = 404;
      throw error;
    }

    res.status(200).json(shift);
  } catch (error) {
    next(error);
  }
};

/** Повертає активні або архівні зміни конкретної компанії-власника. */
export const getBusinessShifts = async (req, res, next) => {
  try {
    const companyId = Number(req.query.companyId);
    if (!Number.isInteger(companyId) || companyId < 1) {
      return res.status(400).json({ message: "Потрібно вказати коректну компанію." });
    }

    const scope = req.query.scope === "archive" ? "archive" : "active";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 50);
    const shifts = await shiftService.getBusinessShifts({
      companyId,
      ownerId: req.user.id,
      scope,
      page,
      limit,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(shifts);
  } catch (error) {
    next(error);
  }
};

/** Повертає заявки виконавців на зміни вказаної компанії. */
export const getBusinessShiftApplications = async (req, res, next) => {
  try {
    const companyId = Number(req.query.companyId);
    if (!Number.isInteger(companyId) || companyId < 1) {
      return res.status(400).json({ message: "Потрібно вказати коректну компанію." });
    }

    const query = {
      companyId,
      ownerId: req.user.id,
      page: Math.max(parseInt(req.query.page, 10) || 1, 1),
      limit: Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 50),
    };

    if (req.query.summary === "true") {
      const pendingCount = await shiftService.getPendingBusinessShiftApplicationsCount(query);
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ pendingCount });
    }

    const applications = await shiftService.getBusinessShiftApplications(query);

    res.set("Cache-Control", "no-store");
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

/** Повертає виконавця та відгук для архівної зміни власника компанії. */
export const getBusinessShiftWorkerSummary = async (req, res, next) => {
  try {
    const shiftId = Number(req.params.id);
    if (!Number.isInteger(shiftId) || shiftId < 1) {
      return res.status(400).json({ message: "Некоректний ідентифікатор зміни." });
    }
    const summary = await shiftService.getBusinessShiftWorkerSummary({ shiftId, ownerId: req.user.id });
    if (!summary) return res.status(404).json({ message: "Виконавця для цієї зміни не знайдено." });
    res.status(200).json({ data: summary });
  } catch (error) {
    next(error);
  }
};

/** Підтверджує або відхиляє заявку виконавця на зміну власника компанії. */
export const decideBusinessShiftApplication = async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const decision = req.body?.status;
    if (!Number.isInteger(applicationId) || applicationId < 1) {
      return res.status(400).json({ message: "Некоректний ідентифікатор заявки." });
    }
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Оберіть: підтвердити або відхилити заявку." });
    }

    const result = await shiftService.decideBusinessShiftApplication({
      applicationId,
      ownerId: req.user.id,
      decision,
    });
    if (result.reason === "not_found") return res.status(404).json({ message: "Заявку не знайдено." });
    if (result.reason === "forbidden") return res.status(403).json({ message: "У вас немає доступу до цієї заявки." });
    if (result.reason === "status") return res.status(400).json({ message: "Цю заявку вже розглянуто." });
    if (result.reason === "unavailable") return res.status(400).json({ message: "Зміна вже недоступна для призначення виконавця." });

    res.set("Cache-Control", "no-store");
    res.status(200).json({ message: decision === "approved" ? "Заявку підтверджено." : "Заявку відхилено.", data: result.application });
  } catch (error) {
    next(error);
  }
};

/** Підтверджує, що виконавець завершив підтверджену зміну (фіналізація коштів). */
export const completeBusinessShiftApplication = async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isInteger(applicationId) || applicationId < 1) {
      return res.status(400).json({ message: "Некоректний ідентифікатор заявки." });
    }

    const result = await shiftService.completeBusinessShiftApplication({
      applicationId,
      ownerId: req.user.id,
    });
    if (result.reason === "not_found") return res.status(404).json({ message: "Заявку не знайдено." });
    if (result.reason === "forbidden") return res.status(403).json({ message: "У вас немає доступу до цієї заявки." });
    if (result.reason === "status") return res.status(400).json({ message: "Можна завершити лише підтверджену зміну." });
    if (result.reason === "not_finished") return res.status(400).json({ message: "Підтвердити виконання можна після завершення зміни." });

    const shiftId = result.application.shiftId;
    const workerId = result.application.workerId;

    // 1. Шукаємо холд-транзакцію для цієї зміни
    const [transactions] = await sequelize.query(
      `SELECT * FROM transactions 
       WHERE "shiftId" = :shiftId AND status = 'completed' AND type = 'hold'
       ORDER BY id DESC LIMIT 1`,
      { replacements: { shiftId } }
    );

    const holdTx = transactions && transactions[0];
    if (holdTx) {
      const invoiceId = holdTx.external_id || holdTx.externalId;
      const totalHeldAmount = Number(holdTx.amount);

      // Вираховуємо чисту суму виконавця (віднімаємо 15% комісії від суми холду)
      // Формула: workerPayout = totalHeldAmount / 1.15
      const workerPayout = Math.round(totalHeldAmount / 1.15);
      const platformFee = totalHeldAmount - workerPayout;

      // 2. Списуємо заблоковані кошти в Monobank (повну суму)
      if (invoiceId) {
        await monopayService.finalizeHold(invoiceId, totalHeldAmount).catch((err) => {
          console.warn("⚠️ Mono finalize warning:", err.message);
        });
      }

      // 3. Зараховуємо чисті кошти у гаманець виконавця
      const [workerWallet] = await Wallet.findOrCreate({
        where: { userId: workerId },
        defaults: { userId: workerId, balance: 0, currency: "UAH" },
      });

      await workerWallet.increment("balance", { by: workerPayout });

      // 4. Фіксуємо транзакцію виплати для виконавця
      await Transaction.create({
        senderId: holdTx.senderId,
        receiverId: workerId,
        shiftId,
        amount: workerPayout,
        type: "release_payout",
        status: "completed",
        description: `Виплата за зміну #${shiftId} (комісія сервісу: ${platformFee / 100} грн)`,
      });
    }

    res.set("Cache-Control", "no-store");
    res.status(200).json({ message: "Виконання зміни підтверджено.", data: result.application });
  } catch (error) {
    next(error);
  }
};

/** Позначає підтвердженого виконавця як такого, що не з'явився (розблокування коштів). */
export const markBusinessShiftApplicationNoShow = async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isInteger(applicationId) || applicationId < 1) {
      return res.status(400).json({ message: "Некоректний ідентифікатор заявки." });
    }

    const result = await shiftService.markBusinessShiftApplicationNoShow({
      applicationId,
      ownerId: req.user.id,
    });
    if (result.reason === "not_found") return res.status(404).json({ message: "Заявку не знайдено." });
    if (result.reason === "forbidden") return res.status(403).json({ message: "У вас немає доступу до цієї заявки." });
    if (result.reason === "status") return res.status(400).json({ message: "Неявку можна позначити лише для підтвердженої зміни." });
    if (result.reason === "not_finished") return res.status(400).json({ message: "Позначити неявку можна після завершення зміни." });

    const shiftId = result.application.shiftId;

    // 1. Знаходимо заблоковану транзакцію
    const [transactions] = await sequelize.query(
      `SELECT * FROM transactions 
       WHERE "shiftId" = :shiftId AND status = 'completed' AND type = 'hold'
       ORDER BY id DESC LIMIT 1`,
      { replacements: { shiftId } }
    );

    const holdTx = transactions && transactions[0];
    if (holdTx) {
      const invoiceId = holdTx.external_id || holdTx.externalId;

      // 2. Скасовуємо холд у Monobank
      if (invoiceId) {
        await monopayService.cancelHold(invoiceId).catch((err) => {
          console.warn("⚠️ Mono cancel hold warning:", err.message);
        });
      }

      // 3. Позначаємо транзакцію як cancelled (скасовано/повернуто)
      await sequelize.query(
        `UPDATE transactions SET status = 'cancelled' WHERE id = :id`,
        { replacements: { id: holdTx.id } }
      );
    }

    res.set("Cache-Control", "no-store");
    res.status(200).json({ message: "Неявку виконавця зафіксовано.", data: result.application });
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на створення нової зміни.
 */
export const createShift = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      locationId,
      positionId,
      categoryId,
      startTime,
      endTime,
      hourlyRate,
      bonusRate,
      description,
    } = req.body;

    if (new Date(startTime) <= new Date()) {
      const error = new Error("Час початку зміни має бути в майбутньому.");
      error.status = 400;
      throw error;
    }

    const hasLocationAccess = await shiftService.verifyLocationOwnership(
      locationId,
      userId,
    );
    if (!hasLocationAccess) {
      const error = new Error("У вас немає прав створювати зміну на цій локації.");
      error.status = 403;
      throw error;
    }

    const newShift = await shiftService.createShift({
      locationId,
      positionId,
      categoryId,
      startTime,
      endTime,
      hourlyRate,
      bonusRate: bonusRate || 0.0,
      description,
      status: "open",
    });

    res.status(201).json({
      message: "Зміну успішно створено",
      data: newShift,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Створює відгук виконавця на відкриту зміну.
 */
export const applyToShift = async (req, res, next) => {
  try {
    const shiftId = Number(req.params.id);
    const workerId = req.user.id;
    const shift = await shiftService.getShiftById(shiftId);

    if (!shift) {
      const error = new Error("Зміну не знайдено.");
      error.status = 404;
      throw error;
    }

    if (shift.status !== "open") {
      const error = new Error("На цю зміну вже не можна відгукнутися.");
      error.status = 400;
      throw error;
    }
    if (new Date(shift.startTime) <= new Date()) {
      const error = new Error("Відгукнутися можна лише до початку зміни.");
      error.status = 400;
      throw error;
    }

    const existingApplication = await shiftService.findShiftApplication(
      shiftId,
      workerId,
    );
    if (existingApplication) {
      const error = new Error("Ви вже відгукнулися на цю зміну.");
      error.status = 409;
      throw error;
    }

    const application = await shiftService.createShiftApplication(
      shiftId,
      workerId,
    );

    res.status(201).json({
      message: "Відгук на зміну надіслано.",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/** Відкликати власну заявку на зміну до її початку. */
export const cancelWorkerApplication = async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      const error = new Error("Некоректний ідентифікатор заявки.");
      error.status = 400;
      throw error;
    }

    const result = await shiftService.cancelWorkerShiftApplication(applicationId, req.user.id);
    if (result.reason === "not_found") {
      const error = new Error("Заявку не знайдено.");
      error.status = 404;
      throw error;
    }
    if (result.reason === "status") {
      const error = new Error("Цю заявку вже не можна скасувати.");
      error.status = 400;
      throw error;
    }
    if (result.reason === "started") {
      const error = new Error("Не можна скасувати заявку після початку зміни.");
      error.status = 400;
      throw error;
    }

    res.status(200).json({ message: "Заявку скасовано." });
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на оновлення зміни (тільки для власника)
 */
export const updateShift = async (req, res, next) => {
  try {
    const shiftId = req.params.id;
    const userId = req.user.id;

    const shift = await shiftService.getShiftById(shiftId);
    if (!shift) {
      const error = new Error("Зміну не знайдено.");
      error.status = 404;
      throw error;
    }

    if (shift.Location.Company.ownerId !== userId) {
      const error = new Error("У вас немає прав на редагування цієї зміни.");
      error.status = 403;
      throw error;
    }

    if (shift.status !== "open") {
      const error = new Error(
        "Не можна редагувати зміну, яка вже заброньована робітником або завершена.",
      );
      error.status = 400;
      throw error;
    }
    if (new Date(shift.startTime) <= new Date()) {
      const error = new Error("Не можна редагувати зміну після її початку.");
      error.status = 400;
      throw error;
    }
    if (req.body.startTime && new Date(req.body.startTime) <= new Date()) {
      const error = new Error("Час початку зміни має бути в майбутньому.");
      error.status = 400;
      throw error;
    }

    const updatedShift = await shiftService.updateShift(shiftId, req.body);

    res.status(200).json({
      message: "Зміну успішно оновлено",
      data: updatedShift,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на скасування зміни (з поверненням холду, якщо зміна була заброньована)
 */
export const cancelShift = async (req, res, next) => {
  try {
    const shiftId = req.params.id;
    const userId = req.user.id;

    const shift = await shiftService.getShiftById(shiftId);
    if (!shift) {
      const error = new Error("Зміну не знайдено.");
      error.status = 404;
      throw error;
    }

    if (shift.Location.Company.ownerId !== userId) {
      const error = new Error("У вас немає прав на скасування цієї зміни.");
      error.status = 403;
      throw error;
    }

    if (shift.status === "cancelled" || shift.status === "completed") {
      const error = new Error(
        "Цю зміну не можна скасувати, вона вже завершена або скасована раніше.",
      );
      error.status = 400;
      throw error;
    }
    if (new Date(shift.startTime) <= new Date()) {
      const error = new Error("Не можна скасувати зміну після її початку.");
      error.status = 400;
      throw error;
    }

    // Якщо зміна була заброньована — скасовуємо заблокований холд
    if (shift.status === "booked") {
      const [transactions] = await sequelize.query(
        `SELECT * FROM transactions 
         WHERE "shiftId" = :shiftId AND status = 'completed' AND type = 'hold'
         ORDER BY id DESC LIMIT 1`,
        { replacements: { shiftId } }
      );

      const holdTx = transactions && transactions[0];
      if (holdTx) {
        const invoiceId = holdTx.external_id || holdTx.externalId;
        if (invoiceId) {
          await monopayService.cancelHold(invoiceId).catch((err) => {
            console.warn("⚠️ Mono cancel hold on shift cancellation warning:", err.message);
          });
        }

        // Оновлюємо статус транзакції на 'cancelled'
        await sequelize.query(
          `UPDATE transactions SET status = 'cancelled' WHERE id = :id`,
          { replacements: { id: holdTx.id } }
        );
      }
    }

    const cancelledShift = await shiftService.cancelShift(shiftId);

    res.status(200).json({
      message: "Зміну успішно скасовано",
      data: cancelledShift,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на отримання історії робіт для виконавця.
 */
export const getWorkerShifts = async (req, res, next) => {
  try {
    const workerId = req.user.id;
    const { page, limit, status, shiftId, scope } = req.query;

    const result = await shiftService.getWorkerShiftHistory(workerId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status,
      shiftId: shiftId ? parseInt(shiftId, 10) : undefined,
      scope: ["active", "completed", "archive"].includes(scope) ? scope : "active",
    });

    res.status(200).json({
      message: "Історію робіт успішно отримано",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};