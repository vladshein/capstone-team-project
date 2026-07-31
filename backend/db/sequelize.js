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
      dialect: process.env.DATABASE_DIALECT_DEV || "postgres",
      username: process.env.DB_USER || process.env.POSTGRES_USER,
      password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
      host: process.env.DB_HOST || "postgres",
      database: process.env.DB_NAME || process.env.POSTGRES_DB,
      port: process.env.DB_PORT || 5432,
    };

const sequelize = new Sequelize({
  ...connectionParams,
  logging: (msg) => console.log(`[Sequelize] ${msg}`),
});

export default sequelize;