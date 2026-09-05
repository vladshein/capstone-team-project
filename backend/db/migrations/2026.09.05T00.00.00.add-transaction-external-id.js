import { DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }) => {
  const columns = await queryInterface.describeTable("transactions");

  if (!columns.external_id) {
    await queryInterface.addColumn("transactions", "external_id", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }
};

export const down = async ({ context: queryInterface }) => {
  const columns = await queryInterface.describeTable("transactions");

  if (columns.external_id) {
    await queryInterface.removeColumn("transactions", "external_id");
  }
};
