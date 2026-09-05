import { DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }) => {
  const columns = await queryInterface.describeTable("transactions");

  if (!columns.description) {
    await queryInterface.addColumn("transactions", "description", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }
};

export const down = async ({ context: queryInterface }) => {
  const columns = await queryInterface.describeTable("transactions");

  if (columns.description) {
    await queryInterface.removeColumn("transactions", "description");
  }
};
