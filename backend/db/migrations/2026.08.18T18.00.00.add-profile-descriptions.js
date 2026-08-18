import { DataTypes } from "sequelize";

/** Короткий публічний опис для профілів виконавця та компанії. */
export const up = async ({ context: queryInterface }) => {
  await queryInterface.addColumn("worker_profiles", "description", {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn("companies", "description", {
    type: DataTypes.TEXT,
    allowNull: true,
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn("companies", "description");
  await queryInterface.removeColumn("worker_profiles", "description");
};
