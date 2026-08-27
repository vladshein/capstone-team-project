export const USER_ROLES = {
  GUEST: "guest",
  WORKER: "worker",
  BUSINESS: "business_client",
  ADMIN: "admin",
};

export const NAV_LINKS = [
  {
    id: "nav-home",
    href: "/",
    label: "Головна",
    authRequired: false,
    roles: [
      USER_ROLES.GUEST,
      USER_ROLES.WORKER,
      USER_ROLES.BUSINESS,
      USER_ROLES.ADMIN,
    ],
  },
  {
    id: "nav-shifts",
    href: "/#zavdannia",
    label: "Біржа змін",
    authRequired: false,
    roles: [
      USER_ROLES.GUEST,
      USER_ROLES.WORKER,
      USER_ROLES.BUSINESS,
      USER_ROLES.ADMIN,
    ],
  },
  {
    id: "nav-worker-cabinet",
    href: "/cabinet",
    label: "Кабінет виконавця",
    authRequired: true,
    roles: [USER_ROLES.WORKER],
  },
  {
    id: "nav-admin-disputes",
    href: "/admin/disputes",
    label: "Вирішення спорів",
    authRequired: true,
    roles: [USER_ROLES.ADMIN],
  },
  {
    id: "nav-business-cabinet",
    href: "/dashboard",
    label: "Кабінет замовника",
    authRequired: true,
    roles: [USER_ROLES.BUSINESS],
  },
  {
    id: "nav-profile",
    href: "/profile",
    label: "Профіль",
    authRequired: true,
    roles: [USER_ROLES.WORKER, USER_ROLES.BUSINESS],
  },
];

export const FOOTER_LINKS = [
  {
    id: "footer-sec-workers",
    title: "Виконавцям",
    links: [
      { id: "f-w-1", href: "/shifts", label: "Знайти зміну" },
      {
        id: "f-w-2",
        href: "/cabinet/bookings",
        label: "Мої бронювання",
        authRequired: true,
      },
    ],
  },
  {
    id: "footer-sec-business",
    title: "Бізнесу",
    links: [
      {
        id: "f-b-1",
        href: "/dashboard/create",
        label: "Розмістити вакансію",
        authRequired: true,
      },
      {
        id: "f-b-2",
        href: "/dashboard",
        label: "Кабінет замовника",
        authRequired: true,
      },
    ],
  },
  {
    id: "footer-sec-company",
    title: "Компанія",
    links: [
      { id: "f-c-1", href: "/about", label: "Про нас" },
      { id: "f-c-2", href: "/terms", label: "Умови використання" },
      {
        id: "f-c-3",
        href: "https://t.me/ludi_support",
        label: "Підтримка",
        isExternal: true,
      },
    ],
  },
];
