import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";
import { emailRegExp } from "../../constants/authConstants.js";

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    phone: { type: DataTypes.STRING(15), unique: true, allowNull: false },
    name: {
      // duplicated in worker profile, check if needed
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        args: true,
        msg: "Email in use",
      },
      validate: {
        is: emailRegExp,
      },
    },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false }, //was password before, check in controllers
    token: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("worker", "business_client", "admin"),
      allowNull: false,
      defaultValue: "worker",
    },
    avatar: {
      // duplicated in worker profile
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
    },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "users",
    createdAt: "created_at",
    updatedAt: false, // У твоїй схемі немає updated_at для юзерів
  },
);

export default User;
