import { Op } from "sequelize";
import {
  Company,
  JobPosition,
  Location,
  Shift,
  ShiftApplication,
  User,
} from "../db/models/index.js";

const assertPositiveInteger = (value, fieldName) => {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return parsedValue;
};

const toPlainObject = (record) =>
  typeof record?.get === "function" ? record.get({ plain: true }) : record;

const shiftContextInclude = [
  { model: JobPosition, attributes: ["title"] },
  {
    model: Location,
    attributes: ["title", "city", "address"],
    include: [{ model: Company, attributes: ["name"] }],
  },
];

/**
 * Повертає лише дані, які потрібні для листа. Не довіряємо застарілому payload
 * із Valkey: email і дані зміни worker завжди читає безпосередньо з PostgreSQL.
 * Непідтвердженим адресам листи не надсилаємо.
 */
export const getShiftNotificationRecipient = async ({
  recipientUserId,
  shiftId,
}) => {
  const userId = assertPositiveInteger(recipientUserId, "recipientUserId");
  const normalizedShiftId = assertPositiveInteger(shiftId, "shiftId");

  const [recipient, shift] = await Promise.all([
    User.findOne({
      where: { id: userId, isVerified: true },
      attributes: ["id", "email"],
    }),
    Shift.findByPk(normalizedShiftId, {
      attributes: ["id", "startTime", "endTime"],
      include: shiftContextInclude,
    }),
  ]);

  if (!recipient || !shift) return null;

  const shiftData = toPlainObject(shift);
  const location = shiftData.Location;
  const company = location?.Company;

  // Неконсистентну зміну не варто відправляти без контексту. У штатній схемі
  // всі ці зв'язки обов'язкові, тому це також захищає від частково видалених даних.
  if (!location || !company || !shiftData.JobPosition?.title) return null;

  return {
    email: recipient.email,
    shift: {
      id: Number(shiftData.id),
      title: shiftData.JobPosition.title,
      companyName: company.name,
      locationTitle: location.title,
      city: location.city,
      address: location.address,
      startTime: shiftData.startTime,
      endTime: shiftData.endTime,
    },
  };
};

/**
 * Повертає власника компанії та виконавців із заданими статусами заявок для
 * фонових подій lifecycle. Сервіс лише читає дані; рішення, кому та для якої
 * події надсилати лист, лишається в бізнес-логіці, яка викликатиме enqueue.
 */
export const getShiftNotificationAudience = async (
  shiftId,
  { applicationStatuses = ["approved"] } = {},
) => {
  const normalizedShiftId = assertPositiveInteger(shiftId, "shiftId");
  const statuses = Array.isArray(applicationStatuses)
    ? applicationStatuses
    : [];
  const normalizedApplicationStatuses = [
    ...new Set(
      statuses.filter(
        (status) => typeof status === "string" && status.length > 0,
      ),
    ),
  ];

  const shift = await Shift.findByPk(normalizedShiftId, {
    attributes: ["id"],
    include: [
      {
        model: Location,
        // Залишаємо ідентифікатор у SELECT, щоб Sequelize гарантовано
        // гідратував вкладений Location разом із Company.
        attributes: ["id"],
        required: true,
        include: [{ model: Company, attributes: ["ownerId"], required: true }],
      },
    ],
  });

  if (!shift) return null;

  const shiftData = toPlainObject(shift);
  const companyOwnerId = Number(shiftData.Location?.Company?.ownerId);
  if (!Number.isInteger(companyOwnerId) || companyOwnerId < 1) return null;

  const matchingApplications = await ShiftApplication.findAll({
    where: {
      shiftId: normalizedShiftId,
      status:
        normalizedApplicationStatuses.length === 1
          ? normalizedApplicationStatuses[0]
          : { [Op.in]: normalizedApplicationStatuses },
    },
    attributes: ["workerId"],
    raw: true,
  });

  const workerIds = [
    ...new Set(
      matchingApplications
        .map((application) => Number(application.workerId))
        .filter((workerId) => Number.isInteger(workerId) && workerId > 0),
    ),
  ];

  return { companyOwnerId, workerIds };
};
