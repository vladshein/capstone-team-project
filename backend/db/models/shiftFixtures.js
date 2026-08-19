const fixtures = [
  [1, "Маркет Плюс", "Продавець-консультант", "Касир торговельного залу", "Київ", "вул. Левка Лук'яненка, 21", "вул. Миколи Голего, 7", 50.5213, 30.4987, 50.4368, 30.4427, 170],
  [2, "Смачна Справа", "Офіціант", "Кухар-помічник", "Львів", "вул. Вірменська, 20", "просп. Свободи, 15", 49.8432, 24.0321, 49.842, 24.0262, 185],
  [3, "Логістик Хаб", "Комплектувальник", "Вантажник", "Київ", "вул. Пухівська, 1", "вул. Сортувальна, 2", 50.5257, 30.6228, 50.4586, 30.6621, 190],
  [4, "Швидка доставка", "Кур'єр", "Водій-кур'єр", "Київ", "вул. Велика Васильківська, 72", "просп. Берестейський, 37", 50.4406, 30.5184, 50.4501, 30.4666, 175],
  [5, "Clean Space", "Прибиральник", "Працівник клінінгу", "Київ", "вул. Антоновича, 51", "вул. Верхній Вал, 18", 50.4364, 30.5169, 50.4694, 30.5135, 165],
  [6, "ПакМайстер", "Пакувальник", "Оператор виробництва", "Бровари", "вул. Київська, 135", "бул. Незалежності, 12", 50.5087, 30.7904, 50.5154, 30.8094, 180],
  [7, "Event Team", "Промоутер", "Хостес", "Київ", "вул. Хрещатик, 22", "вул. Велика Житомирська, 2А", 50.4454, 30.5205, 50.4555, 30.5151, 170],
  [8, "БудСервіс", "Підсобний робітник", "Монтажник", "Київ", "вул. Набережно-Рибальська, 9", "вул. Академіка Заболотного, 37", 50.4869, 30.5264, 50.3629, 30.4616, 200],
  [9, "Варта Плюс", "Охоронець", "Контролер залу", "Львів", "вул. Городоцька, 179", "вул. Кульпарківська, 226", 49.8316, 23.9764, 49.8074, 23.9831, 180],
  [10, "Зелена ферма", "Працівник теплиці", "Збирач урожаю", "Львів", "вул. Пластова, 13", "с. Малехів, вул. Київська, 1", 49.8751, 24.0714, 49.9274, 24.026, 160],
  [11, "Контакт Центр", "Оператор кол-центру", "Адміністратор", "Львів", "вул. Наукова, 7Д", "вул. Стрийська, 48", 49.8078, 23.9998, 49.8058, 24.0238, 175],
  [12, "Добрий дім", "Помічник по дому", "Няня", "Київ", "вул. Січових Стрільців, 52", "вул. Княжий Затон, 11", 50.4549, 30.506, 50.4121, 30.5867, 190],
  [13, "Beauty Point", "Помічник майстра", "Адміністратор салону", "Львів", "вул. Коперника, 20", "вул. Замарстинівська, 83А", 49.8398, 24.0247, 49.862, 24.0234, 185],
  [14, "АвтоПрофі", "Водій-експедитор", "Працівник автомийки", "Київ", "вул. Бориспільська, 9", "вул. Полярна, 20Д", 50.4058, 30.6574, 50.5175, 30.4694, 195],
  [15, "Лапка", "Доглядальник за тваринами", "Помічник грумера", "Львів", "вул. Шевченка, 111", "вул. Пасічна, 102", 49.8625, 23.9538, 49.8122, 24.0724, 170],
];

// Перші п'ять дат не змінюємо: ці зміни вже можуть існувати в локальній БД.
// Решта дає достатньо даних для фільтрів, пагінації та карти.
const shiftDates = [
  "2026-08-10", "2026-08-15", "2026-08-21", "2026-08-28", "2026-09-04",
  "2026-09-08", "2026-09-12", "2026-09-16", "2026-09-20", "2026-09-24",
  "2026-09-28", "2026-10-02", "2026-10-06", "2026-10-10", "2026-10-14",
  "2026-10-18", "2026-10-22", "2026-10-26", "2026-10-30", "2026-11-03",
];
const startHours = [7, 10, 13, 8, 15, 6, 9, 12, 14, 16];

const additionalLocations = [
  ["Вінниця", "вул. Соборна, 67", 49.2331, 28.4682],
  ["Вінниця", "вул. Келецька, 64", 49.2257, 28.4448],
  ["Одеса", "вул. Дерибасівська, 12", 46.4849, 30.7326],
  ["Одеса", "вул. Канатна, 22", 46.4745, 30.7471],
  ["Дніпро", "просп. Дмитра Яворницького, 55", 48.4627, 35.0462],
  ["Дніпро", "вул. Набережна Перемоги, 60", 48.4346, 35.0729],
  ["Івано-Франківськ", "вул. Незалежності, 34", 48.9223, 24.7111],
  ["Івано-Франківськ", "вул. Галицька, 112", 48.9302, 24.7053],
  ["Хмельницький", "вул. Проскурівська, 24", 49.4229, 26.9871],
  ["Хмельницький", "вул. Кам'янецька, 52", 49.4148, 26.9977],
];

const toIso = (date, hour) => `${date}T${String(hour).padStart(2, "0")}:00:00Z`;

const regionalCenters = [
  ["Вінниця", "вул. Соборна", 49.2331, 28.4682],
  ["Луцьк", "просп. Волі", 50.7472, 25.3254],
  ["Дніпро", "просп. Дмитра Яворницького", 48.4627, 35.0462],
  ["Донецьк", "вул. Артема", 48.0159, 37.8028],
  ["Житомир", "вул. Київська", 50.2547, 28.6587],
  ["Ужгород", "вул. Корзо", 48.6208, 22.2879],
  ["Запоріжжя", "просп. Соборний", 47.8388, 35.1396],
  ["Івано-Франківськ", "вул. Незалежності", 48.9223, 24.7111],
  ["Київ", "вул. Велика Васильківська", 50.4406, 30.5184],
  ["Кропивницький", "вул. Велика Перспективна", 48.5079, 32.2623],
  ["Луганськ", "вул. Оборонна", 48.5740, 39.3078],
  ["Львів", "просп. Свободи", 49.8420, 24.0262],
  ["Миколаїв", "вул. Соборна", 46.9750, 31.9946],
  ["Одеса", "вул. Дерибасівська", 46.4849, 30.7326],
  ["Полтава", "вул. Соборності", 49.5883, 34.5514],
  ["Рівне", "вул. Соборна", 50.6199, 26.2516],
  ["Суми", "вул. Харківська", 50.9077, 34.7981],
  ["Тернопіль", "вул. Руська", 49.5535, 25.5948],
  ["Харків", "вул. Сумська", 49.9935, 36.2304],
  ["Херсон", "просп. Ушакова", 46.6354, 32.6169],
  ["Хмельницький", "вул. Проскурівська", 49.4229, 26.9871],
  ["Черкаси", "бул. Шевченка", 49.4444, 32.0598],
  ["Чернівці", "вул. Головна", 48.2915, 25.9403],
  ["Чернігів", "просп. Миру", 51.4982, 31.2893],
];

const companyPrefixes = [
  "Партнер Сервіс",
  "Міська Зміна",
  "Профі Команда",
  "Робота Поруч",
  "Локальний Хаб",
  "Гарний День",
  "Актив Плюс",
  "Надійний Вибір",
  "Швидкий Старт",
  "Команда Міста",
];

const categoryRoles = [
  "продавець-консультант",
  "офіціант",
  "комплектувальник",
  "кур'єр",
  "працівник клінінгу",
  "оператор виробництва",
  "промоутер",
  "монтажник",
  "охоронець",
  "працівник теплиці",
  "оператор підтримки",
  "помічник по дому",
  "адміністратор салону",
  "водій-експедитор",
  "доглядальник за тваринами",
];

const categoryRates = [170, 185, 190, 175, 165, 180, 170, 200, 180, 160, 175, 190, 185, 195, 170];

function buildDatesUntilSeptemberEnd() {
  const dates = [];
  const currentDate = new Date("2026-08-13T00:00:00Z");
  const lastDate = new Date("2026-09-30T00:00:00Z");

  while (currentDate <= lastDate) {
    dates.push(currentDate.toISOString().slice(0, 10));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
}

export function buildExpandedShiftFixtures() {
  const companies = [];
  const locations = [];
  const jobPositions = [];
  const shifts = [];

  fixtures.forEach((fixture, index) => {
    const [categoryId, companyName, firstRole, secondRole, city, firstAddress, secondAddress, firstLat, firstLng, secondLat, secondLng, hourlyRate] = fixture;
    const companyId = index + 3;
    const firstLocationId = index * 2 + 4;
    const firstPositionId = index * 2 + 4;

    companies.push({
      id: companyId,
      ownerId: 1,
      name: `ТОВ «${companyName}»`,
      edrpou: String(50100000 + index),
      legalAddress: `${city}, ${firstAddress}`,
    });
    locations.push(
      { id: firstLocationId, companyId, title: `${companyName} — локація 1`, city, address: firstAddress, latitude: firstLat, longitude: firstLng },
      { id: firstLocationId + 1, companyId, title: `${companyName} — локація 2`, city, address: secondAddress, latitude: secondLat, longitude: secondLng },
    );

    const extraLocationId = 34 + index * 2;
    const [thirdCity, thirdAddress, thirdLat, thirdLng] = additionalLocations[(index * 2) % additionalLocations.length];
    const [fourthCity, fourthAddress, fourthLat, fourthLng] = additionalLocations[(index * 2 + 1) % additionalLocations.length];
    locations.push(
      { id: extraLocationId, companyId, title: `${companyName} — локація 3`, city: thirdCity, address: thirdAddress, latitude: thirdLat, longitude: thirdLng },
      { id: extraLocationId + 1, companyId, title: `${companyName} — локація 4`, city: fourthCity, address: fourthAddress, latitude: fourthLat, longitude: fourthLng },
    );
    jobPositions.push(
      { id: firstPositionId, title: `${firstRole} (${companyName})`, description: `Зміна для позиції «${firstRole}».`, categoryId },
      { id: firstPositionId + 1, title: `${secondRole} (${companyName})`, description: `Зміна для позиції «${secondRole}».`, categoryId },
    );

    shiftDates.forEach((date, shiftIndex) => {
      const positionId = firstPositionId + (shiftIndex % 2);
      const role = shiftIndex % 2 ? secondRole : firstRole;
      const startHour = startHours[shiftIndex % startHours.length];
      const locationIndex = shiftIndex < 5 ? shiftIndex % 2 : shiftIndex % 4;
      const locationId = locationIndex < 2
        ? firstLocationId + locationIndex
        : extraLocationId + locationIndex - 2;
      // Не змінюємо вже наявні ID перших 75 тестових змін.
      const id = shiftIndex < 5
        ? 22 + index * 5 + shiftIndex
        : 97 + index * (shiftDates.length - 5) + (shiftIndex - 5);

      shifts.push({
        id,
        companyId,
        locationId,
        positionId,
        categoryId,
        startTime: toIso(date, startHour),
        endTime: toIso(date, startHour + 8),
        hourlyRate,
        bonusRate: shiftIndex === 2 ? 250 : shiftIndex === 4 ? 150 : 0,
        description: `Потрібен ${role.toLowerCase()} на зміну. Деталі завдання надасть координатор локації.`,
        status: "open",
      });
    });
  });

  return { companies, locations, jobPositions, shifts };
}

/**
 * Дані для перевірки фільтрів і карти: по 100 відкритих змін у кожному
 * обласному центрі. У кожному місті залучено десять окремих компаній.
 */
export function buildRegionalShiftFixtures() {
  const companies = [];
  const locations = [];
  const jobPositions = [];
  const shifts = [];
  const shiftDatesUntilSeptemberEnd = buildDatesUntilSeptemberEnd();
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  regionalCenters.forEach(([city, street, latitude, longitude], cityIndex) => {
    const companyIdStart = 1000 + cityIndex * companyPrefixes.length;
    const locationIdStart = 1000 + cityIndex * companyPrefixes.length;
    const positionIdStart = 1000 + cityIndex * categoryRoles.length;
    const shiftIdStart = 1000 + cityIndex * 100;

    companyPrefixes.forEach((prefix, companyIndex) => {
      const companyId = companyIdStart + companyIndex;
      const address = `${street}, ${12 + companyIndex * 7}`;

      companies.push({
        id: companyId,
        ownerId: 1,
        name: `ТОВ «${prefix} — ${city}»`,
        edrpou: String(60000000 + cityIndex * 100 + companyIndex),
        legalAddress: `${city}, ${address}`,
      });
      locations.push({
        id: locationIdStart + companyIndex,
        companyId,
        title: `${prefix} — ${city}`,
        city,
        address,
        latitude: Number((latitude + (companyIndex - 4.5) * 0.003).toFixed(6)),
        longitude: Number((longitude + ((companyIndex % 3) - 1) * 0.004).toFixed(6)),
      });
    });

    categoryRoles.forEach((role, categoryIndex) => {
      jobPositions.push({
        id: positionIdStart + categoryIndex,
        title: `${role[0].toUpperCase()}${role.slice(1)} (${city})`,
        description: `Тестова позиція «${role}» у місті ${city}.`,
        categoryId: categoryIndex + 1,
      });
    });

    for (let shiftIndex = 0; shiftIndex < 100; shiftIndex += 1) {
      const categoryIndex = shiftIndex % categoryRoles.length;
      const companyIndex = shiftIndex % companyPrefixes.length;
      const startHour = hours[shiftIndex % hours.length];
      const date = shiftDatesUntilSeptemberEnd[shiftIndex % shiftDatesUntilSeptemberEnd.length];

      shifts.push({
        id: shiftIdStart + shiftIndex,
        companyId: companyIdStart + companyIndex,
        locationId: locationIdStart + companyIndex,
        positionId: positionIdStart + categoryIndex,
        categoryId: categoryIndex + 1,
        startTime: toIso(date, startHour),
        endTime: toIso(date, startHour + (shiftIndex % 4 === 0 ? 4 : 8)),
        hourlyRate: categoryRates[categoryIndex],
        bonusRate: shiftIndex % 9 === 0 ? 250 : shiftIndex % 5 === 0 ? 100 : 0,
        description: `Потрібен ${categoryRoles[categoryIndex]} на зміну. Деталі завдання надасть координатор локації.`,
        status: "open",
      });
    }
  });

  return { companies, locations, jobPositions, shifts };
}
