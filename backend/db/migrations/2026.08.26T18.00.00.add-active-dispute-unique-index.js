import { Op } from "sequelize";

const indexName = "disputes_one_active_per_shift";
const activeStatuses = [
  "open",
  "awaiting_response",
  "under_review",
  "appealed",
];

export const up = async ({ context: queryInterface }) => {
  const [duplicates] = await queryInterface.sequelize.query(`
    SELECT "shiftId"
    FROM disputes
    WHERE status IN ('open', 'awaiting_response', 'under_review', 'appealed')
    GROUP BY "shiftId"
    HAVING COUNT(*) > 1
  `);

  if (duplicates.length) {
    throw new Error(
      "Cannot add the active-dispute unique index: duplicate active disputes already exist.",
    );
  }

  await queryInterface.addIndex("disputes", ["shiftId"], {
    name: indexName,
    unique: true,
    where: { status: { [Op.in]: activeStatuses } },
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.removeIndex("disputes", indexName);
};
