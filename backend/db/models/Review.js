import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    // foreignKey shiftId (INTEGER) буде додано через асоціації
    // foreignKeys reviewerId та revieweeId (INTEGER) також додадуться через асоціації
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 }, // Обмеження рейтингу від 1 до 5
    },
    comment: { type: DataTypes.TEXT },
  },
  {
    tableName: "reviews",
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default Review;
