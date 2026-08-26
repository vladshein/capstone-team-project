import sequelize from "../sequelize.js";
import User from "./User.js";
import Shift from "./Shift.js";
import Location from "./Location.js";
import Category from "./Category.js";
import Area from "./Area.js";
import JobPosition from "./JobPosition.js";
import ShiftApplication from "./ShiftApplication.js";
import WorkerProfile from "./WorkerProfile.js";
import Review from "./Review.js";
import Wallet from "./Wallet.js";
import Company from "./Company.js";
import Transaction from "./Transaction.js";
import Dispute from "./Dispute.js";
import DisputeMessage from "./DisputeMessage.js";
import DisputeEvidence from "./DisputeEvidence.js";
import DisputeEvent from "./DisputeEvent.js";

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
  as: "OwnedCompanies", // alias for includes
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
// for users (user.getShifts()),
// for reviews (ShiftApplication.findAll()).

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

// 1:M
User.hasMany(ShiftApplication, { foreignKey: "workerId" });
ShiftApplication.belongsTo(User, { foreignKey: "workerId" });

Shift.hasMany(ShiftApplication, { foreignKey: "shiftId" });
ShiftApplication.belongsTo(Shift, { foreignKey: "shiftId" });

// --- 7. Category <-> Shift (1:M) ---
Category.hasMany(Shift, {
  foreignKey: { name: "categoryId", allowNull: false },
  onDelete: "RESTRICT",
});
Shift.belongsTo(Category, { foreignKey: "categoryId" });

// --- 7.1 Category <-> JobPosition (1:M) ---
Category.hasMany(JobPosition, {
  foreignKey: { name: "categoryId", allowNull: false },
  onDelete: "RESTRICT",
});
JobPosition.belongsTo(Category, { foreignKey: "categoryId" });

// --- 8. (Reviews) ---
Shift.hasMany(Review, {
  foreignKey: { name: "shiftId", allowNull: false },
  onDelete: "CASCADE",
});
Review.belongsTo(Shift, { foreignKey: "shiftId" });

// about users (Reviewer)
User.hasMany(Review, {
  foreignKey: { name: "reviewerId", allowNull: false },
  as: "GivenReviews",
});
Review.belongsTo(User, { foreignKey: "reviewerId", as: "Reviewer" });

// target (Reviewee)
User.hasMany(Review, {
  foreignKey: { name: "revieweeId", allowNull: false },
  as: "ReceivedReviews",
});
Review.belongsTo(User, { foreignKey: "revieweeId", as: "Reviewee" });

// --- 9. (Wallets & Transactions) ---
User.hasOne(Wallet, {
  foreignKey: { name: "userId", allowNull: false, unique: true },
  onDelete: "CASCADE",
});
Wallet.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Transaction, { foreignKey: "senderId", as: "SentTransactions" });
Transaction.belongsTo(User, { foreignKey: "senderId", as: "Sender" });

User.hasMany(Transaction, {
  foreignKey: "receiverId",
  as: "ReceivedTransactions",
});
Transaction.belongsTo(User, { foreignKey: "receiverId", as: "Receiver" });

Shift.hasMany(Transaction, { foreignKey: "shiftId", onDelete: "SET NULL" });
Transaction.belongsTo(Shift, { foreignKey: "shiftId" });

// --- 10. Disputes ---
Shift.hasMany(Dispute, { foreignKey: "shiftId", onDelete: "RESTRICT" });
Dispute.belongsTo(Shift, { foreignKey: "shiftId" });
User.hasMany(Dispute, { foreignKey: "initiatorId", as: "InitiatedDisputes" });
Dispute.belongsTo(User, { foreignKey: "initiatorId", as: "Initiator" });
User.hasMany(Dispute, { foreignKey: "respondentId", as: "RespondedDisputes" });
Dispute.belongsTo(User, { foreignKey: "respondentId", as: "Respondent" });
User.hasMany(Dispute, {
  foreignKey: "assignedAdminId",
  as: "AssignedDisputes",
});
Dispute.belongsTo(User, { foreignKey: "assignedAdminId", as: "AssignedAdmin" });
Dispute.hasMany(DisputeMessage, {
  foreignKey: "disputeId",
  as: "Messages",
  onDelete: "CASCADE",
});
DisputeMessage.belongsTo(Dispute, { foreignKey: "disputeId" });
User.hasMany(DisputeMessage, { foreignKey: "authorId", as: "DisputeMessages" });
DisputeMessage.belongsTo(User, { foreignKey: "authorId", as: "Author" });
Dispute.hasMany(DisputeEvidence, {
  foreignKey: "disputeId",
  as: "Evidence",
  onDelete: "CASCADE",
});
DisputeEvidence.belongsTo(Dispute, { foreignKey: "disputeId" });
User.hasMany(DisputeEvidence, {
  foreignKey: "uploadedBy",
  as: "DisputeEvidence",
});
DisputeEvidence.belongsTo(User, { foreignKey: "uploadedBy", as: "Uploader" });
Dispute.hasMany(DisputeEvent, {
  foreignKey: "disputeId",
  as: "Events",
  onDelete: "CASCADE",
});
DisputeEvent.belongsTo(Dispute, { foreignKey: "disputeId" });
User.hasMany(DisputeEvent, { foreignKey: "actorId", as: "DisputeEvents" });
DisputeEvent.belongsTo(User, { foreignKey: "actorId", as: "Actor" });

export {
  sequelize,
  User,
  Company,
  Category,
  Area,
  Shift,
  ShiftApplication,
  Location,
  JobPosition,
  WorkerProfile,
  Review,
  Transaction,
  Wallet,
  Dispute,
  DisputeMessage,
  DisputeEvidence,
  DisputeEvent,
};
