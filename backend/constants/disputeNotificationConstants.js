/** Події спору, для яких дозволено надсилати email-сповіщення. */
export const DISPUTE_NOTIFICATION_EVENTS = Object.freeze({
  dispute_opened: {
    subject: "Відкрито спір щодо зміни — Зміна",
    heading: "Відкрито новий спір",
    message:
      "Інша сторона відкрила спір щодо зміни. Перегляньте звернення та додайте свою позицію.",
  },
  dispute_message_added: {
    subject: "Нове пояснення у спорі — Зміна",
    heading: "Нове пояснення у спорі",
    message: "Інша сторона додала пояснення до спору.",
  },
  dispute_settled: {
    subject: "Спір врегульовано сторонами — Зміна",
    heading: "Спір закрито за згодою сторін",
    message:
      "Інша сторона погодилася з вашою вимогою. Рішення адміністратора не потрібне.",
  },
  dispute_escalated: {
    subject: "Спір передано адміністратору — Зміна",
    heading: "Спір передано на розгляд",
    message:
      "Інша сторона не погодилася з вимогою. Адміністратор розгляне звернення та ухвалить рішення.",
  },
  dispute_appealed: {
    subject: "Рішення у спорі оскаржено — Зміна",
    heading: "Подано апеляцію на рішення",
    message:
      "Одна зі сторін оскаржила рішення адміністратора. Спір повторно передано на розгляд.",
  },
  dispute_status_changed: {
    subject: "Статус спору оновлено — Зміна",
    heading: "Адміністратор оновив статус спору",
    message: "Перегляньте спір: адміністратор змінив етап його розгляду.",
  },
  dispute_resolved: {
    subject: "Адміністратор ухвалив рішення у спорі — Зміна",
    heading: "Рішення у спорі готове",
    message:
      "Адміністратор завершив розгляд спору. Перегляньте рішення та коментар.",
  },
});

export const isDisputeNotificationEvent = (event) =>
  typeof event === "string" &&
  Object.hasOwn(DISPUTE_NOTIFICATION_EVENTS, event);

export const getDisputeNotificationEventDetails = (event) => {
  if (!isDisputeNotificationEvent(event)) {
    throw new Error(`Unsupported dispute notification event: ${event}`);
  }
  return DISPUTE_NOTIFICATION_EVENTS[event];
};
