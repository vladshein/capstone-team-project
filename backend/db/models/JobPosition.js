import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const JobPosition = sequelize.define(
  "JobPosition",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    description: { type: DataTypes.TEXT },
  },
  {
    tableName: "job_positions",
    timestamps: false,
  },
);

export default JobPosition;
