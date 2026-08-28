import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Building2, Heart, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { getPublicCompanyProfiles, type PublicCompanyProfile } from "../../api/publicProfiles";
import { Loader } from "../../components/ui/Loader";
import { useFavoriteCompanies } from "../../hooks/useFavoriteCompanies";

const DESCRIPTION_LIMIT = 140;
const COMPANIES_PER_PAGE = 6;

export default function FavoriteCompaniesTab() {
  const { favoriteIds, removeFavorite } = useFavoriteCompanies();
  const [currentPage, setCurrentPage] = useState(1);
  const [companies, setCompanies] = useState<PublicCompanyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const totalPages = Math.ceil(favoriteIds.length / COMPANIES_PER_PAGE);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const visibleCompanyIds = useMemo(
    () => favoriteIds.slice(
      (activePage - 1) * COMPANIES_PER_PAGE,
      activePage * COMPANIES_PER_PAGE,
    ),
    [activePage, favoriteIds],
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  useEffect(() => {
    if (visibleCompanyIds.length === 0) {
      setCompanies([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void getPublicCompanyProfiles(visibleCompanyIds)
      .then((result) => {
        if (cancelled) return;
        const companiesById = new Map(result.map((company) => [company.id, company]));
        setCompanies(visibleCompanyIds.flatMap((id) => {
          const company = companiesById.get(id);
          return company ? [company] : [];
        }));
      })
      .catch(() => { if (!cancelled) setCompanies([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [visibleCompanyIds]);

  if (favoriteIds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-text-subtle">
        <Building2 className="h-7 w-7 text-accent" />
        <p>Тут з’являться компанії, які ви додали до улюблених.</p>
        <Link to="/cabinet/search" className="font-medium text-accent-text hover:underline">
          Перейти до пошуку змін →
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      {isLoading && companies.length === 0 && <Loader label="Завантажуємо улюблені компанії…" />}
      {!isLoading && companies.length === 0 && (
        <p className="py-6 text-center text-sm text-text-muted">Не вдалося знайти збережені компанії.</p>
      )}
      <div className="divide-y divide-border">
        {companies.map((company) => {
          const description = company.description?.trim();
          const shortDescription = description && description.length > DESCRIPTION_LIMIT
            ? `${description.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`
            : description;
          const cities = [...new Set(company.Locations.map((location) => location.city).filter(Boolean))];

          return (
            <article key={company.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {company.avatar ? (
                  <img src={company.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 font-heading text-lg font-semibold text-accent">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Link to={`/companies/${company.id}`} className="font-heading font-semibold text-ink transition-colors hover:text-accent-text hover:underline">
                    {company.name}
                  </Link>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-text-muted">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {cities.length ? cities.join(", ") : "Локації не вказані"}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-warning">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {company.rating > 0 ? `${company.rating.toFixed(2)} / 5` : "Ще немає оцінок"}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-text-muted sm:max-w-sm">
                {shortDescription || "Компанія ще не додала короткий опис."}
              </p>
              <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => removeFavorite(company.id)}
                  aria-label={`Прибрати ${company.name} з улюблених`}
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-accent transition-colors hover:bg-accent/10"
                >
                  <Heart className="h-5 w-5 fill-current" />
                </button>
                <Link to={`/companies/${company.id}`} className="inline-flex min-h-[40px] items-center gap-1 rounded-[var(--radius-pill)] bg-bg-inverse px-4 text-sm font-medium text-white transition-colors hover:bg-accent">
                  <span className="sm:hidden">Профіль</span><span className="hidden sm:inline">Профіль компанії</span> <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Пагінація улюблених компаній">
          <button type="button" onClick={() => setCurrentPage((page) => page - 1)} disabled={activePage === 1} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Назад</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button key={pageNumber} type="button" onClick={() => setCurrentPage(pageNumber)} aria-current={pageNumber === activePage ? "page" : undefined} className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-colors ${pageNumber === activePage ? "bg-accent text-white" : "border border-border text-text hover:border-accent"}`}>{pageNumber}</button>
          ))}
          <button type="button" onClick={() => setCurrentPage((page) => page + 1)} disabled={activePage === totalPages} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Далі</button>
        </nav>
      )}
    </div>
  );
}
