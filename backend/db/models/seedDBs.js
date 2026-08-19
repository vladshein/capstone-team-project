import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Assuming your models are correctly exported from index.js
import {
  sequelize,
  Area,
  Category,
  JobPosition,
  User,
  WorkerProfile,
  Company,
  Location,
  Wallet,
  Shift,
  ShiftApplication,
  Transaction,
  Review,
} from "./index.js";
import {
  buildExpandedShiftFixtures,
  buildRegionalShiftFixtures,
} from "./shiftFixtures.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON files
function loadJson(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    console.warn(`Warning: File not found ${filename}`);
    return [];
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return [];
  }
}

/**
 * Безпечний bulkCreate: пропускає записи, чий PK вже існує в таблиці
 * (ON CONFLICT DO NOTHING на Postgres), нічого не перезаписує і не падає
 * з помилкою unique/primary key constraint при повторному запуску.
 */
async function safeBulkCreate(Model, data, options = {}) {
  if (!data || data.length === 0) return;

  await Model.bulkCreate(data, {
    ignoreDuplicates: true, // Postgres: ON CONFLICT (pk) DO NOTHING
    validate: true,
    ...options,
  });
}

export default async function seedAll() {
  try {
    console.log("Starting database seeding...");

    // 1. Load all JSON data
    const areasJson = loadJson("json/areas.json");
    const categoriesJson = loadJson("json/categories.json");
    const jobPositionsJson = loadJson("json/job_positions.json");
    const usersJson = loadJson("json/users.json");

    const workerProfilesJson = loadJson("json/worker_profiles.json");
    const companiesJson = loadJson("json/companies.json");
    const walletsJson = loadJson("json/wallets.json");

    const locationsJson = loadJson("json/locations.json");
    const shiftsJson = loadJson("json/shifts.json");

    const shiftApplicationsJson = loadJson("json/shift_applications.json");
    const reviewsJson = loadJson("json/reviews.json");
    const transactionsJson = loadJson("json/transactions.json");
    const expandedFixtures = buildExpandedShiftFixtures();
    const regionalFixtures = buildRegionalShiftFixtures();

    // =========================================================================
    // 2. INSERTION ORDER IS CRITICAL (Parent tables first, then child tables)
    // =========================================================================

    // LEVEL 1: Independent Tables (No Foreign Keys)
    console.log("Seeding independent tables...");

    // Custom mapping for Area (handling the MongoDB-style $oid you had)
    if (areasJson.length > 0) {
      const mappedAreas = areasJson.map((area) => ({
        id: area._id?.$oid || area.id,
        name: area.name,
      }));
      await safeBulkCreate(Area, mappedAreas);
    }

    await safeBulkCreate(Category, categoriesJson);
    await safeBulkCreate(JobPosition, [
      ...jobPositionsJson,
      ...expandedFixtures.jobPositions,
      ...regionalFixtures.jobPositions,
    ]);
    await safeBulkCreate(User, usersJson);

    // LEVEL 2: Tables dependent on Users
    console.log(
      "Seeding user-dependent tables (Profiles, Companies, Wallets)...",
    );
    await safeBulkCreate(WorkerProfile, workerProfilesJson);
    await safeBulkCreate(Company, [
      ...companiesJson,
      ...expandedFixtures.companies,
      ...regionalFixtures.companies,
    ]);
    await safeBulkCreate(Wallet, walletsJson);

    // LEVEL 3: Tables dependent on Companies
    console.log("Seeding Locations...");
    await safeBulkCreate(Location, [
      ...locationsJson,
      ...expandedFixtures.locations,
      ...regionalFixtures.locations,
    ]);

    // LEVEL 4: Tables dependent on Locations, Positions, and Categories
    console.log("Seeding Shifts...");
    await safeBulkCreate(Shift, [
      ...shiftsJson,
      ...expandedFixtures.shifts,
      ...regionalFixtures.shifts,
    ]);

    // LEVEL 5: Tables dependent on Shifts and Users
    console.log("Seeding Shift Applications, Reviews, and Transactions...");
    await safeBulkCreate(ShiftApplication, shiftApplicationsJson);
    await safeBulkCreate(Review, reviewsJson);
    await safeBulkCreate(Transaction, transactionsJson);

    // =========================================================================
    // 3. ОНОВЛЕННЯ ЛІЧИЛЬНИКІВ POSTGRESQL (SEQUENCE)
    // =========================================================================
    console.log("🔄 Resetting PostgreSQL sequences...");

    // Перелік таблиць, які мають SERIAL PRIMARY KEY (integer id)
    const tablesWithSequences = [
      "users",
      "worker_profiles",
      "companies",
      "locations",
      "job_positions",
      "categories",
      "shifts",
      "shift_applications",
      "wallets",
      "transactions",
    ];

    for (const table of tablesWithSequences) {
      try {
        // COALESCE(MAX(id), 1) захищає від помилки на порожній таблиці,
        // а третій аргумент false у setval гарантує, що наступний nextval()
        // поверне саме MAX(id)+1, а не пропустить/повторить значення.
        await sequelize.query(
          `SELECT setval(
             pg_get_serial_sequence('"${table}"', 'id'),
             (SELECT COALESCE(MAX(id), 1) FROM "${table}"),
             (SELECT COUNT(*) > 0 FROM "${table}")
           );`,
        );
      } catch (seqError) {
        console.warn(
          `⚠️ Could not reset sequence for ${table}:`,
          seqError.message,
        );
      }
    }

    console.log("Seed data inserted successfully!");
  } catch (err) {
    console.error("Error seeding data:", err);
  } finally {
    // 3. Скидання sequence — ТЕПЕР ВИКОНУЄТЬСЯ ЗАВЖДИ,
    // незалежно від того, чи впав основний seed чи ні.
    console.log("🔄 Resetting PostgreSQL sequences...");

    const tablesWithSequences = [
      "users", "worker_profiles", "companies", "locations",
      "job_positions", "categories", "shifts",
      "shift_applications", "wallets", "transactions",
    ];

    for (const table of tablesWithSequences) {
      try {
        await sequelize.query(
          `SELECT setval(
             pg_get_serial_sequence('"${table}"', 'id'),
             (SELECT COALESCE(MAX(id), 1) FROM "${table}"),
             (SELECT COUNT(*) > 0 FROM "${table}")
           );`,
        );
      } catch (seqError) {
        console.warn(`⚠️ Could not reset sequence for ${table}:`, seqError.message);
      }
    }
  }
}