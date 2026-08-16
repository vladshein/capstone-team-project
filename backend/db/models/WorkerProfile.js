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
      defaultValue: 5.0,
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
    },
    // Публічний ключ LiqPay акаунта робітника. Приватний ключ ніколи не
    // зберігаємо в нашій системі.
    liqpayPublicKey: {
      type: DataTypes.STRING(100),
    },
  },
  {
    tableName: "worker_profiles",
    createdAt: false,
    updatedAt: "updated_at",
  },
);

export default WorkerProfile;
