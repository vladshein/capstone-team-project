/**
 * Історична міграція add-category-to-job-positions створила однаковий FK двічі:
 * спочатку через addColumn(... references), а потім через changeColumn(... references).
 * Прибираємо лише зайвий constraint, не змінюючи вже застосовану міграцію.
 */
export const up = async ({ context: queryInterface }) => {
  await queryInterface.removeConstraint(
    "job_positions",
    "job_positions_categoryId_fkey1",
  );
};

export const down = async ({ context: queryInterface }) => {
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
};
