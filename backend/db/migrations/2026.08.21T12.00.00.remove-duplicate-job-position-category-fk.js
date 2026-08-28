/**
 * Історична міграція add-category-to-job-positions створила однаковий FK двічі:
 * спочатку через addColumn(... references), а потім через changeColumn(... references).
 * Прибираємо лише зайвий constraint, не змінюючи вже застосовану міграцію.
 *
 * changeColumn(... references) не на всіх версіях Sequelize/Postgres реально
 * додає другий FK (deprecated-поведінка dialect-у), тому дублікат виникає не
 * в кожному середовищі — перевіряємо наявність constraint-а перед видаленням/додаванням.
 */
const constraintExists = async (queryInterface, name) => {
  const [rows] = await queryInterface.sequelize.query(
    "SELECT 1 FROM pg_constraint WHERE conname = :name",
    { replacements: { name } },
  );
  return rows.length > 0;
};

export const up = async ({ context: queryInterface }) => {
  if (await constraintExists(queryInterface, "job_positions_categoryId_fkey1")) {
    await queryInterface.removeConstraint(
      "job_positions",
      "job_positions_categoryId_fkey1",
    );
  }
};

export const down = async ({ context: queryInterface }) => {
  if (!(await constraintExists(queryInterface, "job_positions_categoryId_fkey1"))) {
    await queryInterface.addConstraint("job_positions", {
      fields: ["categoryId"],
      type: "foreign key",
      name: "job_positions_categoryId_fkey1",
      references: {
        table: "categories",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  }
};
