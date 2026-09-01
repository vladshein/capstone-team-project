/**
 * Конфіг Jest для фронтенду.
 *
 * `collectCoverageFrom` навмисно звужено до підсистеми аналітичної статистики
 * (особистий внесок автора: ядро візуалізації, доменні Redux-зрізи, сервісний
 * шар, доменні обгортки графіка). Це фіксує стабільний знаменник покриття —
 * решта застосунку тестами не покрита й розмивала б відсоток.
 * `coverageThreshold` тримає цей модуль як «храповик»: пороги трохи нижчі за
 * поточний рівень, щоб регресія покриття валила прогін, а не проходила тихо.
 */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  collectCoverageFrom: [
    "src/lib/charts/**/*.{ts,tsx}",
    "src/redux/worker-statistics/**/*.ts",
    "src/redux/business-statistics/**/*.ts",
    "src/services/workerStatisticsService.ts",
    "src/services/businessStatisticsService.ts",
    "src/pages/worker/WorkerStatistics.tsx",
    "src/pages/worker/WorkerShiftsDynamics.tsx",
    "src/pages/business/BusinessStatistics.tsx",
    "src/pages/business/BusinessShiftsDynamics.tsx",
    "src/components/ui/StatCard.tsx",
    "!src/**/types.ts",
    // worker-statistics/constants.ts не імпортується ніде (воркерські thunk'и
    // задають типи екшенів рядковими літералами) — мертвий код у знаменнику.
    "!src/redux/worker-statistics/constants.ts",
  ],
  coverageReporters: ["text", "text-summary", "lcov"],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 82,
      functions: 92,
      lines: 92,
    },
  },
};
