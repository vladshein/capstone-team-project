import { Op, UniqueConstraintError } from "sequelize";
import {
  Company,
  Dispute,
  DisputeEvent,
  DisputeMessage,
  JobPosition,
  Location,
  Shift,
  ShiftApplication,
  User,
  WorkerProfile,
} from "../db/models/index.js";
import HttpError from "../helpers/HttpError.js";

const participantAttributes = ["id", "email", "avatar", "role"];
const userInclude = (as) => ({
  model: User,
  as,
  attributes: participantAttributes,
  include: [{ model: WorkerProfile, attributes: ["firstName", "lastName"] }],
});
const disputeInclude = [
  {
    model: Shift,
    attributes: [
      "id",
      "startTime",
      "endTime",
      "hourlyRate",
      "bonusRate",
      "status",
    ],
    include: [
      { model: JobPosition, attributes: ["id", "title"] },
      {
        model: Location,
        attributes: ["id", "title", "city"],
        include: [{ model: Company, attributes: ["id", "name", "ownerId"] }],
      },
    ],
  },
  userInclude("Initiator"),
  userInclude("Respondent"),
  { model: User, as: "AssignedAdmin", attributes: participantAttributes },
];

const activeStatuses = [
  "open",
  "awaiting_response",
  "under_review",
  "appealed",
];
const DISPUTE_OPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const addEvent = (disputeId, actorId, type, payload, transaction) =>
  DisputeEvent.create({ disputeId, actorId, type, payload }, { transaction });

const getShiftParticipants = async (shiftId, transaction) => {
  const shift = await Shift.findByPk(shiftId, {
    transaction,
    include: [
      {
        model: Location,
        attributes: ["id", "companyId"],
        include: [{ model: Company, attributes: ["id", "ownerId"] }],
      },
      {
        model: ShiftApplication,
        where: { status: { [Op.in]: ["completed", "no_show"] } },
        required: false,
        attributes: ["workerId", "status"],
      },
    ],
  });
  if (!shift) throw HttpError(404, "Зміну не знайдено.");
  if (shift.status !== "completed")
    throw HttpError(400, "Спір можна відкрити лише для завершеної зміни.");
  if (Date.now() > new Date(shift.endTime).getTime() + DISPUTE_OPEN_WINDOW_MS)
    throw HttpError(
      400,
      "Спір можна відкрити протягом 7 днів після завершення зміни.",
    );
  const workerId = shift.ShiftApplications?.[0]?.workerId;
  const companyOwnerId = shift.Location?.Company?.ownerId;
  if (!workerId || !companyOwnerId)
    throw HttpError(409, "Для зміни немає підтверджених учасників.");
  return { workerId, companyOwnerId };
};

const assertParticipant = (dispute, user) => {
  if (
    user.role === "admin" ||
    dispute.initiatorId === user.id ||
    dispute.respondentId === user.id
  )
    return;
  throw HttpError(403, "Ви не є учасником цього спору.");
};

export const createDispute = async ({ user, payload }) => {
  try {
    return await Dispute.sequelize.transaction(async (transaction) => {
      const { workerId, companyOwnerId } = await getShiftParticipants(
        payload.shiftId,
        transaction,
      );
      if (![workerId, companyOwnerId].includes(user.id))
        throw HttpError(403, "Ви не є стороною цієї зміни.");
      const respondentId = user.id === workerId ? companyOwnerId : workerId;
      const existing = await Dispute.findOne({
        where: {
          shiftId: payload.shiftId,
          status: { [Op.in]: activeStatuses },
        },
        transaction,
      });
      if (existing)
        throw HttpError(409, "Для цієї зміни вже є відкритий спір.");
      const dispute = await Dispute.create(
        { ...payload, initiatorId: user.id, respondentId, status: "open" },
        { transaction },
      );
      await addEvent(
        dispute.id,
        user.id,
        "created",
        {
          reason: payload.reason,
          disputedAmount: payload.disputedAmount ?? null,
        },
        transaction,
      );
      return getDisputeById(dispute.id, user, transaction);
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw HttpError(409, "Для цієї зміни вже є відкритий спір.");
    }
    throw error;
  }
};

export const getDisputeById = async (disputeId, user, transaction) => {
  const dispute = await Dispute.findByPk(disputeId, {
    transaction,
    include: [
      ...disputeInclude,
      {
        model: DisputeMessage,
        as: "Messages",
        include: [userInclude("Author")],
        separate: true,
        order: [["created_at", "ASC"]],
      },
      {
        model: DisputeEvent,
        as: "Events",
        include: [
          { model: User, as: "Actor", attributes: participantAttributes },
        ],
        separate: true,
        order: [["created_at", "ASC"]],
      },
    ],
  });
  if (!dispute) throw HttpError(404, "Спір не знайдено.");
  assertParticipant(dispute, user);
  return dispute;
};

export const getMyDisputes = async (
  user,
  { page = 1, limit = 20, status, shiftId, active = false, search } = {},
) => {
  const where =
    user.role === "admin"
      ? {}
      : { [Op.or]: [{ initiatorId: user.id }, { respondentId: user.id }] };
  if (status) where.status = status;
  if (active) where.status = { [Op.in]: activeStatuses };
  if (shiftId) where.shiftId = shiftId;
  const normalizedSearch = typeof search === "string" ? search.trim() : "";
  if (normalizedSearch) {
    const pattern = `%${normalizedSearch}%`;
    const searchConditions = [
      { "$Shift.Location.Company.name$": { [Op.iLike]: pattern } },
      { "$Shift.JobPosition.title$": { [Op.iLike]: pattern } },
      { "$Initiator.email$": { [Op.iLike]: pattern } },
      { "$Respondent.email$": { [Op.iLike]: pattern } },
      { "$Initiator.WorkerProfile.firstName$": { [Op.iLike]: pattern } },
      { "$Initiator.WorkerProfile.lastName$": { [Op.iLike]: pattern } },
      { "$Respondent.WorkerProfile.firstName$": { [Op.iLike]: pattern } },
      { "$Respondent.WorkerProfile.lastName$": { [Op.iLike]: pattern } },
    ];
    if (/^\d+$/.test(normalizedSearch)) {
      searchConditions.unshift({ id: Number(normalizedSearch) });
    }
    where[Op.and] = [{ [Op.or]: searchConditions }];
  }
  const { count, rows } = await Dispute.findAndCountAll({
    where,
    include: disputeInclude,
    order: [["created_at", "DESC"]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });
  return {
    data: rows,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  };
};

export const getDisputeStatusCounts = async () => {
  const statuses = [
    "open",
    "awaiting_response",
    "under_review",
    "resolved",
    "closed",
    "appealed",
  ];
  const counts = await Promise.all(
    statuses.map((status) => Dispute.count({ where: { status } })),
  );
  return Object.fromEntries(
    statuses.map((status, index) => [status, counts[index]]),
  );
};

export const addMessage = async ({ disputeId, user, message }) =>
  Dispute.sequelize.transaction(async (transaction) => {
    const dispute = await Dispute.findByPk(disputeId, { transaction });
    if (!dispute) throw HttpError(404, "Спір не знайдено.");
    assertParticipant(dispute, user);
    if (["resolved", "closed"].includes(dispute.status))
      throw HttpError(
        409,
        "До закритого спору не можна додавати повідомлення.",
      );
    const record = await DisputeMessage.create(
      { disputeId, authorId: user.id, message },
      { transaction },
    );
    await addEvent(disputeId, user.id, "message_added", null, transaction);
    return record;
  });

export const settleDispute = async ({ disputeId, user }) =>
  Dispute.sequelize.transaction(async (transaction) => {
    const dispute = await Dispute.findByPk(disputeId, { transaction });
    if (!dispute) throw HttpError(404, "Спір не знайдено.");
    if (dispute.respondentId !== user.id)
      throw HttpError(
        403,
        "Лише інша сторона спору може погодитися з вимогою.",
      );
    if (!["open", "awaiting_response"].includes(dispute.status))
      throw HttpError(409, "Цей спір уже має остаточний статус.");
    await dispute.update(
      { status: "closed", resolvedAt: new Date() },
      { transaction },
    );
    await addEvent(disputeId, user.id, "settled_by_parties", null, transaction);
    return getDisputeById(disputeId, user, transaction);
  });

export const escalateDispute = async ({ disputeId, user }) =>
  Dispute.sequelize.transaction(async (transaction) => {
    const dispute = await Dispute.findByPk(disputeId, { transaction });
    if (!dispute) throw HttpError(404, "Спір не знайдено.");
    if (dispute.respondentId !== user.id)
      throw HttpError(
        403,
        "Лише інша сторона спору може передати спір адміністратору.",
      );
    if (!["open", "awaiting_response"].includes(dispute.status))
      throw HttpError(409, "Цей спір уже має остаточний статус.");
    await dispute.update({ status: "under_review" }, { transaction });
    await addEvent(disputeId, user.id, "escalated_to_admin", null, transaction);
    return getDisputeById(disputeId, user, transaction);
  });

export const updateDisputeStatus = async ({ disputeId, adminId, status }) =>
  Dispute.sequelize.transaction(async (transaction) => {
    const dispute = await Dispute.findByPk(disputeId, { transaction });
    if (!dispute) throw HttpError(404, "Спір не знайдено.");
    if (["resolved", "closed"].includes(dispute.status))
      throw HttpError(409, "Статус закритого спору не можна змінити.");
    await dispute.update(
      { status, assignedAdminId: dispute.assignedAdminId ?? adminId },
      { transaction },
    );
    await addEvent(
      disputeId,
      adminId,
      "status_changed",
      { status },
      transaction,
    );
    return getDisputeById(
      disputeId,
      { id: adminId, role: "admin" },
      transaction,
    );
  });

export const appealDispute = async ({ disputeId, user, message }) =>
  Dispute.sequelize.transaction(async (transaction) => {
    const dispute = await Dispute.findByPk(disputeId, { transaction });
    if (!dispute) throw HttpError(404, "Спір не знайдено.");
    assertParticipant(dispute, user);
    if (dispute.status !== "resolved")
      throw HttpError(409, "Оскаржити можна лише рішення адміністратора.");
    await DisputeMessage.create(
      { disputeId, authorId: user.id, message },
      { transaction },
    );
    await dispute.update(
      { status: "appealed", resolvedAt: null },
      { transaction },
    );
    await addEvent(disputeId, user.id, "appealed", null, transaction);
    return getDisputeById(disputeId, user, transaction);
  });

export const resolveDispute = async ({ disputeId, adminId, payload }) =>
  Dispute.sequelize.transaction(async (transaction) => {
    const dispute = await Dispute.findByPk(disputeId, { transaction });
    if (!dispute) throw HttpError(404, "Спір не знайдено.");
    if (["resolved", "closed"].includes(dispute.status))
      throw HttpError(409, "Цей спір уже закрито.");
    await dispute.update(
      {
        ...payload,
        status: "resolved",
        assignedAdminId: adminId,
        resolvedAt: new Date(),
      },
      { transaction },
    );
    await addEvent(
      disputeId,
      adminId,
      "resolved",
      {
        decision: payload.decision,
        resolvedAmount: payload.resolvedAmount ?? null,
      },
      transaction,
    );
    return getDisputeById(
      disputeId,
      { id: adminId, role: "admin" },
      transaction,
    );
  });
