import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Area = sequelize.define(
    "area",
    {
        id: {
            type: DataTypes.TEXT,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
    {
        timestamps: false, // Sequelize will auto-manage createdAt/updatedAt
    }
);

export default Area;
