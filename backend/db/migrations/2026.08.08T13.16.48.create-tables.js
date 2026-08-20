import { DataTypes } from "sequelize";

/**
 * Зафіксований baseline схеми на момент появи міграцій.
 *
 * Цей файл навмисно не імпортує моделі й не викликає sequelize.sync(): моделі
 * завжди описують поточну схему, тоді як міграція має описувати стан на дату
 * свого створення. Подальші зміни структури роблять наступні міграції.
 */
export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable("categories", {
    id: { type: DataTypes.TEXT, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  });

  await queryInterface.createTable("areas", {
    id: { type: DataTypes.TEXT, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  });

  await queryInterface.createTable("users", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    phone: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    token: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    role: {
      type: DataTypes.ENUM("worker", "business_client", "admin"),
      allowNull: false,
      defaultValue: "worker",
    },
    avatar: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });

  // categoryId з'являється у наступній міграції, тому тут його немає.
  await queryInterface.createTable("job_positions", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  });

  // Пізніші міграції змінять rating до 0 і додадуть description.
  await queryInterface.createTable("worker_profiles", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING(50), allowNull: false },
    lastName: { type: DataTypes.STRING(50), allowNull: false },
    birthDate: { type: DataTypes.DATEONLY, allowNull: false },
    taxNumber: { type: DataTypes.STRING(10), allowNull: true, unique: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true, defaultValue: 5 },
    avatarUrl: { type: DataTypes.STRING(255), allowNull: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("companies", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    edrpou: { type: DataTypes.STRING(8), allowNull: false, unique: true },
    legalAddress: { type: DataTypes.TEXT, allowNull: true },
    avatar: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("locations", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    city: { type: DataTypes.STRING(50), allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    latitude: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "companies", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("shifts", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    bonusRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("open", "booked", "in_progress", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "open",
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "locations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    positionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "job_positions", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    categoryId: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: { model: "categories", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("shift_applications", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shiftId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "shifts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    workerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "completed", "no_show"),
      allowNull: false,
      defaultValue: "pending",
    },
    appliedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    actualStartTime: { type: DataTypes.DATE, allowNull: true },
    actualEndTime: { type: DataTypes.DATE, allowNull: true },
  });
  await queryInterface.addConstraint("shift_applications", {
    fields: ["shiftId", "workerId"],
    type: "unique",
    name: "shift_applications_shiftId_workerId_key",
  });

  await queryInterface.createTable("reviews", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    shiftId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "shifts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    reviewerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    revieweeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("wallets", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    frozenBalance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("transactions", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    type: {
      type: DataTypes.ENUM("deposit", "hold", "release_payout", "release_commission", "withdrawal"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    shiftId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "shifts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropAllTables();
};
