import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const DisputeEvidence = sequelize.define(
  "DisputeEvidence",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fileUrl: { type: DataTypes.STRING, allowNull: false },
    originalName: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "dispute_evidence", createdAt: "created_at", updatedAt: false },
);

export default DisputeEvidence;
