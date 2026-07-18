// import { Sequelize } from "sequelize";

// const sequelize = new Sequelize({
//     dialect: process.env.DATABASE_DIALECT,
//     username: process.env.DATABASE_USERNAME,
//     password: process.env.DATABASE_PASSWORD,
//     host: process.env.DATABASE_HOST,
//     database: process.env.DATABASE_NAME,
//     port: process.env.DATABASE_PORT,
//     dialectOptions: {
//         ssl: true,
//     },
// });

// export default sequelize;

import { Sequelize } from 'sequelize';

const isProduction = process.env.NODE_ENV === 'production';

const connectioParams = isProduction
  ? {
      dialect: process.env.DATABASE_DIALECT,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
      port: process.env.DATABASE_PORT,
      dialectOptions: {
        ssl: true,
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
  ...connectioParams,
  logging: true,
});

export default sequelize;
