import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Location = sequelize.define(
  "Location",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    city: { type: DataTypes.STRING(50), allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    latitude: { type: DataTypes.DECIMAL(9, 6) },
    longitude: { type: DataTypes.DECIMAL(9, 6) },
  },
  {
    tableName: "locations",
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default Location;
