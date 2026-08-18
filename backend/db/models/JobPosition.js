import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const JobPosition = sequelize.define(
  "JobPosition",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    description: { type: DataTypes.TEXT },
    categoryId: {
      // categories.id має тип TEXT, тому зовнішній ключ використовує той самий тип.
      type: DataTypes.TEXT,
      allowNull: false,
      references: { model: "categories", key: "id" },
    },
  },
  {
    tableName: "job_positions",
    timestamps: false,
  },
);

export default JobPosition;
