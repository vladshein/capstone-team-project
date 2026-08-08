import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './models/index.js';

export const seeder = new Umzug({
  migrations: {
    glob: 'db/seeders/*.js',
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ 
    sequelize,
    modelName: 'SequelizeDataMeta',
  }),
  logger: console,
  create: {
    folder: 'db/seeders',
    template: (filepath) => [
      [filepath, `// Seeder template\nexport async function up({ context }) {}\nexport async function down({ context }) {}\n`],
    ],
  },
});

if (process.argv && process.argv[1] && process.argv[1].endsWith('seeder.js')) {
  if (process.argv.includes('create')) {
    const seederName = `seeder-${Date.now()}.js`;
    seeder.create({ name: seederName })
      .then(() => console.log(`Seeder ${seederName} created successfully!`))
      .catch((err) => {
        console.error('Error creating seeder:', err);
        process.exit(1);
      });
  } else {
    seeder.runAsCLI();
  }
}
