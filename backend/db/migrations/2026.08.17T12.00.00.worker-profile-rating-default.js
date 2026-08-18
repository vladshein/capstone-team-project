import { DataTypes } from "sequelize";

/** Заміна оманливого стартового рейтингу 5.00 на рейтинг без відгуків. */
export const up = async ({ context: queryInterface }) => {
  await queryInterface.changeColumn("worker_profiles", "rating", {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0,
  });

  // Вирівнюємо наявні профілі з джерелом правди — таблицею reviews.
  await queryInterface.sequelize.query(`
    UPDATE "worker_profiles" AS profile
    SET "rating" = COALESCE(
      (
        SELECT ROUND(AVG(review."rating")::numeric, 2)
        FROM "reviews" AS review
        WHERE review."revieweeId" = profile."userId"
      ),
      0
    )
  `);
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.changeColumn("worker_profiles", "rating", {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 5,
  });
};
