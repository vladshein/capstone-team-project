import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const WorkerProfile = sequelize.define(
  "WorkerProfile",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    taxNumber: {
      type: DataTypes.STRING(10),
      unique: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      // Новий профіль ще не має підтвердженої оцінки.
      defaultValue: 0,
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "worker_profiles",
    createdAt: false,
    updatedAt: "updated_at",
  },
);

export default WorkerProfile;
