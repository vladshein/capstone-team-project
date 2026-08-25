import { useEffect, useState } from "react";
import { Archive, BriefcaseBusiness, ChevronDown, Plus, TrendingUp, Users } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Loader } from "../../components/ui/Loader";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchMyCompanies } from "../../redux/companies-profile/actions";
import {
  selectCompanies,
  selectCompaniesStatus,
} from "../../redux/companies-profile/selectors";
import type { CompanyProfile } from "../../redux/companies-profile/types";
import { createNewShift } from "../../redux/shift/actions";
import { clearShiftError } from "../../redux/shift/slice";
import { getPendingBusinessShiftApplicationsCount, type CreateShiftPayload } from "../../api/shifts";
import { CreateShiftModal } from "./CreateShiftModal";

export interface BusinessDashboardOutletContext {
  company: CompanyProfile;
  shiftsRefreshKey: number;
  onApplicationsChanged: () => void;
}

const tabs = [
  { to: "shifts", label: "Мої зміни", Icon: BriefcaseBusiness },
  { to: "applications", label: "Заявки", Icon: Users },
  { to: "archive", label: "Архів", Icon: Archive },
  { to: "statistics", label: "Статистика", Icon: TrendingUp },
];

function BusinessDashboardPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const companies = useAppSelector(selectCompanies);
  const status = useAppSelector(selectCompaniesStatus);
  const isCreatingShift = useAppSelector((state) => state.shift.isCreating);
  const shiftError = useAppSelector((state) => state.shift.error);
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [shiftsRefreshKey, setShiftsRefreshKey] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [applicationsRefreshKey, setApplicationsRefreshKey] = useState(0);
  const navigationState = location.state as
    | { companyId?: number; openCreateShift?: boolean }
    | null;

  useEffect(() => {
    if (status === "idle") void dispatch(fetchMyCompanies());
  }, [dispatch, status]);

  useEffect(() => {
    if (activeCompanyId === null && companies.length > 0) {
      setActiveCompanyId(companies[0].id);
    }
  }, [activeCompanyId, companies]);

  // Кнопка з профілю компанії відкриває форму саме для вибраної компанії.
  useEffect(() => {
    if (!navigationState?.openCreateShift || companies.length === 0) return;

    const requestedCompany = companies.find((company) => company.id === navigationState.companyId);
    if (requestedCompany) setActiveCompanyId(requestedCompany.id);
    dispatch(clearShiftError());
    setIsCreateShiftOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [companies, dispatch, location.pathname, navigate, navigationState?.companyId, navigationState?.openCreateShift]);

  const activeCompany = companies.find((company) => company.id === activeCompanyId) ?? companies[0];

  useEffect(() => {
    if (!activeCompany) {
      setPendingApplicationsCount(0);
      return undefined;
    }

    let cancelled = false;
    void getPendingBusinessShiftApplicationsCount(activeCompany.id)
      .then((count) => { if (!cancelled) setPendingApplicationsCount(count); })
      .catch(() => { if (!cancelled) setPendingApplicationsCount(0); });
    return () => { cancelled = true; };
  }, [activeCompany?.id, applicationsRefreshKey]);

  if (status === "loading" || status === "idle") {
    return <Loader label="Завантажуємо кабінет…" size="lg" fullScreen />;
  }

  if (companies.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
        <div className="rounded-[var(--radius-card)] border border-border bg-bg p-8 text-center shadow-sm">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-accent" />
          <h1 className="mt-4 font-heading text-2xl font-bold">Кабінет компанії</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            Спершу створіть профіль компанії — тоді зможете публікувати зміни й отримувати заявки.
          </p>
          <Link to="/profile" state={{ openCreate: true }} className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
            <Plus className="h-4 w-4" />
            Створити компанію
          </Link>
        </div>
      </section>
    );
  }

  const handleCreateShift = async (payload: CreateShiftPayload) => {
    await dispatch(createNewShift(payload)).unwrap();
    setIsCreateShiftOpen(false);
    setShiftsRefreshKey((key) => key + 1);
    navigate("/dashboard/shifts");
  };

  const refreshCompanyLocations = async () => {
    await dispatch(fetchMyCompanies()).unwrap();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Кабінет компанії</h1>
          <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2 text-sm text-text-muted">
            {companies.length === 1 ? (
              <div className="flex flex-col">
                <span className="text-xs text-text-subtle">Активна компанія</span>
                <span className="mt-0.5 font-medium text-text">{activeCompany.name}</span>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col">
                <span className="text-xs text-text-subtle">Активна компанія</span>
                <span className="relative mt-0.5 inline-flex items-center">
                  <select value={activeCompany.id} onChange={(event) => setActiveCompanyId(Number(event.target.value))} className="min-h-[36px] cursor-pointer appearance-none rounded-[var(--radius-pill)] border border-border bg-bg py-1 pl-3 pr-9 text-sm font-medium text-text outline-none transition-colors hover:border-accent focus:border-accent">
                    {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-text-subtle" />
                </span>
              </label>
            )}
            <Link
              to="/profile"
              state={{ companyId: activeCompany.id }}
              className={`text-accent-text hover:underline ${companies.length > 1 ? "mb-1" : ""}`}
            >
              Профіль компанії
            </Link>
          </div>
        </div>

        <button type="button" onClick={() => { dispatch(clearShiftError()); setIsCreateShiftOpen(true); }} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
          <Plus className="h-4 w-4" />
          Створити зміну
        </button>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg shadow-sm">
        <nav className="flex overflow-x-auto border-b border-border px-1" aria-label="Розділи кабінету компанії">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition-colors sm:px-5 ${isActive ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text"}`}>
              <Icon className="h-4 w-4" />
              {label}
              {to === "applications" && pendingApplicationsCount > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-[var(--radius-pill)] bg-accent px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
                  {pendingApplicationsCount > 99 ? "99+" : pendingApplicationsCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <Outlet context={{
          company: activeCompany,
          shiftsRefreshKey,
          onApplicationsChanged: () => setApplicationsRefreshKey((key) => key + 1),
        } satisfies BusinessDashboardOutletContext} />
      </div>

      <CreateShiftModal
        isOpen={isCreateShiftOpen}
        companyId={activeCompany.id}
        locations={activeCompany.Locations ?? []}
        isSubmitting={isCreatingShift}
        serverError={shiftError}
        onClose={() => setIsCreateShiftOpen(false)}
        onSubmit={handleCreateShift}
        onLocationCreated={refreshCompanyLocations}
      />
    </section>
  );
}

export default BusinessDashboardPage;
