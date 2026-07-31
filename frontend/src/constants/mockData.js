import { USER_ROLES } from "./navigation";

export const TICKER_SHIFTS = [
  { role: "Бариста", company: "Aroma Kava", rate: 220, distance: 1.2 },
  { role: "Офіціант", company: "Пузата Хата", rate: 190, distance: 0.8 },
  { role: "Комплектувальник", company: "Rozetka", rate: 260, distance: 3.4 },
  { role: "Промоутер", company: "Kyivstar", rate: 240, distance: 2.1 },
  { role: "Кур’єр", company: "Glovo", rate: 210, distance: 0.5 },
  { role: "Прибиральник/-ця", company: "CleanPro", rate: 200, distance: 1.9 },
  { role: "Касир", company: "АТБ", rate: 205, distance: 2.7 },
];

export const FEATURED_SHIFTS = [
  {
    id: 1,
    role: "Бариста на зміну",
    company: "Aroma Kava",
    category: "☕",
    rate: 220,
    budget: 1760,
    distance: 1.2,
    rating: 4.8,
  },
  {
    id: 2,
    role: "Комплектувальник складу",
    company: "Rozetka Fulfillment",
    category: "📦",
    rate: 260,
    budget: 2080,
    distance: 3.4,
    rating: 4.6,
  },
  {
    id: 3,
    role: "Офіціант/-ка на банкет",
    company: "Event Hall Fusion",
    category: "🍽️",
    rate: 300,
    budget: 2400,
    distance: 4.0,
    rating: 4.9,
  },
  {
    id: 4,
    role: "Промоутер на дегустацію",
    company: "Kyivstar Retail",
    category: "📣",
    rate: 240,
    budget: 1920,
    distance: 2.1,
    rating: 4.7,
  },
];

export const TESTIMONIALS = [
  {
    name: "Марина К.",
    role: "Виконавиця, 34 зміни",
    text: "Знайшла зміну за 15 хвилин ввечері, а вранці вже вийшла на роботу. Виплата прийшла того ж дня.",
  },
  {
    name: "Олег Т.",
    role: "Власник кав’ярні",
    text: "Закриваю вихід бариста за пів години до відкриття. Ескроу знімає всі питання про довіру.",
  },
  {
    name: "Анна В.",
    role: "Виконавиця, 12 змін",
    text: "Мапа показує зміни поруч із домом — більше не їжджу через все місто заради підробітку.",
  },
];

export const HOW_IT_WORKS = {
  worker: [
    [
      "Знайди зміну поруч",
      "Мапа й фільтри показують доступні зміни у твоєму радіусі просто зараз.",
    ],
    [
      "Забронюй в один клік",
      "Підтвердження бронювання займає секунди — без дзвінків і листування.",
    ],
    [
      "Отримай виплату одразу",
      "Гроші надходять на баланс одразу після підтвердження зміни замовником.",
    ],
  ],
  business: [
    [
      "Опублікуй вакансію за 2 хвилини",
      "Форма без зайвих полів: позиція, ставка, час, локація.",
    ],
    [
      "Отримай перевірених виконавців",
      "Рейтинг, історія змін і верифікація через Дію — до найму все видно.",
    ],
    [
      "Оплата через ескроу",
      "Кошти резервуються при бронюванні й списуються лише після виконання зміни.",
    ],
  ],
};
