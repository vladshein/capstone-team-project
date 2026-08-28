import { DataTypes } from "sequelize";

const userReference = (allowNull = false) => ({
  type: DataTypes.INTEGER,
  allowNull,
  references: { model: "users", key: "id" },
  onUpdate: "CASCADE",
  onDelete: allowNull ? "SET NULL" : "RESTRICT",
});

export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable("disputes", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shiftId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "shifts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    initiatorId: userReference(),
    respondentId: userReference(),
    assignedAdminId: userReference(true),
    reason: {
      type: DataTypes.ENUM(
        "payment",
        "no_show",
        "late_cancellation",
        "work_quality",
        "other",
      ),
      allowNull: false,
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    disputedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "open",
        "awaiting_response",
        "under_review",
        "resolved",
        "closed",
        "appealed",
      ),
      allowNull: false,
      defaultValue: "open",
    },
    decision: {
      type: DataTypes.ENUM(
        "pay_worker_full",
        "pay_worker_partial",
        "refund_company",
        "no_action",
        "cancel_shift_no_fault",
      ),
      allowNull: true,
    },
    resolvedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    adminComment: { type: DataTypes.TEXT, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
  await queryInterface.addIndex("disputes", ["status", "created_at"]);
  await queryInterface.addIndex("disputes", ["shiftId"]);
  for (const [table, fields] of [
    [
      "dispute_messages",
      { message: { type: DataTypes.TEXT, allowNull: false } },
    ],
    [
      "dispute_evidence",
      {
        fileUrl: { type: DataTypes.STRING, allowNull: false },
        originalName: { type: DataTypes.STRING, allowNull: false },
        mimeType: { type: DataTypes.STRING, allowNull: true },
      },
    ],
    [
      "dispute_events",
      {
        type: { type: DataTypes.STRING(50), allowNull: false },
        payload: { type: DataTypes.JSONB, allowNull: true },
      },
    ],
  ]) {
    await queryInterface.createTable(table, {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      disputeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "disputes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      ...(table === "dispute_evidence"
        ? { uploadedBy: userReference() }
        : {
            [table === "dispute_messages" ? "authorId" : "actorId"]:
              userReference(table === "dispute_events"),
          }),
      ...fields,
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("dispute_events");
  await queryInterface.dropTable("dispute_evidence");
  await queryInterface.dropTable("dispute_messages");
  await queryInterface.dropTable("disputes");
};
