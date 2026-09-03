import { Sequelize } from "sequelize";

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";
const isTest = env === "test";

const connectionParams = isProduction
  ? {
      dialect: process.env.DATABASE_DIALECT || "postgres",
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST || "postgres",
      database: process.env.DATABASE_NAME,
      port: process.env.DATABASE_PORT || 5432,
      dialectOptions: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : isTest
  ? {
      dialect: process.env.DATABASE_DIALECT || "postgres",
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
      port: process.env.DATABASE_PORT || 5432,
    }
  : {
      dialect: process.env.DATABASE_DIALECT_DEV || "postgres",
      username: process.env.DATABASE_USERNAME_DEV,
      password: process.env.DATABASE_PASSWORD_DEV,
      host: process.env.DATABASE_HOST_DEV,
      database: process.env.DATABASE_NAME_DEV,
      port: process.env.DATABASE_PORT_DEV || 5432,
    };

const sequelize = new Sequelize({
  ...connectionParams,
  logging: isProduction ? false : (msg) => console.log(`[Sequelize] ${msg}`),
});

export default sequelize;