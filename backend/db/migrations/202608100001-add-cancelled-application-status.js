/**
 * Зберігає відкликані заявки в історії замість фізичного видалення.
 * PostgreSQL ENUM доповнюється безпечно: міграцію можна запускати і на БД,
 * де значення вже додали вручну під час локальної розробки.
 */
export const name = "202608100001-add-cancelled-application-status";

export async function up({ sequelize }) {
  await sequelize.query(`
    ALTER TYPE "enum_shift_applications_status"
    ADD VALUE IF NOT EXISTS 'cancelled';
  `);
}

// PostgreSQL не підтримує безпечне видалення одного значення з ENUM.
// Відкат потребував би створення нового типу й конвертації колонки, тому
// навмисно не автоматизуємо потенційно руйнівну операцію.
export async function down() {
  throw new Error("Міграція ENUM status не має безпечного автоматичного rollback.");
}
