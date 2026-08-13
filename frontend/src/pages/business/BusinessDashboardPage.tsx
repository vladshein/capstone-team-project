import { useEffect } from "react";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchMyCompanies } from "../../redux/companies-profile/actions";
import { selectCompanies, selectCompaniesStatus } from "../../redux/companies-profile/selectors";
import { Loader } from "../../components/ui/Loader";

function BusinessDashboardPage() {
  const dispatch = useAppDispatch();
  const companies = useAppSelector(selectCompanies);
  const status = useAppSelector(selectCompaniesStatus);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchMyCompanies());
  }, [status, dispatch]);

  if (status === "loading" || status === "idle") {
    return <Loader label="Завантажуємо кабінет…" size="lg" fullScreen />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Кабінет замовника
          </h1>
          <p className="mt-1 text-sm text-text-muted">Ваші компанії</p>
        </div>
        <Link
          to="/profile"
          state={companies.length > 0 ? { openCreate: true } : undefined}
          className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          {companies.length > 0 ? "Додати компанію" : "Створити профіль компанії"}
        </Link>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-border bg-bg p-8 text-center">
          <p className="text-sm text-text-subtle">
            У вас ще немає жодної компанії.{" "}
            <Link to="/profile" className="text-accent-text hover:underline">
              Створити профіль компанії
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map((c) => (
            <Link
              key={c.id}
              to="/profile"
              state={{ companyId: c.id }}
              className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-bg p-4 text-sm hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-bg-muted">
                  <Building2 className="h-4 w-4 text-text-muted" />
                </div>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-text-subtle">{c.edrpou}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-text-subtle" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default BusinessDashboardPage;
