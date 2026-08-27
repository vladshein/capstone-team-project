/**
 * Whether `to` is more than `maxMonths` after `from`.
 *
 * Порівняння лише номерів місяців (`(toYear-fromYear)*12 + (toMonth-fromMonth)`)
 * дає хибний результат на межі місяця — наприклад, 390 днів може виглядати як
 * рівно 12 календарних місяців, бо різниця днів у межах місяця ігнорується.
 * Тому віднімаємо рівно `maxMonths` від кінцевої точки діапазону (через
 * `setMonth`, який коректно переносить день/місяць/рік) і порівнюємо дати
 * напряму, а не рахуємо кількість місяців.
 */
const exceedsMaxRangeMonths = (from, to, maxMonths) => {
  const oldestAllowedDate = new Date(to);
  oldestAllowedDate.setMonth(oldestAllowedDate.getMonth() - maxMonths);

  return from < oldestAllowedDate;
};

export default exceedsMaxRangeMonths;
