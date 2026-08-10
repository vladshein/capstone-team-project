import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const ShiftApplication = sequelize.define(
  "ShiftApplication",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shiftId: { type: DataTypes.INTEGER, allowNull: false },
    workerId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected",
        "completed",
        "no_show",
        "cancelled",
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
    // Ми ВИДАЛИЛИ блок indexes, оскільки belongsToMany створить цей унікальний індекс автоматично
  },
);

export default ShiftApplication;
