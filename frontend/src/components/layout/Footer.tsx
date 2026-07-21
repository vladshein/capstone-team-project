export function Footer() {
  return (
    <footer className="border-t border-border bg-bg py-10 sm:py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 sm:px-6 md:grid-cols-4 md:px-8">
        <div className="col-span-2 md:col-span-1">
          <span className="font-heading text-lg font-bold">
            Зміна<span className="text-accent">.ua</span>
          </span>
          <p className="mt-3 max-w-xs text-sm text-text-muted">
            Біржа змін для тих, кому потрібна робота чи персонал просто зараз.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Виконавцям</h4>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>
              <a href="/shifts" className="hover:text-accent">
                Знайти зміну
              </a>
            </li>
            <li>
              <a href="/my-shifts" className="hover:text-accent">
                Мої бронювання
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Бізнесу</h4>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>
              <a href="/dashboard" className="hover:text-accent">
                Розмістити вакансію
              </a>
            </li>
            <li>
              <a href="/dashboard" className="hover:text-accent">
                Кабінет замовника
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Компанія</h4>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>
              <a href="/about" className="hover:text-accent">
                Про нас
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-accent">
                Умови використання
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl px-4 text-xs text-text-subtle sm:mt-10 sm:px-6 md:px-8">
        © {new Date().getFullYear()} Зміна.ua. Усі права захищено.
      </p>
    </footer>
  );
}
