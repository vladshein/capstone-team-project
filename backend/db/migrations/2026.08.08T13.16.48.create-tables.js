import { sequelize } from '../models/index.js';

/** @type {import('umzug').MigrationFn<any>} */
export const up = async ({ context: queryInterface }) => {
  // get check 
  // get list of tables in db
  const tables = await queryInterface.showAllTables();  
  // check if tables exists for example users table
  const hasTables = tables.includes('Users') || tables.includes('users');
  if (hasTables) {
    console.log('--->>> [Migration] tables exists, stop create new tables');
    return; //exit . Umzug marked migration as done!
  }
  // if doesnt exists, create
  console.log('--->>> [Migration] Empty DB , create tables');
  // use sync
  await sequelize.sync();
};

/** @type {import('umzug').MigrationFn<any>} */
export const down = async ({ context: queryInterface }) => {
    // drop all tables, when we run UNDO command
    await queryInterface.dropAllTables();
};
