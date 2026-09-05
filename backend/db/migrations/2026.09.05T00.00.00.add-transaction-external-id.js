import { DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }) => {
  const columns = await queryInterface.describeTable("transactions");

  if (!columns.external_id) {
    await queryInterface.addColumn("transactions", "external_id", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  const indexes = await queryInterface.showIndex("transactions");
  const hasExternalIdIndex = indexes.some(
    (index) => index.name === "transactions_external_id_key",
  );

  if (!hasExternalIdIndex) {
    await queryInterface.addIndex("transactions", ["external_id"], {
      name: "transactions_external_id_key",
      unique: true,
    });
  }
};

export const down = async ({ context: queryInterface }) => {
  const indexes = await queryInterface.showIndex("transactions");
  const hasExternalIdIndex = indexes.some(
    (index) => index.name === "transactions_external_id_key",
  );

  if (hasExternalIdIndex) {
    await queryInterface.removeIndex("transactions", "transactions_external_id_key");
  }

  const columns = await queryInterface.describeTable("transactions");

  if (columns.external_id) {
    await queryInterface.removeColumn("transactions", "external_id");
  }
};
