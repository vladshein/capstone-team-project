import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './models/index.js';

export const migrator = new Umzug({
  migrations: {
    glob: 'db/migrations/*.js',
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
  create: {
    folder: 'db/migrations',
    template: (filepath) => [
      [filepath, `// Migration template\nexport async function up({ context }) {}\nexport async function down({ context }) {}\n`],
    ],
  },
});

if (process.argv && process.argv[1] && process.argv[1].endsWith('migrator.js')) {
  if (process.argv.includes('create')) {
    const migrationName = `migration-${Date.now()}.js`;

    migrator.create({ name: migrationName })
      .then(() => console.log(`Migration ${migrationName} created successfully!`))
      .catch((err) => {
        console.error('Error creating migration:', err);
        process.exit(1);
      });
  } else {
    migrator.runAsCLI();
  }
}
