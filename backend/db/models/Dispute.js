import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Dispute = sequelize.define(
  "Dispute",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reason: {
      type: DataTypes.ENUM(
        "payment",
        "no_show",
        "late_cancellation",
        "work_quality",
        "other",
      ),
      allowNull: false,
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    disputedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "open",
        "awaiting_response",
        "under_review",
        "resolved",
        "closed",
        "appealed",
      ),
      allowNull: false,
      defaultValue: "open",
    },
    decision: {
      type: DataTypes.ENUM(
        "pay_worker_full",
        "pay_worker_partial",
        "refund_company",
        "no_action",
        "cancel_shift_no_fault",
      ),
      allowNull: true,
    },
    resolvedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    adminComment: { type: DataTypes.TEXT, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "disputes", createdAt: "created_at", updatedAt: "updated_at" },
);

export default Dispute;
