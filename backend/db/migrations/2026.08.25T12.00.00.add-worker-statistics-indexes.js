/**
 * workerStatistics.service.js фільтрує/джойнить shift_applications по
 * (workerId, status), shifts по (startTime, endTime) та locations по
 * companyId/city без жодного індексу — кожен виклик статистики робив
 * seq scan по цих таблицях. Додаємо індекси під ці запити.
 */
export const up = async ({ context: queryInterface }) => {
  await queryInterface.addIndex("shift_applications", {
    fields: ["workerId", "status"],
    name: "shift_applications_workerId_status_idx",
  });

  await queryInterface.addIndex("shifts", {
    fields: ["startTime"],
    name: "shifts_startTime_idx",
  });
  await queryInterface.addIndex("shifts", {
    fields: ["endTime"],
    name: "shifts_endTime_idx",
  });
  await queryInterface.addIndex("shifts", {
    fields: ["locationId"],
    name: "shifts_locationId_idx",
  });
  await queryInterface.addIndex("shifts", {
    fields: ["positionId"],
    name: "shifts_positionId_idx",
  });
  await queryInterface.addIndex("shifts", {
    fields: ["categoryId"],
    name: "shifts_categoryId_idx",
  });

  await queryInterface.addIndex("locations", {
    fields: ["companyId"],
    name: "locations_companyId_idx",
  });
  await queryInterface.addIndex("locations", {
    fields: ["city"],
    name: "locations_city_idx",
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.removeIndex(
    "shift_applications",
    "shift_applications_workerId_status_idx",
  );
  await queryInterface.removeIndex("shifts", "shifts_startTime_idx");
  await queryInterface.removeIndex("shifts", "shifts_endTime_idx");
  await queryInterface.removeIndex("shifts", "shifts_locationId_idx");
  await queryInterface.removeIndex("shifts", "shifts_positionId_idx");
  await queryInterface.removeIndex("shifts", "shifts_categoryId_idx");
  await queryInterface.removeIndex("locations", "locations_companyId_idx");
  await queryInterface.removeIndex("locations", "locations_city_idx");
};
