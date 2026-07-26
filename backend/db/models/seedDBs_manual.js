import sequelize from "../sequelize.js";

import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
import {
  Area,
  Category,
  Shift,
  ShiftApplication,
  Location,
  Company,
  JobPosition,
  User,
  WorkerProfile,
  Wallet,
  Transaction,
  Review,
} from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON files
function loadJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, filename), "utf-8"));
}

export default async function seedAll() {
  try {
    // Load JSON data
    const areasJson = loadJson("json/areas.json");
    const categoriesJson = loadJson("json/categories.json");
    const usersJson = loadJson("json/users.json");

    const shiftsJson = loadJson("json/shifts.json");
    const companiesJson = loadJson("json/companies.json");
    const workerProfilesJson = loadJson("json/worker_profiles.json");
    const reviewsJson = loadJson("json/reviews.json");
    const shiftApplicationsJson = loadJson("json/shift_applications.json");
    const walletsJson = loadJson("json/wallets.json");
    const jobPositionsJson = loadJson("json/job_positions.json");
    const locationsJson = loadJson("json/locations.json");
    const transactionsJson = loadJson("json/transactions.json");

    // Insert Areas
    for (const area of areasJson) {
      await Area.create({
        id: area._id.$oid,
        name: area.name,
      });
    }

    // Insert Categories
    for (const cat of categoriesJson) {
      await Category.create({
        id: cat.id,
        name: cat.name,
      });
    }

    for (const u of usersJson) {
      await User.create({
        id: u.id,
        name: u.name,
        // avatar: u.avatar,
        email: u.email,
        phone: u.phone,
        isVerified: u.isVerified,
      });
    }

    for (const u of companiesJson) {
      await Company.create({
        id: u.id,
        name: u.name,
        edrpou: u.name,
        avatar: u.avatar,
        legalAddress: u.legalAddress,
      });
    }

    for (const u of jobPositionsJson) {
      await JobPosition.create({
        id: u.id,
        title: u.title,
        description: u.description,
      });
    }

    for (const u of locationsJson) {
      await Location.create({
        id: u.id,
        companyId: u.companyId,
        title: u.title,
        city: u.city,
        address: u.address,
        latitude: u.latitude,
        longitude: u.longitude,
      });
    }

    for (const u of reviewsJson) {
      await Review.create({
        id: u.id,
        rating: u.rating,
        comment: u.comment,
      });
    }

    for (const u of shiftApplicationsJson) {
      await ShiftApplication.create({
        id: u.id,
        status: u.status,
        appliedAt: u.appliedAt,
        actualStartTime: u.actualStartTime,
        actualEndTime: u.actualEndTime,
      });
    }

    for (const u of shiftsJson) {
      await Shift.create({
        id: u.id,
        startTime: u.startTime,
        endTime: u.endTime,
        hourlyRate: u.hourlyRate,
        bonusRate: u.bonusRate,
        description: u.description,
        status: u.status,
      });
    }

    for (const u of transactionsJson) {
      await Transaction.create({
        id: u.id,
        amount: u.amount,
        type: u.type.type,
        status: u.status,
      });
    }

    for (const u of walletsJson) {
      await Wallet.create({
        id: u.id,
        balance: u.balance,
        frozenBalance: u.frozenBalance,
      });
    }

    for (const u of workerProfilesJson) {
      await WorkerProfile.create({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        birthDate: u.birthDate,
        taxNumber: u.taxNumber,
        rating: u.rating,
        avatarUrl: u.avatarUrl,
      });
    }

    console.log("✅ Seed data inserted successfully");
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  }
}
