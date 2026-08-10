import { ArrowRight, BriefcaseBusiness, HeartHandshake, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

const principles = [
  {
    icon: BriefcaseBusiness,
    title: "Робота без зайвих бар’єрів",
    description:
      "Допомагаємо виконавцям швидко знаходити зміни, які підходять за часом, напрямом і локацією.",
  },
  {
    icon: UsersRound,
    title: "Надійні партнери",
    description:
      "Даємо бізнесу простий спосіб знайти людей для роботи тоді, коли вони справді потрібні.",
  },
  {
    icon: HeartHandshake,
    title: "Прозорі домовленості",
    description:
      "У кожній зміні видно ключові умови: завдання, час, адресу та винагороду.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-bg-muted">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:px-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/10" />
        <div className="pointer-events-none absolute -bottom-36 left-[15%] h-64 w-64 rounded-full bg-highlight/10" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-text">
            Про Зміна.ua
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-ink sm:text-5xl md:text-6xl">
            Робота й персонал — саме тоді, коли це потрібно
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-muted sm:text-lg">
            Зміна.ua — платформа для короткострокових змін. Ми поєднуємо людей, які шукають чесну роботу,
            з бізнесом, якому потрібна команда тут і зараз.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/#zavdannia"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Знайти зміну
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-[46px] items-center justify-center rounded-[var(--radius-pill)] border border-border bg-bg px-6 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent-text"
            >
              На головну
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-bg px-4 py-14 sm:px-6 sm:py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-accent-text">Наш підхід</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Простий сервіс для реальних задач
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {principles.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[var(--radius-card)] border border-border bg-bg-muted p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
