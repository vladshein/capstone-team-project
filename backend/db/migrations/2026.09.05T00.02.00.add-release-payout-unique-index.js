export const up = async ({ context: queryInterface }) => {
  const indexes = await queryInterface.showIndex("transactions");
  const indexName = "transactions_release_payout_shift_id_key";

  if (!indexes.some((index) => index.name === indexName)) {
    const [duplicatePayouts] = await queryInterface.sequelize.query(`
      SELECT "shiftId", COUNT(*) AS count
      FROM transactions
      WHERE type = 'release_payout' AND "shiftId" IS NOT NULL
      GROUP BY "shiftId"
      HAVING COUNT(*) > 1
    `);

    if (duplicatePayouts.length > 0) {
      const shifts = duplicatePayouts.map(({ shiftId }) => shiftId).join(", ");
      throw new Error(
        `Cannot add ${indexName}: duplicate release_payout transactions exist for shift IDs: ${shifts}`,
      );
    }

    await queryInterface.addIndex("transactions", ["shiftId"], {
      name: indexName,
      unique: true,
      where: { type: "release_payout" },
    });
  }
};

export const down = async ({ context: queryInterface }) => {
  const indexes = await queryInterface.showIndex("transactions");
  const indexName = "transactions_release_payout_shift_id_key";

  if (indexes.some((index) => index.name === indexName)) {
    await queryInterface.removeIndex("transactions", indexName);
  }
};
