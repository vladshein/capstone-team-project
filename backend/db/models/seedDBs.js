import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Assuming your models are correctly exported from index.js
import {
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
      await Area.bulkCreate(mappedAreas);
    }

    if (categoriesJson.length > 0) await Category.bulkCreate(categoriesJson);
    if (jobPositionsJson.length > 0)
      await JobPosition.bulkCreate(jobPositionsJson);
    if (usersJson.length > 0) await User.bulkCreate(usersJson);

    // LEVEL 2: Tables dependent on Users
    console.log(
      "Seeding user-dependent tables (Profiles, Companies, Wallets)...",
    );
    if (workerProfilesJson.length > 0)
      await WorkerProfile.bulkCreate(workerProfilesJson);
    if (companiesJson.length > 0) await Company.bulkCreate(companiesJson);
    if (walletsJson.length > 0) await Wallet.bulkCreate(walletsJson);

    // LEVEL 3: Tables dependent on Companies
    console.log("Seeding Locations...");
    if (locationsJson.length > 0) await Location.bulkCreate(locationsJson);

    // LEVEL 4: Tables dependent on Locations, Positions, and Categories
    console.log("Seeding Shifts...");
    if (shiftsJson.length > 0) await Shift.bulkCreate(shiftsJson);

    // LEVEL 5: Tables dependent on Shifts and Users
    console.log("Seeding Shift Applications, Reviews, and Transactions...");
    if (shiftApplicationsJson.length > 0)
      await ShiftApplication.bulkCreate(shiftApplicationsJson);
    if (reviewsJson.length > 0) await Review.bulkCreate(reviewsJson);
    if (transactionsJson.length > 0)
      await Transaction.bulkCreate(transactionsJson);

    console.log("Seed data inserted successfully!");
  } catch (err) {
    console.error("Error seeding data:", err);
  }
}
