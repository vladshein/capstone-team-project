import { DataTypes } from "sequelize";

/** @type {import('umzug').MigrationFn<any>} */
export const up = async ({ context: queryInterface }) => {
  const transactionTable = await queryInterface.describeTable("transactions");
  const profileTable = await queryInterface.describeTable("worker_profiles");

  const addColumn = async (table, columns, name, definition) => {
    if (!columns[name]) await queryInterface.addColumn(table, name, definition);
  };

  await addColumn("transactions", transactionTable, "orderId", { type: DataTypes.STRING(100), unique: true, allowNull: true });
  await addColumn("transactions", transactionTable, "provider", { type: DataTypes.STRING(30), allowNull: true });
  await addColumn("transactions", transactionTable, "providerStatus", { type: DataTypes.STRING(50), allowNull: true });
  await addColumn("transactions", transactionTable, "workerAmount", { type: DataTypes.DECIMAL(12, 2), allowNull: true });
  await addColumn("transactions", transactionTable, "platformFee", { type: DataTypes.DECIMAL(12, 2), allowNull: true });
  await addColumn("transactions", transactionTable, "providerPayload", { type: DataTypes.JSONB, allowNull: true });
  await addColumn("transactions", transactionTable, "confirmedAt", { type: DataTypes.DATE, allowNull: true });
  await addColumn("worker_profiles", profileTable, "liqpayPublicKey", { type: DataTypes.STRING(100), allowNull: true });
};

export const down = async ({ context: queryInterface }) => {
  for (const column of ["confirmedAt", "providerPayload", "platformFee", "workerAmount", "providerStatus", "provider", "orderId"]) {
    await queryInterface.removeColumn("transactions", column);
  }
  await queryInterface.removeColumn("worker_profiles", "liqpayPublicKey");
};
