import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const DisputeMessage = sequelize.define(
  "DisputeMessage",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    message: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: "dispute_messages", createdAt: "created_at", updatedAt: false },
);

export default DisputeMessage;
