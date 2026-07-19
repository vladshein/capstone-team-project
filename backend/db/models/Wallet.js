import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Wallet = sequelize.define(
  "Wallet",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // foreignKey userId буде додано через асоціації
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    frozenBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
  },
  {
    tableName: "wallets",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default Wallet;
