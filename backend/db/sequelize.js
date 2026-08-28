import { Sequelize } from "sequelize";

const isProduction = process.env.NODE_ENV === "production";

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
  : {
      dialect: process.env.DATABASE_DIALECT_DEV,
      username: process.env.DATABASE_USERNAME_DEV,
      password: process.env.DATABASE_PASSWORD_DEV,
      host: process.env.DATABASE_HOST_DEV,
      database: process.env.DATABASE_NAME_DEV,
      port: process.env.DATABASE_PORT_DEV,
    };

const sequelize = new Sequelize({
  ...connectionParams,
  logging: isProduction ? false : (msg) => console.log(`[Sequelize] ${msg}`),
});

export default sequelize;