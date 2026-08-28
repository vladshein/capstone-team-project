/**
 * Тестові дані для перегляду сторінки статистики бізнесу в браузері.
 *
 * Компанія id=1 ("ТОВ 'Сільпо-Фуд'", ownerId=1) з наявних фікстур мала лише
 * 11 змін (усі "open") без жодної заявки — сторінка /business/statistics для
 * неї показувала майже порожні картки, графік динаміки з однією точкою й
 * порожню таблицю воркерів. Додаємо ~2.5 місяці змін з різними статусами
 * (completed/cancelled/in_progress/booked/open) та заявки з різними
 * статусами (completed/no_show/approved/rejected/pending) від пулу з 16
 * воркерів, щоб summary/dynamics/workers-таблиця мали що показати.
 *
 * На відміну від решти фікстур у `json/`, дати тут не можна зафіксувати
 * статично: вони рахуються відносно моменту запуску seed-скрипта, щоб дані
 * завжди потрапляли у стандартне 3-місячне вікно `resolveDateRange` (інакше
 * за кілька місяців ця ж фікстура випала б за межі дефолтного діапазону
 * статистики). Тому це JS-білдер поруч із `shiftFixtures.js`, а не JSON.
 */

import bcrypt from "bcrypt";

const WORKER_ID_START = 9001;
const WORKER_COUNT = 14;
const SHIFT_ID_START = 9101;
const APPLICATION_ID_START = 9301;

const WORKER_NAMES = [
  ["Олена", "Бондаренко"],
  ["Дмитро", "Ткаченко"],
  ["Наталія", "Мельник"],
  ["Андрій", "Савченко"],
  ["Юлія", "Гриценко"],
  ["Сергій", "Романюк"],
  ["Тетяна", "Поліщук"],
  ["Максим", "Лисенко"],
  ["Вікторія", "Ковальчук"],
  ["Богдан", "Захарчук"],
  ["Ірина", "Дяченко"],
  ["Артем", "Сидоренко"],
  ["Катерина", "Марченко"],
  ["Павло", "Кравець"],
];

const day = (date, delta) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + delta);
  return next;
};

const atUTC = (date, hour, minute = 0) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute),
  );

const toDateOnly = (date) => date.toISOString().slice(0, 10);

export async function buildBusinessStatisticsFixtures() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // --- Воркери, профілі й гаманці ------------------------------------
  const workerIds = Array.from({ length: WORKER_COUNT }, (_, i) => WORKER_ID_START + i);

  // Реальний bcrypt-хеш (не рядок-заглушка), щоб цими акаунтами можна було
  // залогінитись через звичайний /auth/login з паролем SEED_TEST_PASSWORD.
  const testPasswordHash = await bcrypt.hash(process.env.SEED_TEST_PASSWORD || "12345678", 10);

  const users = workerIds.map((id, i) => ({
    id,
    phone: `+38099${String(2000000 + i).padStart(7, "0")}`,
    email: `business-stats-worker-${i + 1}@smena.test`,
    passwordHash: testPasswordHash,
    role: "worker",
    isVerified: true,
    created_at: day(today, -90 + i),
  }));

  const workerProfiles = workerIds.map((id, i) => ({
    id,
    userId: id,
    firstName: WORKER_NAMES[i][0],
    lastName: WORKER_NAMES[i][1],
    birthDate: toDateOnly(new Date(Date.UTC(1993 + (i % 8), i % 12, 5 + (i % 20)))),
    taxNumber: String(5000000001 + i),
    rating: Number((3.6 + (i % 8) * 0.18).toFixed(2)),
    avatarUrl: null,
  }));

  const wallets = workerIds.map((id, i) => ({
    id,
    userId: id,
    balance: Number((500 + i * 137.5).toFixed(2)),
    frozenBalance: i % 3 === 0 ? Number((80 + i * 5).toFixed(2)) : 0,
  }));

  // --- Зміни компанії id=1 (локації 1 і 2) ----------------------------
  // Тиждень 0 — поточний; від'ємні — минулі (в межах 3-місячного вікна
  // статистики за замовчуванням), додатні — заплановані наперед.
  const weekOffsets = [];
  for (let w = -13; w <= 2; w += 1) weekOffsets.push(w);

  const shifts = [];
  weekOffsets.forEach((weekOffset, weekIndex) => {
    const weekStart = day(today, weekOffset * 7);

    let dayStatus;
    if (weekOffset < 0) {
      dayStatus = weekIndex % 6 === 0 ? "cancelled" : "completed";
    } else if (weekOffset === 0) {
      dayStatus = "in_progress";
    } else if (weekOffset === 1) {
      dayStatus = "booked";
    } else {
      dayStatus = "open";
    }

    let nightStatus;
    if (weekOffset < 0) {
      nightStatus = weekIndex % 6 === 0 ? "cancelled" : "completed";
    } else if (weekOffset === 0) {
      nightStatus = "booked";
    } else {
      nightStatus = "open";
    }

    // Локація 1 — денна зміна касира.
    shifts.push({
      id: SHIFT_ID_START + weekIndex * 2,
      locationId: 1,
      positionId: 1,
      categoryId: 1,
      startTime: atUTC(weekStart, 8),
      endTime: atUTC(weekStart, 18),
      hourlyRate: 150.0,
      bonusRate: 0.0,
      description: "Потрібен касир на денну зміну. Обов'язковий досвід роботи.",
      status: dayStatus,
    });

    // Локація 2 — нічне розвантаження.
    const nightStart = day(weekStart, 1);
    shifts.push({
      id: SHIFT_ID_START + weekIndex * 2 + 1,
      locationId: 2,
      positionId: 2,
      categoryId: 3,
      startTime: atUTC(weekStart, 20),
      endTime: atUTC(nightStart, 4),
      hourlyRate: 180.0,
      bonusRate: weekIndex % 5 === 0 ? 200.0 : 0.0,
      description: "Нічне розвантаження товару. Бонус за виконання плану.",
      status: nightStatus,
    });
  });

  // --- Заявки на ці зміни ---------------------------------------------
  const pool = [6, 7, ...workerIds];
  const shiftApplications = [];
  let nextApplicationId = APPLICATION_ID_START;

  const pushApplication = (fields) => {
    shiftApplications.push({ id: nextApplicationId, ...fields });
    nextApplicationId += 1;
  };

  shifts.forEach((shift, i) => {
    const primaryWorker = pool[i % pool.length];

    switch (shift.status) {
      case "completed": {
        pushApplication({
          shiftId: shift.id,
          workerId: primaryWorker,
          status: "completed",
          appliedAt: day(shift.startTime, -5),
          actualStartTime: new Date(shift.startTime.getTime() + 3 * 60 * 1000),
          actualEndTime: new Date(shift.endTime.getTime() - 2 * 60 * 1000),
        });

        if (i % 4 === 3) {
          pushApplication({
            shiftId: shift.id,
            workerId: pool[(i + 8) % pool.length],
            status: "no_show",
            appliedAt: day(shift.startTime, -4),
            actualStartTime: null,
            actualEndTime: null,
          });
        }
        break;
      }
      case "cancelled": {
        pushApplication({
          shiftId: shift.id,
          workerId: primaryWorker,
          status: "rejected",
          appliedAt: day(shift.startTime, -6),
          actualStartTime: null,
          actualEndTime: null,
        });
        break;
      }
      case "in_progress": {
        pushApplication({
          shiftId: shift.id,
          workerId: primaryWorker,
          status: "approved",
          appliedAt: day(shift.startTime, -3),
          actualStartTime: shift.startTime,
          actualEndTime: null,
        });
        break;
      }
      case "booked": {
        pushApplication({
          shiftId: shift.id,
          workerId: primaryWorker,
          status: "approved",
          appliedAt: day(shift.startTime, -2),
          actualStartTime: null,
          actualEndTime: null,
        });
        break;
      }
      case "open": {
        pushApplication({
          shiftId: shift.id,
          workerId: primaryWorker,
          status: "pending",
          appliedAt: day(today, -1),
          actualStartTime: null,
          actualEndTime: null,
        });
        pushApplication({
          shiftId: shift.id,
          workerId: pool[(i + 3) % pool.length],
          status: "pending",
          appliedAt: today,
          actualStartTime: null,
          actualEndTime: null,
        });
        break;
      }
      default:
        break;
    }
  });

  return { users, workerProfiles, wallets, shifts, shiftApplications };
}
