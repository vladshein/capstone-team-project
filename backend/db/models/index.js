import sequelize from "../sequelize.js";
import User from "./User.js";
import Shift from "./Shift.js";
import Location from "./Location.js";
import Category from "./Category.js";
import Area from "./Area.js";
import JobPosition from "./JobPosition.js";
import ShiftApplication from "./ShiftApplication.js";
import WorkerProfile from "./WorkerProfile.js";
import seedAll from "./seedDBs.js";

// --- 1. User <-> WorkerProfile (1:1) ---
User.hasOne(WorkerProfile, {
  foreignKey: { name: "userId", allowNull: false, unique: true },
  onDelete: "CASCADE",
});
WorkerProfile.belongsTo(User, { foreignKey: "userId" });

// --- 2. User <-> Company (1:M) ---
User.hasMany(Company, {
  foreignKey: { name: "ownerId", allowNull: false },
  onDelete: "RESTRICT",
  as: "OwnedCompanies", // Аліас для інклудів
});
Company.belongsTo(User, { foreignKey: "ownerId", as: "Owner" });

// --- 3. Company <-> Location (1:M) ---
Company.hasMany(Location, {
  foreignKey: { name: "companyId", allowNull: false },
  onDelete: "CASCADE",
});
Location.belongsTo(Company, { foreignKey: "companyId" });

// --- 4. Location <-> Shift (1:M) ---
Location.hasMany(Shift, {
  foreignKey: { name: "locationId", allowNull: false },
  onDelete: "CASCADE",
});
Shift.belongsTo(Location, { foreignKey: "locationId" });

// --- 5. JobPosition <-> Shift (1:M) ---
JobPosition.hasMany(Shift, {
  foreignKey: { name: "positionId", allowNull: false },
  onDelete: "RESTRICT",
});
Shift.belongsTo(JobPosition, { foreignKey: "positionId" });

// --- 6. Super Many-to-Many: User(Worker) <-> Shift через ShiftApplication ---
// Цей підхід дозволяє і отримувати зміни юзера (user.getShifts()),
// і працювати з самими відгуками напряму (ShiftApplication.findAll()).

User.belongsToMany(Shift, {
  through: ShiftApplication,
  foreignKey: "workerId",
  otherKey: "shiftId",
});
Shift.belongsToMany(User, {
  through: ShiftApplication,
  foreignKey: "shiftId",
  otherKey: "workerId",
});

// Прямі 1:M зв'язки для таблиці-містка
User.hasMany(ShiftApplication, { foreignKey: "workerId" });
ShiftApplication.belongsTo(User, { foreignKey: "workerId" });

Shift.hasMany(ShiftApplication, { foreignKey: "shiftId" });
ShiftApplication.belongsTo(Shift, { foreignKey: "shiftId" });

// Синхронізація (тільки для розробки)
// У продакшені використовуйте міграції
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    await seedAll();
    // await seedA();
    console.log("Database synchronized successfully");
  } catch (error) {
    console.error("Error synchronizing database:", error);
  }
};

export {
  User,
  Category,
  Area,
  Shift,
  ShiftApplication,
  Location,
  JobPosition,
  WorkerProfile,
  syncDatabase,
};
