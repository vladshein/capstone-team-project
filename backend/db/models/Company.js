import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Company = sequelize.define(
  "Company",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    edrpou: { type: DataTypes.STRING(8), unique: true, allowNull: false },
    legalAddress: { type: DataTypes.TEXT },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
    },
  },
  {
    tableName: "companies",
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default Company;
