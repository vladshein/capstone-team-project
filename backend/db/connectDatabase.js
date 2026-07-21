import sequelize from "./sequelize.js";

const connectDatabase = async () => {
  await sequelize.authenticate();
  console.log("Database connection successful");
};

export default connectDatabase;
