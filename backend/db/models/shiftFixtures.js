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

const shiftDates = ["2026-08-10", "2026-08-15", "2026-08-21", "2026-08-28", "2026-09-04"];
const startHours = [7, 10, 13, 8, 15];

const toIso = (date, hour) => `${date}T${String(hour).padStart(2, "0")}:00:00Z`;

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
    jobPositions.push(
      { id: firstPositionId, title: `${firstRole} (${companyName})`, description: `Зміна для позиції «${firstRole}».` },
      { id: firstPositionId + 1, title: `${secondRole} (${companyName})`, description: `Зміна для позиції «${secondRole}».` },
    );

    shiftDates.forEach((date, shiftIndex) => {
      const positionId = firstPositionId + (shiftIndex % 2);
      const role = shiftIndex % 2 ? secondRole : firstRole;
      const startHour = startHours[shiftIndex];

      shifts.push({
        id: 22 + index * shiftDates.length + shiftIndex,
        companyId,
        locationId: firstLocationId + (shiftIndex % 2),
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
