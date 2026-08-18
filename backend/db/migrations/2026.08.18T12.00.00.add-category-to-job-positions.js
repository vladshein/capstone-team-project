import { DataTypes } from "sequelize";

/** Нормалізує посади: категорія стає даними БД, а не словником фронтенду. */
export const up = async ({ context: queryInterface }) => {
  await queryInterface.addColumn("job_positions", "categoryId", {
    type: DataTypes.TEXT,
    allowNull: true,
    references: { model: "categories", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });

  await queryInterface.sequelize.query(`
    UPDATE "job_positions"
    SET "categoryId" = CASE regexp_replace("title", '\\s*\\([^)]*\\)\\s*$', '')
      WHEN 'Касир' THEN '1' WHEN 'Продавець-консультант' THEN '1' WHEN 'Касир торговельного залу' THEN '1'
      WHEN 'Бариста' THEN '2' WHEN 'Офіціант' THEN '2' WHEN 'Кухар-помічник' THEN '2'
      WHEN 'Вантажник' THEN '3' WHEN 'Комплектувальник' THEN '3'
      WHEN 'Кур''єр' THEN '4' WHEN 'Водій-кур''єр' THEN '4'
      WHEN 'Прибиральник' THEN '5' WHEN 'Працівник клінінгу' THEN '5'
      WHEN 'Пакувальник' THEN '6' WHEN 'Оператор виробництва' THEN '6'
      WHEN 'Промоутер' THEN '7' WHEN 'Хостес' THEN '7'
      WHEN 'Підсобний робітник' THEN '8' WHEN 'Монтажник' THEN '8'
      WHEN 'Охоронець' THEN '9' WHEN 'Контролер залу' THEN '9'
      WHEN 'Працівник теплиці' THEN '10' WHEN 'Збирач урожаю' THEN '10'
      WHEN 'Оператор кол-центру' THEN '11' WHEN 'Оператор підтримки' THEN '11' WHEN 'Адміністратор' THEN '11'
      WHEN 'Помічник по дому' THEN '12' WHEN 'Няня' THEN '12'
      WHEN 'Помічник майстра' THEN '13' WHEN 'Адміністратор салону' THEN '13'
      WHEN 'Водій-експедитор' THEN '14' WHEN 'Працівник автомийки' THEN '14'
      WHEN 'Доглядальник за тваринами' THEN '15' WHEN 'Помічник грумера' THEN '15'
    END
  `);

  const [result] = await queryInterface.sequelize.query(
    'SELECT count(*)::int AS count FROM "job_positions" WHERE "categoryId" IS NULL',
  );
  if (result[0].count > 0) throw new Error(`Не вдалося визначити категорію для ${result[0].count} посад.`);

  await queryInterface.changeColumn("job_positions", "categoryId", {
    type: DataTypes.TEXT,
    allowNull: false,
    references: { model: "categories", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn("job_positions", "categoryId");
};
