import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Shift = sequelize.define(
  "Shift",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    bonusRate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
    description: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM(
        "open",
        "booked",
        "in_progress",
        "completed",
        "cancelled",
      ),
      allowNull: false,
      defaultValue: "open",
    },
  },
  {
    tableName: "shifts",
    createdAt: "created_at",
    updatedAt: false,
    validate: {
      checkDates() {
        if (this.endTime && this.startTime && this.endTime <= this.startTime) {
          throw new Error("end_time must be strictly greater than start_time");
        }
      },
    },
  },
);

export default Shift;
