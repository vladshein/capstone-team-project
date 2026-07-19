import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Transaction = sequelize.define(
  "Transaction",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // foreignKeys senderId, receiverId, shiftId будуть додані через асоціації
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "deposit",
        "hold",
        "release_payout",
        "release_commission",
        "withdrawal",
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },
  },
  {
    tableName: "transactions",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default Transaction;
