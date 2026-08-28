import {
  Company,
  Dispute,
  JobPosition,
  Location,
  Shift,
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

/**
 * Воркер читає адресата й контекст повторно з БД, а не довіряє даним із черги.
 * Так ми не зберігаємо email чи текст рішення у Valkey.
 */
export const getDisputeNotificationRecipient = async ({
  recipientUserId,
  disputeId,
}) => {
  const userId = assertPositiveInteger(recipientUserId, "recipientUserId");
  const normalizedDisputeId = assertPositiveInteger(disputeId, "disputeId");

  const [recipient, dispute] = await Promise.all([
    User.findOne({
      where: { id: userId, isVerified: true },
      attributes: ["id", "email", "role"],
    }),
    Dispute.findByPk(normalizedDisputeId, {
      attributes: ["id", "decision", "resolvedAmount"],
      include: [
        {
          model: Shift,
          attributes: ["id"],
          include: [
            { model: JobPosition, attributes: ["title"] },
            {
              model: Location,
              attributes: ["id"],
              include: [{ model: Company, attributes: ["name"] }],
            },
          ],
        },
      ],
    }),
  ]);

  if (!recipient || !dispute) return null;

  const disputeData = toPlainObject(dispute);
  const shift = disputeData.Shift;
  if (!shift?.JobPosition?.title || !shift.Location?.Company?.name) return null;

  return {
    email: recipient.email,
    role: recipient.role,
    dispute: {
      id: Number(disputeData.id),
      shiftTitle: shift.JobPosition.title,
      companyName: shift.Location.Company.name,
      decision: disputeData.decision,
      resolvedAmount: disputeData.resolvedAmount,
    },
  };
};

export const getVerifiedAdminIds = async () => {
  const admins = await User.findAll({
    where: { role: "admin", isVerified: true },
    attributes: ["id"],
    raw: true,
  });
  return admins
    .map((admin) => Number(admin.id))
    .filter((id) => Number.isInteger(id) && id > 0);
};
