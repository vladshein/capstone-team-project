import React, { useState } from "react";
import { MapPin, Search, Wallet, ShieldCheck, Zap } from "lucide-react";
import { Ticker } from "../components/ui/Ticker";
import { TasksBoard } from "./TasksBoard/TasksBoard";
import { NearbyShifts } from "./NearbyShifts";
import { TestimonialsSlider } from "./Testimonials";
import { FEATURED_SHIFTS, HOW_IT_WORKS } from "../constants/mockData";
import type { AuthUser } from "../redux/auth/types";

interface HeroProps {
  onOpenSignUp?: () => void;
  onOpenBusinessSignUp?: () => void;
  isAuthenticated?: boolean;
  userRole?: AuthUser["role"];
}

export function Hero({
  onOpenSignUp,
  onOpenBusinessSignUp,
  isAuthenticated = false,
  userRole,
}: HeroProps) {
  const [audience, setAudience] = useState<"worker" | "business">("worker");
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  
  return (
    <div>
      {/* Верхня секція має власний, ширший ритм (lg:+2rem), бо це hero з
         grid-макетом — тому 4-тіерний calc, а не стандартний 3-тіерний. */}
      <section className="relative overflow-hidden bg-bg-muted">
        <div className="mx-auto text-center grid max-w-7xl gap-8 px-4 py-[calc(var(--space-section)-2.5rem)] sm:gap-10 sm:px-6 sm:py-[calc(var(--space-section)-1rem)] md:px-8 md:py-[var(--space-section)] lg:items-center lg:py-[calc(var(--space-section)+2rem)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-text">
              <Zap className="h-3.5 w-3.5" /> Нові зміни з’являються щохвилини
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-[1.15] tracking-tight sm:mt-5 sm:text-4xl sm:leading-[1.1] md:text-5xl lg:text-[3.25rem]">
              Робота на сьогодні,
              <br />
              не на місяць.
            </h1>
            <div className="flex flex-col items-center text-center">
              <p className="mt-4 max-w-md text-sm text-text text-center sm:text-base lg:text-lg">
                Зміна.ua — біржа змін: виконавці знаходять оплачувану роботу поруч
                за годину, а бізнес закриває вакансію за хвилини.
              </p>
            
            {/* fixme: need remove  */}
            {/* <form
              onSubmit={handleSearchSubmit}
              className="mt-6 flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-bg p-2 shadow-sm sm:mt-8 sm:flex-row"
            >
              <label className="flex flex-1 items-center gap-2 rounded-[var(--radius-card)] px-3 py-3 sm:py-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-text-subtle" />
                <input
                  type="text"
                  placeholder="Ваше місто або район"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-text-subtle"
                />
              </label>
              <span className="hidden w-px self-stretch bg-border sm:block" />
              <label className="flex flex-1 items-center gap-2 rounded-[var(--radius-card)] px-3 py-3 sm:py-2.5">
                <Search className="h-4 w-4 shrink-0 text-text-subtle" />
                <input
                  type="text"
                  placeholder="Категорія: бариста, склад, промо…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-text-subtle"
                />
              </label>
              <button
                type="submit"
                className="min-h-[44px] w-full rounded-[var(--radius-card)] bg-accent px-6 text-sm font-medium text-white hover:bg-accent-hover sm:w-auto"
              >
                Знайти зміну
              </button>
            </form> */}
            {/* fixme: end remove  */}

            <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap">
              <a
                href="/#zavdannia"
                className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] bg-bg-inverse px-5 font-medium text-white hover:bg-accent sm:justify-start"
              >
                Я шукаю зміну
              </a>
              <button
                type="button"
                onClick={onOpenBusinessSignUp}
                className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-border bg-bg px-5 font-medium hover:border-accent-hover sm:justify-start"
              >
                Мені потрібен персонал
              </button>
            </div>
            </div>
          </div>

          {/* <div className="relative rounded-[var(--radius-card)] border border-border bg-bg p-2.5 shadow-[0_20px_60px_-30px_rgba(18,19,26,0.35)] sm:p-3">
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-[var(--radius-card)] bg-bg/95 px-3 py-2.5 shadow-lg backdrop-blur sm:bottom-6 sm:left-6 sm:right-6 sm:px-4 sm:py-3">
              <div>
                <p className="text-xs text-text-muted">Найближча зміна</p>
                <p className="text-sm font-semibold">Бариста · 0.8 км</p>
              </div>
              <span className="font-mono text-sm font-semibold text-accent">
                220₴/год
              </span>
            </div>
          </div> */}
        </div>
      </section>

      <TasksBoard />

      {/* Стандартні секції контенту — 3-тіерний ритм відносно --space-section */}
      <section className="mx-auto max-w-7xl px-4 py-[calc(var(--space-section)-1.5rem)] sm:px-6 sm:py-[calc(var(--space-section)-1rem)] md:px-8 md:py-[var(--space-section)]">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Як це працює
          </h2>
          <div className="flex w-full rounded-[var(--radius-pill)] border border-border p-1 text-sm sm:w-auto">
            <button
              type="button"
              onClick={() => setAudience("worker")}
              className={`flex-1 rounded-[var(--radius-pill)] px-3 py-2 font-medium transition-colors sm:flex-initial sm:px-4 sm:py-1.5 ${
                audience === "worker" ? "bg-bg-inverse text-white" : "text-text"
              }`}
            >
              Для виконавця
            </button>
            <button
              type="button"
              onClick={() => setAudience("business")}
              className={`flex-1 rounded-[var(--radius-pill)] px-3 py-2 font-medium transition-colors sm:flex-initial sm:px-4 sm:py-1.5 ${
                audience === "business" ? "bg-bg-inverse text-white" : "text-text"
              }`}
            >
              Для бізнесу
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-6">
          {HOW_IT_WORKS[audience].map(([title, desc], i) => (
            <div
              key={title}
              className="rounded-[var(--radius-card)] border border-border p-5 sm:p-6"
            >
              <span className="font-mono text-sm text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-heading text-lg font-semibold">
                {title}
              </h3>
              <p className="mt-2 text-sm text-text-muted">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 text-sm text-text sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-6 sm:pt-8">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" /> Ескроу -
            захист виплат
          </span>
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4 shrink-0 text-accent" /> Виплата одразу
            після зміни
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" /> Верифікація
            через Дію
          </span>
        </div>
      </section>

      <NearbyShifts />

      <section className="mx-auto max-w-7xl px-4 py-[calc(var(--space-section)-1.5rem)] sm:px-6 sm:py-[calc(var(--space-section)-1rem)] md:px-8 md:py-[var(--space-section)]">
        <TestimonialsSlider />
      </section>

      <section className="bg-bg-inverse py-[calc(var(--space-section)-1.5rem)] sm:py-[calc(var(--space-section)-1rem)] md:py-[var(--space-section)]">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 md:px-8">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            Перша зміна може початися вже сьогодні
          </h2>
          <p className="mt-3 text-sm text-text-on-dark sm:mt-4 sm:text-base">
            {isAuthenticated
              ? "Переглядайте актуальні зміни або керуйте вакансіями у своєму кабінеті."
              : "Реєстрація займає дві хвилини. Обери роль — виконавець чи бізнес — і починай."}
          </p>
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={onOpenSignUp}
              className="mt-6 min-h-[44px] w-full rounded-[var(--radius-pill)] bg-accent px-7 text-sm font-medium text-white hover:bg-accent-hover sm:mt-8 sm:w-auto"
            >
              Зареєструватися безкоштовно
            </button>
          ) : userRole === "business_client" ? (
            <button
              type="button"
              onClick={onOpenBusinessSignUp}
              className="mt-6 min-h-[44px] w-full rounded-[var(--radius-pill)] bg-accent px-7 text-sm font-medium text-white hover:bg-accent-hover sm:mt-8 sm:w-auto"
            >
              Перейти в кабінет
            </button>
          ) : (
            <a
              href="#zavdannia"
              className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-pill)] bg-accent px-7 text-sm font-medium text-white hover:bg-accent-hover sm:mt-8 sm:w-auto"
            >
              Знайти зміну
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
