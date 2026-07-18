import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const ShiftApplication = sequelize.define(
  "ShiftApplication",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected",
        "completed",
        "no_show",
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    appliedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    actualStartTime: { type: DataTypes.DATE },
    actualEndTime: { type: DataTypes.DATE },
  },
  {
    tableName: "shift_applications",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["shift_id", "worker_id"],
      },
    ],
  },
);

export default ShiftApplication;
