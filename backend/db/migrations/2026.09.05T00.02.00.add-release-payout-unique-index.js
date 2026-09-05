export const up = async ({ context: queryInterface }) => {
  const indexes = await queryInterface.showIndex("transactions");
  const indexName = "transactions_release_payout_shift_id_key";

  if (!indexes.some((index) => index.name === indexName)) {
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
