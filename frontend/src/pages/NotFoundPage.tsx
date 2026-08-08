import { ArrowLeft, MapPinOff } from "lucide-react";
import { Link } from "react-router-dom";

interface NotFoundPageProps {
  title?: string;
  description?: string;
}

export default function NotFoundPage({
  title = "Сторінку не знайдено",
  description = "Схоже, цієї зміни або сторінки вже немає. Повернімося туди, де є актуальні пропозиції.",
}: NotFoundPageProps) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center overflow-hidden bg-bg-muted px-4 py-16 sm:px-6">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg px-6 py-14 text-center shadow-sm sm:px-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-highlight/10" />

        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <MapPinOff aria-hidden="true" className="h-7 w-7" />
          </div>
          <p className="mt-8 font-heading text-7xl font-bold tracking-tight text-ink sm:text-8xl">
            404
          </p>
          <h1 className="mt-4 font-heading text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted sm:text-base">
            {description}
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            На головну
          </Link>
        </div>
      </div>
    </section>
  );
}
