import "dotenv/config";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import sequelize from "./sequelize.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.join(currentDirectory, "migrations");
const migrationsTable = "schema_migrations";

const getMigrationFiles = async () => {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name)
    .sort();
};

const ensureMigrationsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${migrationsTable}" (
      "name" VARCHAR(255) PRIMARY KEY,
      "appliedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const getAppliedMigrations = async () => {
  const [rows] = await sequelize.query(
    `SELECT "name" FROM "${migrationsTable}" ORDER BY "name" ASC`,
  );
  return new Set(rows.map((row) => row.name));
};

const printStatus = async () => {
  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();

  for (const file of files) {
    console.log(`${applied.has(file) ? "applied" : "pending"}  ${file}`);
  }
};

const runMigrations = async () => {
  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();

  for (const file of files) {
    if (applied.has(file)) continue;

    const migrationUrl = pathToFileURL(path.join(migrationsDirectory, file)).href;
    const migration = await import(migrationUrl);
    if (typeof migration.up !== "function") {
      throw new Error(`Міграція ${file} не експортує функцію up.`);
    }

    console.log(`Running ${file}...`);
    // Legacy migrations in this project use Umzug's `context` argument.
    // Keep the runner compatible with them and with new migrations.
    await migration.up({ context: sequelize.getQueryInterface(), sequelize });
    await sequelize.getQueryInterface().bulkInsert(migrationsTable, [{ name: file }]);
    console.log(`Applied ${file}.`);
  }
};

try {
  await sequelize.authenticate();
  await ensureMigrationsTable();

  if (process.argv.includes("--status")) {
    await printStatus();
  } else {
    await runMigrations();
  }
} finally {
  await sequelize.close();
}
