import seedAll from '../models/seedDBs.js';

/** @type {import('umzug').MigrationFn<any>} */
export const up = async ({ context: queryInterface }) => {
  // get checks
  // get at least one rec from tables
  const [existingUsers] = await queryInterface.sequelize.query(
    'SELECT 1 FROM "users" LIMIT 1;'
  );
  if (existingUsers.length > 0) {
    console.log('--->>> [Seeder] data in users table exists, exit');
    return; // Umzug marker seed in SequelizeDataMeta as done
  }
  console.log("--->>> [Seeder] Data is empty in DB , run insert data");
  await seedAll();
};

/** @type {import('umzug').MigrationFn<any>} */
export const down = async ({ context: queryInterface }) => {};
