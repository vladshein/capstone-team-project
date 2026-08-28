import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const DisputeEvent = sequelize.define(
  "DisputeEvent",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.STRING(50), allowNull: false },
    payload: { type: DataTypes.JSONB, allowNull: true },
  },
  { tableName: "dispute_events", createdAt: "created_at", updatedAt: false },
);

export default DisputeEvent;
