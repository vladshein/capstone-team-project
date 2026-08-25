const isValidIsoDate = (value) => {
  if (typeof value !== "string") return false;

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/,
  );
  if (!match || Number.isNaN(Date.parse(value))) return false;

  const [, year, month, day] = match.map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  return (
    calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 &&
    calendarDate.getUTCDate() === day
  );
};

export default isValidIsoDate;
