/**
 * Конфіг Jest для бекенду.
 *
 * Тести повністю ізольовані від БД/Valkey (мок-моделі Sequelize через
 * jest.unstable_mockModule), тому окреме тестове середовище не потрібне —
 * достатньо стандартного node.
 *
 * `collectCoverageFrom` фіксує знаменник покриття (лише прикладний код),
 * щоб відсоток у звіті був стабільним між прогонами й порівнюваним у часі.
 * `coverageThreshold` працює як «храповик»: глобальні пороги трохи нижчі за
 * поточний рівень, а для модулів підсистеми статистики — жорсткіші.
 */
export default {
  testEnvironment: "node",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "middlewares/**/*.js",
    "helpers/**/*.js",
    "schemas/**/*.js",
    "routes/**/*.js",
    "queues/**/*.js",
    // Мертвий код-заготовка з попереднього навчального проєкту (рецепти,
    // підписки): відповідні роути закоментовані в app.js і не змонтовані.
    "!**/recipes*.js",
    "!**/followers*.js",
    "!**/followRouter.js",
    // Точка входу фонового процесу: під час імпорту робить side-effects
    // (sequelize.authenticate(), new Worker(...), реєстрація SIGINT/SIGTERM),
    // тож юніт-тест без живого Valkey/БД неможливий без рефакторингу
    // bootstrap — а це вже зона деплою. Логіку, яку він викликає
    // (reconcileShiftLifecycle, черги), покрито окремими тестами.
    "!workers/**/*.js",
    // Dev-only монтування Swagger UI.
    "!middlewares/swaggerDocs.js",
  ],
  coverageReporters: ["text", "text-summary", "lcov"],
  coverageThreshold: {
    global: {
      statements: 74,
      branches: 63,
      functions: 71,
      lines: 75,
    },
    "./helpers/jwt.js": {
      statements: 95,
      branches: 90,
      functions: 100,
      lines: 95,
    },
    "./middlewares/errorHandler.js": {
      statements: 88,
      branches: 78,
      functions: 100,
      lines: 88,
    },
    "./services/workerStatisticsServices.js": {
      statements: 85,
      branches: 68,
      functions: 95,
      lines: 95,
    },
    "./services/businessStatisticsServices.js": {
      statements: 95,
      branches: 78,
      functions: 100,
      lines: 98,
    },
    "./controllers/businessStatisticsControllers.js": {
      statements: 88,
      branches: 85,
      functions: 100,
      lines: 88,
    },
    "./helpers/statisticsHelpers.js": {
      statements: 80,
      branches: 75,
      functions: 95,
      lines: 80,
    },
  },
};
