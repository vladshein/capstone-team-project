/**
 * Події, для яких дозволено ставити email-сповіщення в чергу.
 *
 * Обмежений перелік не дає випадково передати в job довільну тему або HTML
 * із бізнес-логіки. Текст листа централізовано формується в emailService.
 */
export const SHIFT_NOTIFICATION_EVENTS = Object.freeze({
  application_created: {
    subject: "Нова заявка на зміну — Зміна",
    heading: "Нова заявка на зміну",
    message: "На зміну надійшла нова заявка від виконавця.",
  },
  application_approved: {
    subject: "Заявку на зміну підтверджено — Зміна",
    heading: "Заявку на зміну підтверджено",
    message: "Компанія підтвердила вашу участь у зміні.",
  },
  application_rejected: {
    subject: "Заявку на зміну відхилено — Зміна",
    heading: "Заявку на зміну відхилено",
    message: "Компанія відхилила вашу заявку на зміну.",
  },
  application_completed: {
    subject: "Зміну позначено як виконану — Зміна",
    heading: "Зміну позначено як виконану",
    message: "Результат зміни підтверджено як виконаний.",
  },
  application_no_show: {
    subject: "Зміну позначено як неявку — Зміна",
    heading: "Зміну позначено як неявку",
    message: "Результат зміни зафіксовано як неявку виконавця.",
  },
  application_auto_completed: {
    subject: "Зміну автоматично завершено — Зміна",
    heading: "Зміну автоматично завершено",
    message:
      "Після завершення зміни не було зафіксовано іншого рішення, тому її позначено як виконану.",
  },
  application_withdrawn: {
    subject: "Заявку на зміну відкликано — Зміна",
    heading: "Заявку на зміну відкликано",
    message: "Виконавець відкликав заявку на вашу зміну.",
  },
  shift_cancelled: {
    subject: "Зміну скасовано — Зміна",
    heading: "Зміну скасовано",
    message: "Компанія скасувала зміну.",
  },
});

export const isShiftNotificationEvent = (event) =>
  typeof event === "string" && Object.hasOwn(SHIFT_NOTIFICATION_EVENTS, event);

export const getShiftNotificationEventDetails = (event) => {
  if (!isShiftNotificationEvent(event)) {
    throw new Error(`Unsupported shift notification event: ${event}`);
  }

  return SHIFT_NOTIFICATION_EVENTS[event];
};
